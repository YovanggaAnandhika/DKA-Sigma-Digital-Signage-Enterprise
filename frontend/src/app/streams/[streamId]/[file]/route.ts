import { NextRequest, NextResponse } from 'next/server';

const backendMediaUrl = (
  process.env.BACKEND_MEDIA_URL || 'http://dka-product-sigma-backend:50052'
).replace(/\/$/, '');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': 'Location',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ streamId: string; file: string }> }
) {
  const { streamId, file } = await params;
  if (!streamId || file !== 'status') {
    return new NextResponse(null, { status: 404, headers: CORS_HEADERS });
  }

  try {
    const res = await fetch(`${backendMediaUrl}/api/media/streams/${streamId}/status`, {
      cache: 'no-store',
    });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    });
  } catch {
    return new NextResponse(JSON.stringify({ live: false, subscribers: 0 }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ streamId: string; file: string }> }
) {
  const { streamId, file } = await params;
  if (!streamId || (file !== 'whep' && file !== 'whip')) {
    return new NextResponse('Invalid endpoint', { status: 400, headers: CORS_HEADERS });
  }

  try {
    const sdpOffer = await req.text();
    const headers: Record<string, string> = { 'Content-Type': 'application/sdp' };
    const authHeader = req.headers.get('authorization');
    if (authHeader) headers['Authorization'] = authHeader;

    const upstream = await fetch(`${backendMediaUrl}/api/media/streams/${streamId}/${file}`, {
      method: 'POST',
      headers,
      body: sdpOffer,
      cache: 'no-store',
    });

    const body = await upstream.text().catch(() => '');
    const responseHeaders: Record<string, string> = {
      ...CORS_HEADERS,
      'Content-Type': upstream.ok ? 'application/sdp' : 'text/plain; charset=utf-8',
    };
    const loc = upstream.headers.get('location');
    if (loc) responseHeaders['Location'] = loc;
    const wwwAuth = upstream.headers.get('www-authenticate');
    if (wwwAuth) responseHeaders['WWW-Authenticate'] = wwwAuth;

    return new Response(body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return new NextResponse(null, { status: 502, headers: CORS_HEADERS });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ streamId: string; file: string }> }
) {
  const { streamId, file } = await params;
  if (!streamId || (file !== 'whip' && file !== 'whep')) {
    return new NextResponse('Invalid endpoint', { status: 400, headers: CORS_HEADERS });
  }

  const headers: Record<string, string> = {};
  const authHeader = req.headers.get('authorization');
  if (authHeader) headers['Authorization'] = authHeader;
  const search = req.nextUrl.search || '';

  const upstream = await fetch(
    `${backendMediaUrl}/api/media/streams/${streamId}/${file}${search}`,
    {
      method: 'DELETE',
      headers,
      cache: 'no-store',
    }
  ).catch(() => null);

  return new Response(null, {
    status: upstream?.status || 200,
    headers: CORS_HEADERS,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ streamId: string; file: string }> }
) {
  const { streamId, file } = await params;
  if (!streamId || (file !== 'whip' && file !== 'whep')) {
    return new NextResponse('Invalid endpoint', { status: 400, headers: CORS_HEADERS });
  }

  const body = await req.text().catch(() => '');
  const search = req.nextUrl.search || '';
  const upstream = await fetch(
    `${backendMediaUrl}/api/media/streams/${streamId}/${file}${search}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': req.headers.get('content-type') || 'application/trickle-ice-sdpfrag',
      },
      body,
      cache: 'no-store',
    }
  ).catch(() => null);

  return new Response(upstream ? await upstream.text() : null, {
    status: upstream?.status || 204,
    headers: CORS_HEADERS,
  });
}
