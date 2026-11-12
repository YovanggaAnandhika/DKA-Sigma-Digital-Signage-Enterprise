import { expect, test } from 'bun:test';
import { zipSync } from 'fflate';
import { readApkMetadata } from './apkMetadata.ts';

function createBinaryManifest() {
  const strings = ['manifest', 'package', 'com.dkaapis.sigma', 'versionCode', 'versionName', '1.0.1'];
  const encoder = new TextEncoder();
  const encodedStrings = strings.map((value) => {
    const bytes = encoder.encode(value);
    return new Uint8Array([value.length, bytes.length, ...bytes, 0]);
  });
  const stringDataSize = encodedStrings.reduce((size, value) => size + value.length, 0);
  const stringPoolSize = 28 + strings.length * 4 + stringDataSize;
  const stringPool = new Uint8Array(stringPoolSize);
  const pool = new DataView(stringPool.buffer);
  pool.setUint16(0, 0x0001, true);
  pool.setUint16(2, 28, true);
  pool.setUint32(4, stringPoolSize, true);
  pool.setUint32(8, strings.length, true);
  pool.setUint32(16, 0x100, true);
  pool.setUint32(20, 28 + strings.length * 4, true);

  let stringOffset = 0;
  let dataOffset = 28 + strings.length * 4;
  encodedStrings.forEach((value, index) => {
    pool.setUint32(28 + index * 4, stringOffset, true);
    stringPool.set(value, dataOffset);
    stringOffset += value.length;
    dataOffset += value.length;
  });

  const attributes = [
    { name: 1, raw: 2, type: 0x03, data: 2 },
    { name: 3, raw: 0xffffffff, type: 0x10, data: 2 },
    { name: 4, raw: 5, type: 0x03, data: 5 },
  ];
  const elementSize = 16 + 20 + attributes.length * 20;
  const element = new Uint8Array(elementSize);
  const elementView = new DataView(element.buffer);
  elementView.setUint16(0, 0x0102, true);
  elementView.setUint16(2, 16, true);
  elementView.setUint32(4, elementSize, true);
  elementView.setUint32(8, 1, true);
  elementView.setUint32(12, 0xffffffff, true);
  elementView.setUint32(16, 0xffffffff, true);
  elementView.setUint32(20, 0, true);
  elementView.setUint16(24, 20, true);
  elementView.setUint16(26, 20, true);
  elementView.setUint16(28, attributes.length, true);
  attributes.forEach((attribute, index) => {
    const offset = 36 + index * 20;
    elementView.setUint32(offset, 0xffffffff, true);
    elementView.setUint32(offset + 4, attribute.name, true);
    elementView.setUint32(offset + 8, attribute.raw, true);
    elementView.setUint16(offset + 12, 8, true);
    elementView.setUint8(offset + 15, attribute.type);
    elementView.setUint32(offset + 16, attribute.data, true);
  });

  const xml = new Uint8Array(8 + stringPoolSize + elementSize);
  const xmlView = new DataView(xml.buffer);
  xmlView.setUint16(0, 0x0003, true);
  xmlView.setUint16(2, 8, true);
  xmlView.setUint32(4, xml.length, true);
  xml.set(stringPool, 8);
  xml.set(element, 8 + stringPoolSize);
  return xml;
}

test('reads APK version metadata from a compressed binary manifest', async () => {
  const apk = new File([
    zipSync({ 'AndroidManifest.xml': createBinaryManifest() }, { level: 6 }),
  ], 'player.apk');

  await expect(readApkMetadata(apk)).resolves.toEqual({
    packageName: 'com.dkaapis.sigma',
    versionName: '1.0.1',
    versionCode: 2,
  });
});
