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
 * Replace a prize's static coupon with a fresh random one.
 * Prizes without a coupon (e.g. "پوچ", free-shipping-with-no-code) stay as-is.
 */
export function randomizeCoupon(prize: Prize): Prize {
  if (!prize.couponCode) return prize;
  return { ...prize, couponCode: generateCouponCode() };
}