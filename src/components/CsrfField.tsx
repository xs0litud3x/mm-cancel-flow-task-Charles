'use client';

import { useEffect, useState } from 'react';

const COOKIE = 'csrf_token';

function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function setCookie(name: string, value: string) {
  // SameSite=Lax protects normal cross-site POSTs; HttpOnly not needed for double-submit pattern
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
}

function randomToken(): string {
  // 32 bytes → base64url string
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let str = '';
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export default function CsrfField() {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const existing = getCookie(COOKIE);
    if (existing) {
      setToken(existing);
    } else {
      const t = randomToken();
      setCookie(COOKIE, t);
      setToken(t);
    }
  }, []);

  // Even if token is briefly empty on first paint, it will be set before submit
  return <input type="hidden" name="csrf" value={token} />;
}
