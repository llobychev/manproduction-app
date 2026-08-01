import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import { AUTOMATED_ACCEPTANCE_GATES, DIRECT_V2_WRITE_ALLOWLIST, EXTERNAL_ACCEPTANCE_GATES, V1_IMMUTABILITY, verificationSummary } from '../versions/v2/verification-manifest.js';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const sha256=value=>createHash('sha256').update(value).digest('hex');

test('V1 production entry and active/fallback manifest remain byte-identical', async () => {
  for(const [path,expected] of Object.entries(V1_IMMUTABILITY))assert.equal(sha256(await read(path)),expected,path);
  const manifest=JSON.parse(await read('versions/active.json'));
  assert.equal(manifest.activeVersion,'v1');
  assert.equal(manifest.fallbackVersion,'v1');
  assert.equal(manifest.versions.v2.status,'development');
});

test('V2 has no browser persistence and only allowlisted direct Firestore writes', async () => {
  const directory=new URL('versions/v2/',root);
  const names=(await readdir(directory)).filter(name=>name.endsWith('.js'));
  const directWrites=[];
  for(const name of names){
    const path=`versions/v2/${name}`,source=await read(path);
    assert.doesNotMatch(source,/\b(localStorage|sessionStorage|indexedDB)\b/,path);
    if(/collection\([^;\n]+?\)\.doc\([^;\n]+?\)\.(?:set|delete)\s*\(|runTransaction\s*\(|transaction\.set\s*\(/.test(source))directWrites.push(path);
  }
  assert.deepEqual(directWrites.sort(),Object.keys(DIRECT_V2_WRITE_ALLOWLIST).sort());
  for(const [path,collections] of Object.entries(DIRECT_V2_WRITE_ALLOWLIST)){const source=await read(path);for(const collection of collections)assert.match(source,new RegExp(collection));}
});

test('network, auth and adapter boundaries stay centralized', async () => {
  const names=(await readdir(new URL('versions/v2/',root))).filter(name=>name.endsWith('.js'));
  for(const name of names){const source=await read(`versions/v2/${name}`);if(name==='auth.js')assert.match(source,/fetchImpl/);else assert.doesNotMatch(source,/\bfetch\s*\(/,name);}
  const [app,registry]=await Promise.all([read('versions/v2/app.js'),read('versions/v2/adapter-registry.js')]);
  assert.match(app,/createV2AdapterRegistry/);
  assert.match(registry,/APPROVED_SECURITY_REVISIONS = Object\.freeze\(\{\}\)/);
});

test('responsive Telegram shell includes safe areas and compact breakpoints', async () => {
  const [html,css]=await Promise.all([read('versions/v2/index.html'),read('versions/v2/styles.css')]);
  assert.match(html,/viewport-fit=cover/);
  assert.match(html,/maximum-scale=1/);
  assert.match(css,/env\(safe-area-inset-top\)/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(css,/@media\(max-width:420px\)/);
  assert.match(css,/@media \(min-width:700px\)/);
  assert.match(css,/prefers-reduced-motion/);
});

test('verification report never turns external evidence into an automated pass', () => {
  assert.equal(AUTOMATED_ACCEPTANCE_GATES.length,15);
  assert.ok(EXTERNAL_ACCEPTANCE_GATES.every(gate=>gate.status==='blocked'||gate.status==='pending'));
  const summary=verificationSummary(AUTOMATED_ACCEPTANCE_GATES.length);
  assert.deepEqual(summary.automated,{passed:15,total:15});
  assert.equal(summary.activationReady,false);
});
