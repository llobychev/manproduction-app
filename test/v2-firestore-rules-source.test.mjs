import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');

test('Firestore Rules source is deployable candidate and default-deny',async()=>{
  const [rules,config]=await Promise.all([read('firestore.rules'),read('firebase.json')]);
  assert.match(rules,/rules_version = '2'/);
  assert.match(rules,/match \/\{document=\*\*\}/);
  assert.match(rules,/allow read, write: if false/);
  assert.equal(JSON.parse(config).firestore.rules,'firestore.rules');
});

test('candidate rules keep privileged user fields immutable for members',async()=>{
  const rules=await read('firestore.rules');
  for(const field of ['subscriptionUntil','subscriptionPlan','discountPct','isAdmin','permissions'])assert.match(rules,new RegExp(`'${field}'`));
  assert.match(rules,/protectedUserFieldsUnchanged\(\)/);
  assert.match(rules,/protectedUserDataFieldsUnchanged\(\)/);
  assert.match(rules,/'habits'/);
  assert.match(rules,/'questsDone'/);
  assert.match(rules,/'challengesProgress'/);
});

test('candidate rules keep entitlements and reward-bearing progress server-owned',async()=>{
  const rules=await read('firestore.rules');
  assert.match(rules,/match \/roulette_active_perks\/\{uid\}[\s\S]*allow create, update, delete: if canManage\('demoAccess'\)/);
  assert.match(rules,/match \/leaderboard\/\{uid\}[\s\S]*allow create, update, delete: if canManage\('users'\)/);
  assert.match(rules,/match \/challenge_progress\/\{progressId\}[\s\S]*allow create, update, delete: if canManage\('challenges'\)/);
  assert.match(rules,/request\.resource\.data\.get\('doneCount', 0\) == 0/);
});

test('candidate rules cover every audited V1 collection and deny unreviewed V2 state',async()=>{
  const rules=await read('firestore.rules');
  for(const collection of ['users','user_data','cycle_data','events','news','leaderboard','challenge_progress','challenges','daily_quests','analytics','roulette_active_perks','promo_codes','migration_backup','admin_users'])assert.match(rules,new RegExp(`match \/${collection}`),collection);
  assert.doesNotMatch(rules,/match \/(?:v2_|path_progress|widget_layouts|public_profiles|lyova_runtime)/);
});

test('emulator matrix contains unauthenticated, cross-user, privilege and malformed denial proofs',async()=>{
  const matrix=await read('security-tests/firestore.rules.test.mjs');
  assert.match(matrix,/unauthenticated access is denied/);
  assert.match(matrix,/not another profile/);
  assert.match(matrix,/cannot create or alter privileged subscription fields/);
  assert.match(matrix,/cannot self-escalate permissions/);
  assert.match(matrix,/unknown collections are denied by default/);
  assert.match(matrix,/assertFails/);
  assert.match(matrix,/assertSucceeds/);
});
