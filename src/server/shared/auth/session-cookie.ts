import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const SESSION_COOKIE = 'sgb_session';

function options(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

export async function readSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export const SESSION_MAX_AGE = 60 * 60 * 24;

export function jsonWithSession(body: unknown, token: string, status = 200) {
  const response = NextResponse.json(body, { status });
  response.cookies.set(SESSION_COOKIE, token, options(SESSION_MAX_AGE));
  return response;
}

export function attachSession(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, options(SESSION_MAX_AGE));
  return response;
}

export function jsonWithoutSession() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', options(0));
  return response;
}
