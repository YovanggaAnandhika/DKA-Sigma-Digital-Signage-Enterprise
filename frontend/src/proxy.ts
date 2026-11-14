import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  const url = request.nextUrl.pathname;
  const method = request.method;

  // Log incoming request if not in production (debug mode)
  if (!isProduction) {
    console.log(`[Frontend API] Incoming: ${method} ${url}`);
  }

  const response = NextResponse.next();

  if (!isProduction) {
    console.log(`[Frontend API] Completed: ${method} ${url}`);
  }

  return response;
}

// Only run this middleware for API routes
export const config = {
  matcher: '/api/:path*',
};
