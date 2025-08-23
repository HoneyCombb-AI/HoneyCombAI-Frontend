import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, getRealIP } from './app/api/utils/rate-limiter';

export async function middleware(request: NextRequest) {
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
      // Add rate limit headers to successful responses
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Global-Limit', '1000');
      response.headers.set('X-RateLimit-Global-Remaining', globalLimit.remaining.toString());
      response.headers.set('X-RateLimit-Global-Reset', Math.ceil(globalLimit.resetTime / 1000).toString());
      return response;
    } catch (error) {
      // If Redis is down or there's an error, fail open (allow the request)
      console.error('Middleware rate limiting error:', error);
      return NextResponse.next();
    }
  }
  return NextResponse.next();
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