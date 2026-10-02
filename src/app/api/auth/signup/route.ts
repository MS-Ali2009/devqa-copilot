import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser, getUserByEmail, getUserCount } from '@/lib/db/user-repo';
import { hashPassword } from '@/lib/auth/password';
import { signSession } from '@/lib/auth/jwt';

const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address format' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = signupSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    // Determine user role (owner if first user or matches OWNER_EMAIL)
    const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase().trim();
    const isFirstUser = (await getUserCount()) === 0;
    const isOwner = isFirstUser || (ownerEmail && normalizedEmail === ownerEmail);
    const role: 'owner' | 'user' = isOwner ? 'owner' : 'user';

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user in DB
    const newUser = await createUser(normalizedEmail, hashedPassword, role);
    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to create user account. Please check database connection.' },
        { status: 500 }
      );
    }

    // Sign JWT session token
    const token = await signSession({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    });

    // Set 7-day httpOnly session cookie
    response.cookies.set('devqa_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[Signup API] Unexpected failure:', err);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred during signup.' },
      { status: 500 }
    );
  }
}
