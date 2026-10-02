import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('devqa_session')?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      role: session.role,
    },
  });
}
