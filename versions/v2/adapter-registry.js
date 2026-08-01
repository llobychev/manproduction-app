export const ADAPTER_SECURITY_CONTRACT_VERSION = 1;

export const V2_ADAPTER_DOMAINS = Object.freeze([
  'events', 'path', 'widgets', 'profile', 'lyovaRuntime', 'lyovaActions'
]);

const REQUIRED_PROOFS = Object.freeze([
  'ownerScoped', 'serverValidated', 'backwardCompatibleV1', 'rollbackReady'
]);

function validateEntry(domain, entry) {
  if (!entry || typeof entry !== 'object') return Object.freeze({ accepted:false, reason:'missing' });
  if (!V2_ADAPTER_DOMAINS.includes(domain)) return Object.freeze({ accepted:false, reason:'unknown-domain' });
  if (!entry.adapter || typeof entry.adapter !== 'object') return Object.freeze({ accepted:false, reason:'adapter-missing' });
  const security=entry.security;
  if (!security || typeof security !== 'object') return Object.freeze({ accepted:false, reason:'security-proof-missing' });
  if (security.contractVersion !== ADAPTER_SECURITY_CONTRACT_VERSION) return Object.freeze({ accepted:false, reason:'contract-version-mismatch' });
  if (!/^[a-zA-Z0-9._/-]{7,160}$/.test(String(security.rulesRevision || ''))) return Object.freeze({ accepted:false, reason:'rules-revision-missing' });
  const missing=REQUIRED_PROOFS.filter(proof => security[proof] !== true);
  if (missing.length) return Object.freeze({ accepted:false, reason:`proof-missing:${missing.join(',')}` });
  return Object.freeze({ accepted:true, reason:null });
}

export function createV2AdapterRegistry(source = {}) {
  const adapters={};
  const audit={};
  for (const domain of V2_ADAPTER_DOMAINS) {
    const result=validateEntry(domain, source?.[domain]);
    audit[domain]=Object.freeze({ domain, ...result, rulesRevision:result.accepted ? String(source[domain].security.rulesRevision) : null });
    adapters[domain]=result.accepted ? source[domain].adapter : null;
  }
  return Object.freeze({
    adapter(domain) { return V2_ADAPTER_DOMAINS.includes(domain) ? adapters[domain] : null; },
    audit:Object.freeze(audit),
    allAccepted:V2_ADAPTER_DOMAINS.every(domain => audit[domain].accepted)
  });
}

export function adapterSecurityProof(rulesRevision) {
  return Object.freeze({
    contractVersion:ADAPTER_SECURITY_CONTRACT_VERSION,
    rulesRevision:String(rulesRevision || ''),
    ownerScoped:true,
    serverValidated:true,
    backwardCompatibleV1:true,
    rollbackReady:true
  });
}
