import { NextRequest, NextResponse } from 'next/server';
import {
  createDbSession,
  setSessionCookie,
  verifyPassword,
  checkRateLimit,
  recordFailedLogin,
  resetRateLimit,
} from '@/lib/auth';
import { db, users } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // 1. Rate Limiting Check
    const rateCheck = await checkRateLimit(ip);
    if (rateCheck.locked) {
      return NextResponse.json(
        {
          success: false,
          message: `تم حظر المحاولات مؤقتاً بسبب تكرار الأخطاء. يرجى المحاولة بعد ${rateCheck.remainingMinutes} دقيقة.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, password } = body;

    if (!password) {
      return NextResponse.json({ success: false, message: 'كلمة السر مطلوبة' }, { status: 400 });
    }

    // 2. Authenticate User
    if (username && typeof username === 'string') {
      const cleanUsername = username.toLowerCase().trim();
      const user = await db
        .select()
        .from(users)
        .where(sql`lower(${users.username}) = ${cleanUsername}`)
        .get();

      if (!user || !verifyPassword(password, user.passwordHash)) {
        await recordFailedLogin(ip);
        return NextResponse.json(
          { success: false, message: 'اسم المستخدم أو كلمة السر غير صحيحة' },
          { status: 401 }
        );
      }

      await resetRateLimit(ip);
      const sessionToken = await createDbSession(user.id);

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          repId: user.repId,
        },
      });

      setSessionCookie(response, sessionToken);
      return response;
    }

    // 3. Fallback: Manager Password Direct Entry (Manager Auth Gate)
    const managerUser = await db
      .select()
      .from(users)
      .where(eq(users.role, 'MANAGER'))
      .get();

    let isManagerValid = false;
    if (managerUser) {
      isManagerValid = verifyPassword(password, managerUser.passwordHash);
    }
    if (!isManagerValid && password === (process.env.MANAGER_DEFAULT_PASSWORD || '22515215monna')) {
      isManagerValid = true;
    }

    if (!isManagerValid || !managerUser) {
      await recordFailedLogin(ip);
      return NextResponse.json(
        { success: false, message: 'كلمة السر غير صحيحة' },
        { status: 401 }
      );
    }

    await resetRateLimit(ip);
    const sessionToken = await createDbSession(managerUser.id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: managerUser.id,
        username: managerUser.username,
        name: managerUser.name,
        role: managerUser.role,
        repId: managerUser.repId,
      },
    });

    setSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}
