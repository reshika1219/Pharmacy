import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSessionToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    let username = '';
    let password = '';
    let isFormData = false;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      username = body.username || '';
      password = body.password || '';
    } else {
      isFormData = true;
      const formData = await req.formData();
      username = (formData.get('username') as string) || '';
      password = (formData.get('password') as string) || '';
    }

    if (!username || !password) {
      if (isFormData) {
        return NextResponse.redirect(new URL('/login?error=Missing%20credentials', req.url), 303);
      }
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (!user) {
      if (isFormData) {
        return NextResponse.redirect(new URL('/login?error=Invalid%20credentials', req.url), 303);
      }
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      if (isFormData) {
        return NextResponse.redirect(new URL('/login?error=Invalid%20credentials', req.url), 303);
      }
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    };

    const token = await createSessionToken(payload);

    // If native HTML form submit, redirect directly to dashboard or POS
    if (isFormData) {
      const redirectUrl = user.role === 'cashier' ? '/pos' : '/';
      const response = NextResponse.redirect(new URL(redirectUrl, req.url), 303);
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    // JSON response for fetch/AJAX
    const res = NextResponse.json({
      success: true,
      user: payload,
      token,
    });

    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
