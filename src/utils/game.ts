import { Prize } from '../types';

/**
 * انتخاب ایندکس جایزه بر اساس «شانس» (probability).
 *
 * نکته: مقدارها را روی مجموع حقیقی نرمال می‌کند، پس مهم نیست که
 * عددها دقیقاً جمعشان ۱۰۰ باشد یا خیر — وزن نسبی هر جایزه درست می‌ماند.
 */
export function pickPrizeIndexByProbability(prizes: Prize[]): number {
  if (!prizes || prizes.length === 0) return 0;

  const total = prizes.reduce((sum, p) => sum + (p.probability || 0), 0);

  // اگر همه شانس‌ها صفر/نادقیق باشد → شانس مساوی
  if (total <= 0) {
    return Math.floor(Math.random() * prizes.length);
  }

  let r = Math.random() * total;
  for (let i = 0; i < prizes.length; i++) {
    r -= prizes[i].probability || 0;
    if (r <= 0) return i;
  }
  return prizes.length - 1;
}

/** نسخه‌ی راحت‌تر که خود «جایزه» را برمی‌گرداند */
export function pickPrizeByProbability(prizes: Prize[]): Prize | undefined {
  if (!prizes || prizes.length === 0) return undefined;
  return prizes[pickPrizeIndexByProbability(prizes)];
}