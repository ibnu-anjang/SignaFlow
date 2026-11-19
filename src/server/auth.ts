import { SignJWT, jwtVerify } from 'jose';
import type { NextResponse } from 'next/server';
import type { AuthUserDTO, UserRole } from '@/types/contracts';
import { getJwtSecret } from '@/server/env';

export const SESSION_COOKIE_NAME = 'signaflow_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface SessionJwtPayload {
  sub: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export async function signAdminSession(user: AuthUserDTO): Promise<string> {
  return new SignJWT({
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifyAdminSession(token: string): Promise<AuthUserDTO | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ['HS256'],
    });

    const data = payload as unknown as Partial<SessionJwtPayload>;
    if (!data.sub || !data.email || !data.fullName || !data.role) {
      return null;
    }

    return {
      id: data.sub,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}
