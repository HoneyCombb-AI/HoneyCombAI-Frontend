import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, getRealIP } from './app/api/utils/rate-limiter';

import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    try {
      const ip = getRealIP(request);
      const globalLimit = await rateLimiters.globalPerIP(ip);

      if (!globalLimit.allowed) {
        console.log(`Global rate limit exceeded for IP: ${ip}`);
        return NextResponse.json(
          {
            error: 'Too many requests from this IP address',
            resetTime: globalLimit.resetTime
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': '1000',
              'X-RateLimit-Remaining': globalLimit.remaining.toString(),
              'X-RateLimit-Reset': Math.ceil(globalLimit.resetTime / 1000).toString(),
              'Retry-After': Math.ceil((globalLimit.resetTime - Date.now()) / 1000).toString()
            }
          }
        );
      }

      // Call updateSession instead of just returning next()
      // This ensures the session cookie is refreshed if needed
      const response = await updateSession(request);

      // Add rate limit headers to successful responses
      response.headers.set('X-RateLimit-Global-Limit', '1000');
      response.headers.set('X-RateLimit-Global-Remaining', globalLimit.remaining.toString());
      response.headers.set('X-RateLimit-Global-Reset', Math.ceil(globalLimit.resetTime / 1000).toString());
      return response;

    } catch (error) {
      // If Redis is down or there's an error, fail open (allow the request)
      console.error('Middleware rate limiting error:', error);
      // Still update the session
      return await updateSession(request);
    }
  }

  // For non-API routes, just update the session
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};