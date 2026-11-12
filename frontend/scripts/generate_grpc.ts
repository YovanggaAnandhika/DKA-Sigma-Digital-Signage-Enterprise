import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const outDir = path.join(__dirname, '../src/lib/api');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Point directly to the backend's proto folder
const protoDir = path.join(__dirname, '../../backend/proto');

const getAllFiles = (dirPath: string, arrayOfFiles?: string[]): string[] => {
  const files = fs.readdirSync(dirPath);
  let result = arrayOfFiles || [];
  files.forEach((file) => {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      result = getAllFiles(path.join(dirPath, file), result);
    } else if (file.endsWith('.proto')) {
      const relativePath = path.relative(path.join(__dirname, '..'), path.join(dirPath, file));
      result.push(relativePath);
    }
  });
  return result;
};

// Use the frontend root as CWD
const projectRoot = path.join(__dirname, '..');
const protoFiles = getAllFiles(protoDir).map((file) => path.relative(projectRoot, file));

try {
  console.log('Generating gRPC clients from backend protos...');
  execFileSync(
    path.join(projectRoot, 'node_modules/grpc-tools/bin/protoc'),
    [
      `--plugin=protoc-gen-grpc=${path.join(projectRoot, 'node_modules/grpc-tools/bin/grpc_node_plugin')}`,
      `--plugin=protoc-gen-ts=${path.join(projectRoot, 'node_modules/.bin/protoc-gen-ts')}`,
      '--js_out=import_style=commonjs,binary:./src/lib/api',
      '--grpc_out=grpc_js:./src/lib/api',
      '--ts_out=grpc_js:./src/lib/api',
      '-I',
      '../backend/proto',
      ...protoFiles,
    ],
    { cwd: projectRoot, stdio: 'inherit' },
  );
  console.log('Successfully generated gRPC clients in src/lib/api');
} catch (error) {
  console.error('Failed to generate gRPC clients:', error);
  process.exit(1);
}
