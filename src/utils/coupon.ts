import { Prize } from '../types';

// Character set: A-Z + 0-9 (uppercase). We deliberately exclude visually-confusing
// characters (O vs 0, I vs 1, L) so codes are easy to read/type.
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generate a random 7-character coupon code (letters + digits),
 * cryptographically random so every winner gets a unique, unguessable code.
 */
export function generateCouponCode(): string {
  const buf = new Uint32Array(7);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < 7; i++) buf[i] = Math.floor(Math.random() * 0xffffffff);
  }
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += CHARS[buf[i] % CHARS.length];
  }
  return code;
}

/**
 * Replace a prize's coupon with the right behaviour:
 *  - "پوچ" / non-win prizes  → NO coupon code at all (always cleared).
 *  - Winning prizes (e.g. "ارسال رایگان", % discounts) → a fresh random 7-char code.
 */
export function randomizeCoupon(prize: Prize): Prize {
  const label = prize.label || '';
  const isVoid = prize.isWin === false || /پوچ|متاسفانه|برنده نشدد/.test(label);

  // No coupon for a loss — never generate one.
  if (isVoid) {
    return { ...prize, couponCode: '' };
  }

  // Every winning prize (discounts, free shipping, etc.) gets a unique random code.
  return { ...prize, couponCode: generateCouponCode() };
}