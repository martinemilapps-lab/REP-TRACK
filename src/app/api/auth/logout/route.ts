import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, destroyDbSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await destroyDbSession(token);
    }

    const response = NextResponse.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    const response = NextResponse.json({ success: true, message: 'تم تسجيل الخروج' });
    clearSessionCookie(response);
    return response;
  }
}
