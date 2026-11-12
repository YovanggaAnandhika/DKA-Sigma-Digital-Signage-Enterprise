import { inflateSync } from 'fflate';

export interface ApkMetadata {
  packageName: string;
  versionName: string;
  versionCode: number;
}

const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const CENTRAL_DIRECTORY_FILE_HEADER = 0x02014b50;
const LOCAL_FILE_HEADER = 0x04034b50;
const ANDROID_MANIFEST = 'AndroidManifest.xml';
const MAX_MANIFEST_SIZE = 1024 * 1024;
const NO_INDEX = 0xffffffff;

export async function readApkMetadata(file: File): Promise<ApkMetadata> {
  const manifest = await readManifestEntry(file);
  return parseAndroidBinaryManifest(manifest);
}

export function parseAndroidBinaryManifest(bytes: Uint8Array): ApkMetadata {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 8 || view.getUint16(0, true) !== 0x0003) {
    throw new Error('Manifest APK tidak valid.');
  }

  const xmlSize = view.getUint32(4, true);
  if (xmlSize > bytes.length || xmlSize < 8) throw new Error('Manifest APK terpotong.');

  let strings: string[] | null = null;
  let packageName: string | null = null;
  let versionName: string | null = null;
  let versionCode: number | null = null;
  let versionCodeMajor = 0;

  for (let offset = view.getUint16(2, true); offset < xmlSize;) {
    ensureRange(offset, 8, xmlSize);
    const type = view.getUint16(offset, true);
    const headerSize = view.getUint16(offset + 2, true);
    const chunkSize = view.getUint32(offset + 4, true);
    if (headerSize < 8 || chunkSize < headerSize || offset + chunkSize > xmlSize) {
      throw new Error('Struktur manifest APK tidak valid.');
    }

    if (type === 0x0001) {
      strings = parseStringPool(view, offset, headerSize, chunkSize);
    } else if (type === 0x0102 && strings) {
      const extension = offset + headerSize;
      ensureRange(extension, 20, offset + chunkSize);
      if (getString(strings, view.getUint32(extension + 4, true)) === 'manifest') {
        const attributeStart = view.getUint16(extension + 8, true);
        const attributeSize = view.getUint16(extension + 10, true);
        const attributeCount = view.getUint16(extension + 12, true);
        if (attributeStart < 20 || attributeSize < 20) {
          throw new Error('Atribut manifest APK tidak valid.');
        }
        const attributes = extension + attributeStart;
        ensureRange(attributes, attributeSize * attributeCount, offset + chunkSize);

        for (let index = 0; index < attributeCount; index++) {
          const attribute = attributes + index * attributeSize;
          const name = getString(strings, view.getUint32(attribute + 4, true));
          const rawValue = view.getUint32(attribute + 8, true);
          const valueType = view.getUint8(attribute + 15);
          const valueData = view.getUint32(attribute + 16, true);
          const stringValue = rawValue === NO_INDEX
            ? (valueType === 0x03 ? getString(strings, valueData) : null)
            : getString(strings, rawValue);

          if (name === 'package') packageName = stringValue;
          if (name === 'versionName') versionName = stringValue;
          if (name === 'versionCode') {
            versionCode = valueType === 0x10 || valueType === 0x11
              ? valueData
              : parseInteger(stringValue);
          }
          if (name === 'versionCodeMajor') {
            versionCodeMajor = valueType === 0x10 || valueType === 0x11
              ? valueData
              : parseInteger(stringValue) ?? 0;
          }
        }
      }
    }

    offset += chunkSize;
  }

  if (!packageName || !versionName || versionCode === null) {
    throw new Error('APK tidak memiliki package name, version name, atau version code yang valid.');
  }
  if (versionCodeMajor !== 0 || versionCode > 0x7fffffff) {
    throw new Error('APK memakai version code di luar rentang yang didukung rilis.');
  }

  return { packageName, versionName, versionCode };
}

async function readManifestEntry(file: File): Promise<Uint8Array> {
  const tailSize = Math.min(file.size, 22 + 0xffff);
  const tailStart = file.size - tailSize;
  const tailBytes = new Uint8Array(await file.slice(tailStart).arrayBuffer());
  const tail = new DataView(tailBytes.buffer, tailBytes.byteOffset, tailBytes.byteLength);
  let endOffset = -1;

  for (let offset = tailSize - 22; offset >= 0; offset--) {
    if (
      tail.getUint32(offset, true) === END_OF_CENTRAL_DIRECTORY &&
      offset + 22 + tail.getUint16(offset + 20, true) === tailSize
    ) {
      endOffset = offset;
      break;
    }
  }
  if (endOffset < 0) throw new Error('Berkas yang dipilih bukan APK/ZIP yang valid.');

  const diskNumber = tail.getUint16(endOffset + 4, true);
  const centralDirectoryDisk = tail.getUint16(endOffset + 6, true);
  const entries = tail.getUint16(endOffset + 10, true);
  const directorySize = tail.getUint32(endOffset + 12, true);
  const directoryOffset = tail.getUint32(endOffset + 16, true);
  if (
    diskNumber !== 0 ||
    centralDirectoryDisk !== 0 ||
    directorySize === NO_INDEX ||
    directoryOffset === NO_INDEX ||
    directoryOffset + directorySize > file.size
  ) {
    throw new Error('Format ZIP APK tidak didukung.');
  }

  const directoryBytes = new Uint8Array(
    await file.slice(directoryOffset, directoryOffset + directorySize).arrayBuffer()
  );
  const directory = new DataView(
    directoryBytes.buffer,
    directoryBytes.byteOffset,
    directoryBytes.byteLength
  );

  for (let offset = 0, index = 0; index < entries; index++) {
    ensureRange(offset, 46, directoryBytes.length);
    if (directory.getUint32(offset, true) !== CENTRAL_DIRECTORY_FILE_HEADER) {
      throw new Error('Direktori APK tidak valid.');
    }

    const flags = directory.getUint16(offset + 8, true);
    const compression = directory.getUint16(offset + 10, true);
    const compressedSize = directory.getUint32(offset + 20, true);
    const uncompressedSize = directory.getUint32(offset + 24, true);
    const nameLength = directory.getUint16(offset + 28, true);
    const extraLength = directory.getUint16(offset + 30, true);
    const commentLength = directory.getUint16(offset + 32, true);
    const localHeaderOffset = directory.getUint32(offset + 42, true);
    const nameStart = offset + 46;
    ensureRange(nameStart, nameLength + extraLength + commentLength, directoryBytes.length);
    const name = new TextDecoder().decode(directoryBytes.subarray(nameStart, nameStart + nameLength));

    if (name === ANDROID_MANIFEST) {
      if ((flags & 1) !== 0 || compressedSize === NO_INDEX || uncompressedSize === NO_INDEX) {
        throw new Error('Entri manifest APK tidak didukung.');
      }
      if (uncompressedSize > MAX_MANIFEST_SIZE || compressedSize > MAX_MANIFEST_SIZE) {
        throw new Error('Manifest APK terlalu besar.');
      }

      const localHeaderBytes = new Uint8Array(
        await file.slice(localHeaderOffset, localHeaderOffset + 30).arrayBuffer()
      );
      const localHeader = new DataView(
        localHeaderBytes.buffer,
        localHeaderBytes.byteOffset,
        localHeaderBytes.byteLength
      );
      if (
        localHeaderBytes.length < 30 ||
        localHeader.getUint32(0, true) !== LOCAL_FILE_HEADER
      ) {
        throw new Error('Header manifest APK tidak valid.');
      }

      const dataOffset = localHeaderOffset + 30 +
        localHeader.getUint16(26, true) + localHeader.getUint16(28, true);
      if (dataOffset + compressedSize > file.size) throw new Error('Data manifest APK terpotong.');
      const data = new Uint8Array(await file.slice(dataOffset, dataOffset + compressedSize).arrayBuffer());
      const manifest = compression === 0
        ? data
        : compression === 8
          ? inflateSync(data)
          : null;
      if (!manifest || manifest.length !== uncompressedSize) {
        throw new Error('Kompresi manifest APK tidak valid atau tidak didukung.');
      }
      return manifest;
    }

    offset = nameStart + nameLength + extraLength + commentLength;
  }

  throw new Error('AndroidManifest.xml tidak ditemukan di dalam APK.');
}

function parseStringPool(
  view: DataView,
  offset: number,
  headerSize: number,
  chunkSize: number
): string[] {
  ensureRange(offset, 28, offset + chunkSize);
  const stringCount = view.getUint32(offset + 8, true);
  const flags = view.getUint32(offset + 16, true);
  const stringsStart = view.getUint32(offset + 20, true);
  if (stringCount > 20000 || headerSize + stringCount * 4 > chunkSize) {
    throw new Error('String pool manifest APK tidak valid.');
  }

  const strings: string[] = [];
  const isUtf8 = (flags & 0x100) !== 0;
  for (let index = 0; index < stringCount; index++) {
    const stringOffset = view.getUint32(offset + headerSize + index * 4, true);
    let position = offset + stringsStart + stringOffset;
    ensureRange(position, 1, offset + chunkSize);

    if (isUtf8) {
      position = readLength8(view, position).next;
      const byteLength = readLength8(view, position);
      ensureRange(byteLength.next, byteLength.length, offset + chunkSize);
      strings.push(new TextDecoder().decode(
        new Uint8Array(view.buffer, view.byteOffset + byteLength.next, byteLength.length)
      ));
    } else {
      const characterLength = readLength16(view, position);
      const byteLength = characterLength.length * 2;
      ensureRange(characterLength.next, byteLength, offset + chunkSize);
      strings.push(new TextDecoder('utf-16le').decode(
        new Uint8Array(view.buffer, view.byteOffset + characterLength.next, byteLength)
      ));
    }
  }
  return strings;
}

function readLength8(view: DataView, offset: number): { length: number; next: number } {
  ensureRange(offset, 1, view.byteLength);
  const first = view.getUint8(offset);
  if ((first & 0x80) === 0) return { length: first, next: offset + 1 };
  ensureRange(offset, 2, view.byteLength);
  return { length: ((first & 0x7f) << 8) | view.getUint8(offset + 1), next: offset + 2 };
}

function readLength16(view: DataView, offset: number): { length: number; next: number } {
  ensureRange(offset, 2, view.byteLength);
  const first = view.getUint16(offset, true);
  if ((first & 0x8000) === 0) return { length: first, next: offset + 2 };
  ensureRange(offset, 4, view.byteLength);
  return {
    length: ((first & 0x7fff) << 16) | view.getUint16(offset + 2, true),
    next: offset + 4,
  };
}

function getString(strings: string[], index: number): string | null {
  return index === NO_INDEX ? null : strings[index] ?? null;
}

function parseInteger(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function ensureRange(offset: number, length: number, end: number): void {
  if (offset < 0 || length < 0 || offset + length > end) {
    throw new Error('Data APK tidak lengkap atau rusak.');
  }
}
