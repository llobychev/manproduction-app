import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  CABINET_SECTIONS, NEVER_PUBLIC_FIELDS, PUBLIC_PROFILE_DEFAULTS,
  createProfileRepository, normalizeProfile, publicProfileView, visibilitySummary
} from '../versions/v2/profile.js';

test('cabinet exposes every contracted route family', () => {
  const routes=CABINET_SECTIONS.flatMap(section=>section.items.map(item=>item.route));
  for(const route of ['profile.personalData','profile.subscription','profile.payments','profile.clubAccess','profile.settings','profile.notifications','profile.privacy','profile.security','profile.language','profile.achievements','profile.invite','profile.giftCards','profile.help','profile.about','profile.version'])assert.ok(routes.includes(route));
});

test('public defaults are conservative and sensitive data is never public', () => {
  assert.equal(PUBLIC_PROFILE_DEFAULTS.displayName,true);
  assert.equal(PUBLIC_PROFILE_DEFAULTS.levelTitle,true);
  assert.equal(PUBLIC_PROFILE_DEFAULTS.sphereNames,true);
  for(const field of ['username','city','totalPoints','streak','friendsList','spherePercentages'])assert.equal(PUBLIC_PROFILE_DEFAULTS[field],false);
  for(const field of ['email','phone','subscription','payments','privacy','security','journal','finance','health'])assert.ok(NEVER_PUBLIC_FIELDS.includes(field));
});

test('normalization reuses V1 fields and does not invent contacts', () => {
  const profile=normalizeProfile({
    user:{first:'Алексей',last:'Лобычев',tgUsername:'@alexey',subscriptionPlan:'3m',level:4},
    userData:{personal:{city:'Иркутск',pets:'собака'},habits:{points:720}},
    access:{accessClass:'fullPaid',source:'users.subscriptionUntil',plan:'3m',until:'2026-12-01'}
  });
  assert.equal(profile.identity.displayName,'Алексей Лобычев');
  assert.equal(profile.city,'Иркутск');
  assert.equal(profile.points,720);
  assert.equal(profile.subscription.plan,'3m');
  assert.equal('email' in profile,false);
  assert.equal('phone' in profile,false);
});

test('public view hides values unless explicitly visible', () => {
  const profile=normalizeProfile({user:{fullName:'Участник',tgUsername:'secret',points:900,avatarUrl:'javascript:alert(1)',publicProfile:{socialLinks:[{url:'https://example.com/private'},{url:'https://example.com/visible',visible:true}]}},userData:{personal:{city:'Иркутск'}}});
  const view=publicProfileView(profile);
  assert.equal(view.identity.username,null);
  assert.equal(view.city,null);
  assert.equal(view.points,null);
  assert.ok(visibilitySummary(profile.visibility).includes('имя'));
  assert.ok(!JSON.stringify(view).includes('secret'));
  assert.ok(!JSON.stringify(view).includes('Иркутск'));
  assert.equal(view.identity.avatarUrl,'');
  assert.equal(view.socialLinks.length,1);
  assert.equal(view.socialLinks[0].url,'https://example.com/visible');
});

test('an authoritative zero points value is not replaced by a legacy fallback', () => {
  const profile=normalizeProfile({user:{points:900},userData:{habits:{points:0}}});
  assert.equal(profile.points,0);
});

test('profile writes, share and reset fail closed without an approved adapter', async () => {
  const repository=createProfileRepository();
  assert.deepEqual(repository.capabilities,{profileWrites:false,publicProfileWrites:false,dataReset:false,memberShare:false});
  await assert.rejects(()=>repository.saveProfile({}),/Security Rules/);
  await assert.rejects(()=>repository.savePublicProfile({}),/Security Rules/);
  await assert.rejects(()=>repository.resetData({}),/deletion contract/);
  await assert.rejects(()=>repository.createMemberShareLink({}),/not available/);
});

test('adapter results must explicitly confirm public save and reset', async () => {
  const repository=createProfileRepository({saveProfile:async()=>({}),savePublicProfile:async()=>({confirmed:false}),resetData:async()=>({confirmed:false}),createMemberShareLink:async()=>({url:'x'})});
  await assert.rejects(()=>repository.savePublicProfile({}),/not confirmed/);
  await assert.rejects(()=>repository.resetData({}),/not confirmed/);
});

test('application wires real profile package and keeps V1 active', async () => {
  const [app,manifest,contract]=await Promise.all([
    readFile(new URL('../versions/v2/app.js',import.meta.url),'utf8'),
    readFile(new URL('../versions/active.json',import.meta.url),'utf8'),
    readFile(new URL('../docs/contracts/main-app-v2-profile-data-security-contract.md',import.meta.url),'utf8')
  ]);
  assert.match(app,/loadProfileExperience/);
  assert.match(app,/profile\.publicPreview/);
  assert.match(app,/profile-reset-second/);
  assert.match(app,/firebase\.auth\(\)\.signOut/);
  assert.equal(JSON.parse(manifest).activeVersion,'v1');
  assert.equal(JSON.parse(manifest).fallbackVersion,'v1');
  assert.match(contract,/never public/i);
});
