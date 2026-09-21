import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const outDir = path.join(__dirname, '../src/lib/api/generated');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const protoDir = path.join(__dirname, '../proto');

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

// Use the project root as CWD
const projectRoot = path.join(__dirname, '..');

const command = `bunx grpc_tools_node_protoc \\
    --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \\
    --plugin=protoc-gen-grpc=./node_modules/.bin/grpc_tools_node_protoc_plugin \\
    --js_out=import_style=commonjs,binary:./src/lib/api/generated \\
    --grpc_out=grpc_js:./src/lib/api/generated \\
    --ts_out=grpc_js:./src/lib/api/generated \\
    -I ./proto \\
    ${protoFiles}`;

try {
  console.log('Generating gRPC clients...');
  execSync(command, { cwd: projectRoot, stdio: 'inherit' });
  console.log('Successfully generated gRPC clients in src/lib/api/generated');
} catch (error: any) {
  console.error('Failed to generate gRPC clients:', error.message);
  process.exit(1);
}
