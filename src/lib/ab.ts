// src/lib/ab.ts
import { randomInt } from 'crypto';

export function pickVariant(): 'A' | 'B' {
  return randomInt(0, 2) === 0 ? 'A' : 'B';
}
