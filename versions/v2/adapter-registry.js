export const ADAPTER_SECURITY_CONTRACT_VERSION = 1;

export const V2_ADAPTER_DOMAINS = Object.freeze([
  'events', 'path', 'widgets', 'profile', 'lyovaRuntime', 'lyovaActions'
]);

// Intentionally empty until an authoritative deployed Rules/backend revision
// is identified, tested and added through a reviewed code change.
export const APPROVED_SECURITY_REVISIONS = Object.freeze({});

const REQUIRED_PROOFS = Object.freeze([
  'ownerScoped', 'serverValidated', 'backwardCompatibleV1', 'rollbackReady'
]);

function validateEntry(domain, entry, approvedRevisions) {
  if (!entry || typeof entry !== 'object') return Object.freeze({ accepted:false, reason:'missing' });
  if (!V2_ADAPTER_DOMAINS.includes(domain)) return Object.freeze({ accepted:false, reason:'unknown-domain' });
  if (!entry.adapter || typeof entry.adapter !== 'object') return Object.freeze({ accepted:false, reason:'adapter-missing' });
  const security=entry.security;
  if (!security || typeof security !== 'object') return Object.freeze({ accepted:false, reason:'security-proof-missing' });
  if (security.contractVersion !== ADAPTER_SECURITY_CONTRACT_VERSION) return Object.freeze({ accepted:false, reason:'contract-version-mismatch' });
  if (!/^[a-zA-Z0-9._/-]{7,160}$/.test(String(security.rulesRevision || ''))) return Object.freeze({ accepted:false, reason:'rules-revision-missing' });
  const missing=REQUIRED_PROOFS.filter(proof => security[proof] !== true);
  if (missing.length) return Object.freeze({ accepted:false, reason:`proof-missing:${missing.join(',')}` });
  if (approvedRevisions[domain] !== security.rulesRevision) return Object.freeze({ accepted:false, reason:'rules-revision-unapproved' });
  return Object.freeze({ accepted:true, reason:null });
}

export function createV2AdapterRegistry(source = {}, approvedRevisions = APPROVED_SECURITY_REVISIONS) {
  const adapters={};
  const audit={};
  for (const domain of V2_ADAPTER_DOMAINS) {
    const result=validateEntry(domain, source?.[domain], approvedRevisions);
    audit[domain]=Object.freeze({ domain, ...result, rulesRevision:result.accepted ? String(source[domain].security.rulesRevision) : null });
    adapters[domain]=result.accepted ? source[domain].adapter : null;
  }
  return Object.freeze({
    adapter(domain) { return V2_ADAPTER_DOMAINS.includes(domain) ? adapters[domain] : null; },
    audit:Object.freeze(audit),
    allAccepted:V2_ADAPTER_DOMAINS.every(domain => audit[domain].accepted)
  });
}
