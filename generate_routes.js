const fs = require('fs');
const path = require('path');

const resources = [
  {
    name: 'Transition',
    protoPackage: 'studio/v1/transition',
    grpcFile: 'transition_grpc_pb',
    commonFile: 'transition.common_pb',
    fields: [
      { name: 'name', type: 'string' },
      { name: 'cssClass', type: 'string', jsonName: 'css_class' },
      { name: 'durationMs', type: 'number', jsonName: 'duration_ms' },
    ]
  },
  {
    name: 'VisualFilter',
    protoPackage: 'studio/v1/visual_filter',
    grpcFile: 'visual_filter_grpc_pb',
    commonFile: 'visual_filter.common_pb',
    fields: [
      { name: 'name', type: 'string' },
      { name: 'brightness', type: 'number' },
      { name: 'contrast', type: 'number' },
      { name: 'saturation', type: 'number' },
      { name: 'grayscale', type: 'number' },
      { name: 'blurPx', type: 'number', jsonName: 'blur_px' },
    ]
  }
];

const basePath = path.join(__dirname, 'frontend/src/app/(api)/api/grpc');

for (const res of resources) {
  const dirName = res.name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  
  // List
  const listDir = path.join(basePath, dirName, `List${res.name}s`);
  fs.mkdirSync(listDir, { recursive: true });
  fs.writeFileSync(path.join(listDir, 'route.ts'), `import { NextRequest, NextResponse } from 'next/server';
import { ${res.name}ServiceClient } from '@/lib/api/${res.protoPackage}/${res.grpcFile}';
import { List${res.name}sRequest } from '@/lib/api/${res.protoPackage}/${res.commonFile}';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = getTokenFromRequest(req);
    const client = new ${res.name}ServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new List${res.name}sRequest();
    
    return new Promise<NextResponse>((resolve) => {
      client.list${res.name}s(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`);

  // Get
  const getDir = path.join(basePath, dirName, `Get${res.name}`);
  fs.mkdirSync(getDir, { recursive: true });
  fs.writeFileSync(path.join(getDir, 'route.ts'), `import { NextRequest, NextResponse } from 'next/server';
import { ${res.name}ServiceClient } from '@/lib/api/${res.protoPackage}/${res.grpcFile}';
import { Get${res.name}Request } from '@/lib/api/${res.protoPackage}/${res.commonFile}';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new ${res.name}ServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new Get${res.name}Request();
    if (body.id) request.setId(body.id);
    
    return new Promise<NextResponse>((resolve) => {
      client.get${res.name}(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`);

  // Create
  const createDir = path.join(basePath, dirName, `Create${res.name}`);
  fs.mkdirSync(createDir, { recursive: true });
  
  const createSetters = res.fields.map(f => `    if (body.${f.name} !== undefined) request.set${f.name.charAt(0).toUpperCase() + f.name.slice(1)}(body.${f.name});\n    if (body.${f.jsonName || f.name} !== undefined) request.set${f.name.charAt(0).toUpperCase() + f.name.slice(1)}(body.${f.jsonName || f.name});`).join('\n');
  
  fs.writeFileSync(path.join(createDir, 'route.ts'), `import { NextRequest, NextResponse } from 'next/server';
import { ${res.name}ServiceClient } from '@/lib/api/${res.protoPackage}/${res.grpcFile}';
import { Create${res.name}Request } from '@/lib/api/${res.protoPackage}/${res.commonFile}';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new ${res.name}ServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new Create${res.name}Request();
${createSetters}
    
    return new Promise<NextResponse>((resolve) => {
      client.create${res.name}(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`);

  // Update
  const updateDir = path.join(basePath, dirName, `Update${res.name}`);
  fs.mkdirSync(updateDir, { recursive: true });
  fs.writeFileSync(path.join(updateDir, 'route.ts'), `import { NextRequest, NextResponse } from 'next/server';
import { ${res.name}ServiceClient } from '@/lib/api/${res.protoPackage}/${res.grpcFile}';
import { Update${res.name}Request } from '@/lib/api/${res.protoPackage}/${res.commonFile}';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new ${res.name}ServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new Update${res.name}Request();
    if (body.id) request.setId(body.id);
${createSetters}
    
    return new Promise<NextResponse>((resolve) => {
      client.update${res.name}(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`);

  // Delete
  const deleteDir = path.join(basePath, dirName, `Delete${res.name}`);
  fs.mkdirSync(deleteDir, { recursive: true });
  fs.writeFileSync(path.join(deleteDir, 'route.ts'), `import { NextRequest, NextResponse } from 'next/server';
import { ${res.name}ServiceClient } from '@/lib/api/${res.protoPackage}/${res.grpcFile}';
import { Delete${res.name}Request } from '@/lib/api/${res.protoPackage}/${res.commonFile}';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new ${res.name}ServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new Delete${res.name}Request();
    if (body.id) request.setId(body.id);
    
    return new Promise<NextResponse>((resolve) => {
      client.delete${res.name}(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
`);
}

console.log('Routes generated');
