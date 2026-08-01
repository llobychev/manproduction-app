export const DEFAULT_DEMO_DAYS = 21;

export const ACCESS_CLASSES = Object.freeze([
  'unauthenticated', 'demoActive', 'fullPaid', 'fullPerk', 'demoExpired', 'featureLocked'
]);

const EXPIRED_ALLOWED_ROUTES = Object.freeze(new Set([
  'payment.plans', 'payment.transfer', 'payment.confirmation', 'payment.pending', 'payment.success', 'payment.error',
  'profile.cabinet', 'profile.subscription', 'profile.help', 'profile.about', 'profile.logoutConfirm'
]));

function asDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function resolveAccessSnapshot({ user = {}, perks = {}, now = new Date() }) {
  const paidUntil = asDate(user.subscriptionUntil);
  if (paidUntil && paidUntil > now) return Object.freeze({ accessClass:'fullPaid', until:paidUntil, source:'users.subscriptionUntil', plan:user.subscriptionPlan || null });

  const freeUntil = asDate(perks.freeSubscriptionUntil);
  if (freeUntil && freeUntil > now) return Object.freeze({ accessClass:'fullPerk', until:freeUntil, source:'roulette_active_perks.freeSubscriptionUntil' });

  const demoUntil = asDate(perks.demoAccessUntil);
  if (demoUntil && demoUntil > now) return Object.freeze({ accessClass:'demoActive', until:demoUntil, source:'roulette_active_perks.demoAccessUntil', discountPct:perks.discountPct || user.discountPct || null });
  if (demoUntil) return Object.freeze({ accessClass:'demoExpired', until:demoUntil, source:'roulette_active_perks.demoAccessUntil', discountPct:perks.discountPct || user.discountPct || null });
  return Object.freeze({ accessClass:'newUser', until:null, source:null, discountPct:perks.discountPct || user.discountPct || null });
}

export async function loadAccessSnapshot(db, uid) {
  if (!db || !uid) throw new Error('Authenticated Firestore and uid are required');
  const [userDoc, perksDoc] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('roulette_active_perks').doc(uid).get()
  ]);
  return {
    user: userDoc.exists ? userDoc.data() : {},
    perks: perksDoc.exists ? perksDoc.data() : {}
  };
}

export async function ensureCurrentAccess(db, uid, now = new Date()) {
  const snapshot = await loadAccessSnapshot(db, uid);
  const resolved = resolveAccessSnapshot({ ...snapshot, now });
  if (resolved.accessClass !== 'newUser') return resolved;

  const until = new Date(now.getTime() + DEFAULT_DEMO_DAYS * 24 * 60 * 60 * 1000);
  await db.collection('roulette_active_perks').doc(uid).set({ demoAccessUntil: until.toISOString() }, { merge:true });
  return Object.freeze({ accessClass:'demoActive', until, source:'defaultDemo', discountPct:resolved.discountPct, newlyGranted:true });
}

export function accessDecision(routeId, access) {
  if (!access) return Object.freeze({ allowed:false, reason:'unauthenticated' });
  if (access.accessClass === 'demoExpired' && !EXPIRED_ALLOWED_ROUTES.has(routeId)) {
    return Object.freeze({ allowed:false, reason:'paywalled', redirect:'payment.plans' });
  }
  if (access.accessClass === 'featureLocked') return Object.freeze({ allowed:false, reason:'locked' });
  return Object.freeze({ allowed:true, reason:null });
}

export function daysRemaining(until, now = new Date()) {
  const date = asDate(until);
  if (!date) return 0;
  return Math.max(0, Math.ceil((date - now) / (24 * 60 * 60 * 1000)));
}
