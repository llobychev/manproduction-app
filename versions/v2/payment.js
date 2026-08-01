export const PAYMENT_MANAGER_USERNAME = 'job_bylobychevinsibir';
export const TRANSFER_CARD_DISPLAY = '2200 0117 9022 3078';

export const PAYMENT_PLANS = Object.freeze({
  '1m': Object.freeze({ label:'1 месяц', rub:5000, stars:4270 }),
  '3m': Object.freeze({ label:'3 месяца', rub:14000, stars:11965 }),
  '6m': Object.freeze({ label:'6 месяцев', rub:27000, stars:23077 }),
  '12m': Object.freeze({ label:'12 месяцев', rub:49000, stars:41880 })
});

export function formatRub(value) {
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
}

export function discountedPlan(planId, discountPct = 0) {
  const plan = PAYMENT_PLANS[planId];
  if (!plan) return null;
  const safePct = Math.min(100, Math.max(0, Number(discountPct) || 0));
  return Object.freeze({ ...plan, id:planId, discountPct:safePct, finalRub:Math.round(plan.rub * (1 - safePct / 100)), finalStars:Math.round(plan.stars * (1 - safePct / 100)) });
}

export function managerPaymentLink(planId, discountPct = 0) {
  const plan = discountedPlan(planId, discountPct);
  if (!plan) return null;
  const text = `Здравствуй! Хочу оформить подписку ManClub на ${plan.label} (${formatRub(plan.finalRub)}). Перевёл на карту, чек прикладываю.`;
  return `https://t.me/${PAYMENT_MANAGER_USERNAME}?text=${encodeURIComponent(text)}`;
}
