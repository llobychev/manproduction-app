export const V1_IMMUTABILITY = Object.freeze({
  'index.html':'ccb1ea16264b42545787692808c10d3b5c2e764e2c5a22da8d8a03324a4e88fc',
  'versions/active.json':'502a5ae389723659e1e9b1d33a4d5193d6aeee580b57daf37a900e4401b069f4',
  'versions/v1/index.html':'5bfb2634f08f5a4a29d07e4d61da7f6d401d5992ada0961306d1bf418d43062c'
});

export const DIRECT_V2_WRITE_ALLOWLIST = Object.freeze({
  'versions/v2/access.js':Object.freeze(['roulette_active_perks']),
  'versions/v2/home.js':Object.freeze(['user_data'])
});

export const AUTOMATED_ACCEPTANCE_GATES = Object.freeze([
  'javascript-syntax',
  'route-registry-and-back-stack',
  'telegram-back-button-boundary',
  'auth-fail-closed',
  'paid-perk-demo-expired-access-matrix',
  'payment-no-false-success',
  'quest-transaction-reward-deduplication',
  'events-path-widgets-profile-lyova-fail-closed',
  'public-profile-sensitive-field-denial',
  'logout-retains-data',
  'reset-double-confirm-and-adapter-gate',
  'central-adapter-security-allowlist-empty',
  'no-browser-storage-persistence',
  'responsive-safe-area-shell',
  'v1-and-active-manifest-immutability'
]);

export const EXTERNAL_ACCEPTANCE_GATES = Object.freeze([
  Object.freeze({ id:'deployed-firestore-rules-source', status:'blocked', evidence:'Authoritative Rules source and deployed immutable revision are not identified.' }),
  Object.freeze({ id:'firestore-negative-authorization-tests', status:'blocked', evidence:'Requires emulator or controlled project access plus deployed Rules source.' }),
  Object.freeze({ id:'telegram-real-device-responsive-proof', status:'pending', evidence:'Requires owner-accessible Telegram V2 preview on target devices.' }),
  Object.freeze({ id:'paid-demo-expired-real-account-proof', status:'pending', evidence:'Requires controlled non-production account fixtures.' }),
  Object.freeze({ id:'v1-v2-v1-controlled-rollback', status:'pending', evidence:'Belongs to owner-approved Package 11 activation.' }),
  Object.freeze({ id:'owner-activation-approval', status:'pending', evidence:'Explicit owner approval is mandatory before activeVersion changes.' })
]);

export function verificationSummary(automatedPassed) {
  return Object.freeze({
    automated:Object.freeze({ passed:automatedPassed, total:AUTOMATED_ACCEPTANCE_GATES.length }),
    external:Object.freeze({ blocked:EXTERNAL_ACCEPTANCE_GATES.filter(gate=>gate.status==='blocked').length, pending:EXTERNAL_ACCEPTANCE_GATES.filter(gate=>gate.status==='pending').length, total:EXTERNAL_ACCEPTANCE_GATES.length }),
    activationReady:automatedPassed===AUTOMATED_ACCEPTANCE_GATES.length && EXTERNAL_ACCEPTANCE_GATES.every(gate=>gate.status==='passed')
  });
}
