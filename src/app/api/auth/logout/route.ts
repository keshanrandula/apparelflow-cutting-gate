import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/server/auth/session';
import { handleError } from '@/server/http';

export async function POST() {
  try {
    const response = NextResponse.json(
      {
        success: true,
        data: { message: 'Logged out successfully' },
      },
      { status: 200 }
    );

    // Clear the auth cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    return handleError(error);
  }
}
