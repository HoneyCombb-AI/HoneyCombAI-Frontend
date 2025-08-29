import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimiters, getRealIP } from '@/app/api/utils/rate-limiter';

const supportSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Please enter a valid email address'),
  title: z.string().optional().default('Support Request'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getRealIP(request);
    
    // Rate limiting: 10 messages per hour per IP
    const rateLimitResult = await rateLimiters.supportPerIP(ip);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime 
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    supportSchema.parse(body);

    // Return success - frontend can now send email
    return NextResponse.json(
      { 
        success: true,
        message: 'Validation successful, you can send email',
        remaining: rateLimitResult.remaining
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Support API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process support request' },
      { status: 500 }
    );
  }
}