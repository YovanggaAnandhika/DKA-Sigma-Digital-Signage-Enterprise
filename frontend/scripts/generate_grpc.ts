import { execSync } from 'child_process';
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

const protoFiles = getAllFiles(protoDir).join(' ');

// Use the frontend root as CWD
const projectRoot = path.join(__dirname, '..');

const command = `bunx grpc_tools_node_protoc \\
    --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \\
    --plugin=protoc-gen-grpc=./node_modules/.bin/grpc_tools_node_protoc_plugin \\
    --js_out=import_style=commonjs,binary:./src/lib/api \\
    --grpc_out=grpc_js:./src/lib/api \\
    --ts_out=grpc_js:./src/lib/api \\
    -I ../backend/proto \\
    ${protoFiles}`;

try {
  console.log('Generating gRPC clients from backend protos...');
  execSync(command, { cwd: projectRoot, stdio: 'inherit' });
  console.log('Successfully generated gRPC clients in src/lib/api');
} catch (error: any) {
  console.error('Failed to generate gRPC clients:', error.message);
  process.exit(1);
}
