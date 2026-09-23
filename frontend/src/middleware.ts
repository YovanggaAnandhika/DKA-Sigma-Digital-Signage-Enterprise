import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  const url = request.nextUrl.pathname;
  const method = request.method;

  // Log incoming request if not in production (debug mode)
  if (!isProduction) {
    console.log(`[Frontend API] Incoming: ${method} ${url}`);
  }

  const response = NextResponse.next();

  // If the response is an error (status 400 or above), log it as an error
  if (response.status >= 400) {
    console.error(`[Frontend API] ERROR ${response.status}: ${method} ${url}`);
  } else if (!isProduction) {
    console.log(`[Frontend API] Success ${response.status}: ${method} ${url}`);
  }

  return response;
}

// Only run this middleware for API routes
export const config = {
  matcher: '/api/:path*',
};
