import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { ADAPTER_SECURITY_CONTRACT_VERSION, APPROVED_SECURITY_REVISIONS, V2_ADAPTER_DOMAINS, createV2AdapterRegistry } from '../versions/v2/adapter-registry.js';

const proof=rulesRevision=>({contractVersion:ADAPTER_SECURITY_CONTRACT_VERSION,rulesRevision,ownerScoped:true,serverValidated:true,backwardCompatibleV1:true,rollbackReady:true});

test('all V2 adapter domains fail closed when no registry is provided', () => {
  const registry=createV2AdapterRegistry();
  for(const domain of V2_ADAPTER_DOMAINS){assert.equal(registry.adapter(domain),null);assert.equal(registry.audit[domain].accepted,false);}
  assert.equal(registry.allAccepted,false);
});

test('partial or stale security proof cannot activate an adapter', () => {
  const adapter={load:async()=>({})};
  const partial=createV2AdapterRegistry({path:{adapter,security:{contractVersion:ADAPTER_SECURITY_CONTRACT_VERSION,rulesRevision:'abcdef123'}}});
  assert.equal(partial.adapter('path'),null);
  assert.match(partial.audit.path.reason,/proof-missing/);
  const stale=createV2AdapterRegistry({path:{adapter,security:{...proof('abcdef123'),contractVersion:99}}});
  assert.equal(stale.adapter('path'),null);
  assert.equal(stale.audit.path.reason,'contract-version-mismatch');
});

test('a self-asserted revision remains blocked while the production allowlist is empty', () => {
  const adapter={load:async()=>({})};
  const registry=createV2AdapterRegistry({path:{adapter,security:proof('rules/2026-08-01.1')}});
  assert.deepEqual(APPROVED_SECURITY_REVISIONS,{});
  assert.equal(registry.adapter('path'),null);
  assert.equal(registry.audit.path.reason,'rules-revision-unapproved');
});

test('a reviewed compile-time revision activates only its named domain', () => {
  const adapter={load:async()=>({})};
  const registry=createV2AdapterRegistry({path:{adapter,security:proof('rules/2026-08-01.1')}},{path:'rules/2026-08-01.1'});
  assert.equal(registry.adapter('path'),adapter);
  assert.equal(registry.audit.path.accepted,true);
  assert.equal(registry.audit.path.rulesRevision,'rules/2026-08-01.1');
  assert.equal(registry.adapter('events'),null);
});

test('application uses only the centralized registry and preserves known direct writes', async () => {
  const [app,access,home,contract,manifest]=await Promise.all([
    readFile(new URL('../versions/v2/app.js',import.meta.url),'utf8'),
    readFile(new URL('../versions/v2/access.js',import.meta.url),'utf8'),
    readFile(new URL('../versions/v2/home.js',import.meta.url),'utf8'),
    readFile(new URL('../docs/contracts/main-app-v2-data-adapter-security-gate.md',import.meta.url),'utf8'),
    readFile(new URL('../versions/active.json',import.meta.url),'utf8')
  ]);
  assert.match(app,/createV2AdapterRegistry\(window\.MENCLUB_V2_ADAPTERS/);
  assert.doesNotMatch(app,/window\.MENCLUB_V2_(EVENT|PATH|WIDGET|PROFILE|LYOVA_ACTION)_ADAPTER/);
  assert.match(access,/roulette_active_perks/);
  assert.match(home,/runTransaction/);
  assert.match(contract,/No deployable `firestore\.rules`/);
  assert.equal(JSON.parse(manifest).activeVersion,'v1');
});
