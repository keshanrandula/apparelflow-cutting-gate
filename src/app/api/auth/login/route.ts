import { NextResponse } from 'next/server';
import { loginSchema } from '@/server/validators/auth.schema';
import { loginUser } from '@/server/services/auth.service';
import { handleError } from '@/server/http';
import { AUTH_COOKIE_NAME, TOKEN_EXPIRY_SECONDS } from '@/server/auth/session';
import { checkRateLimit, resetRateLimit } from '@/server/auth/rateLimiter';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous-ip';
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Apply rate limit per IP + email combination
    const rateLimitKey = `${ip}:${validatedData.email.toLowerCase()}`;
    checkRateLimit(rateLimitKey, 5, 60 * 1000);

    const { token, user } = await loginUser(validatedData);

    // On successful login, reset counter
    resetRateLimit(rateLimitKey);

    const response = NextResponse.json(
      {
        success: true,
        data: { user },
      },
      { status: 200 }
    );

    // Set secure httpOnly cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: TOKEN_EXPIRY_SECONDS,
    });

    return response;
  } catch (error) {
    return handleError(error);
  }
}
