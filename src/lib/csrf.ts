// src/lib/csrf.ts
import { cookies } from 'next/headers';
import { timingSafeEqual } from 'crypto';

export const CSRF_COOKIE = 'csrf_token';

export function verifyCsrfToken(formToken?: string | null): boolean {
  const cookieVal = cookies().get(CSRF_COOKIE)?.value || '';
  const token = String(formToken || '');

  try {
    const a = Buffer.from(cookieVal);
    const b = Buffer.from(token);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
