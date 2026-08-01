import assert from 'node:assert/strict';
import test from 'node:test';
import { authenticateTelegram, AuthenticationError } from '../versions/v2/auth.js';
import { DEFAULT_DEMO_DAYS, accessDecision, ensureCurrentAccess, resolveAccessSnapshot } from '../versions/v2/access.js';
import { PAYMENT_PLANS, discountedPlan, managerPaymentLink } from '../versions/v2/payment.js';
import { getRuntimeContext, resetRuntimeContext, setAuthenticatedRuntime } from '../versions/v2/runtime-context.js';

function firebaseMock({ signInReject = null } = {}) {
  const calls=[];
  const firebase={apps:[],initializeApp:()=>{calls.push('initialize');firebase.apps.push({});},auth:()=>({currentUser:null,signInWithCustomToken:async token=>{calls.push(`signIn:${token}`);if(signInReject)throw signInReject;return {user:{uid:'42',getIdToken:async()=>'id-token'}};}}),firestore:()=>{calls.push('firestore');return {kind:'db'};},storage:()=>{calls.push('storage');return {kind:'storage'};}};
  return {firebase,calls};
}

test('custom-token authentication creates Firestore only after successful sign-in', async () => {
  const {firebase,calls}=firebaseMock();
  const result=await authenticateTelegram({firebase,telegram:{initData:'signed'},fetchImpl:async()=>({ok:true,json:async()=>({token:'custom'})})});
  assert.equal(result.user.uid,'42');
  assert.deepEqual(calls,['initialize','signIn:custom','firestore','storage']);
});

test('failed sign-in fails closed without creating Firestore', async () => {
  const {firebase,calls}=firebaseMock({signInReject:new Error('denied')});
  await assert.rejects(authenticateTelegram({firebase,telegram:{initData:'signed'},fetchImpl:async()=>({ok:true,json:async()=>({token:'bad'})})}), error=>error instanceof AuthenticationError&&error.code==='firebase_sign_in');
  assert.deepEqual(calls,['initialize','signIn:bad']);
});

test('missing Telegram initData never calls auth or Firestore', async () => {
  const {firebase,calls}=firebaseMock();
  await assert.rejects(authenticateTelegram({firebase,telegram:{},fetchImpl:async()=>assert.fail('fetch must not run')}), error=>error.code==='telegram_required');
  assert.deepEqual(calls,[]);
});

test('access priority is paid, free perk, active demo, then expired demo', () => {
  const now=new Date('2026-08-01T00:00:00Z');
  assert.equal(resolveAccessSnapshot({user:{subscriptionUntil:'2026-08-03T00:00:00Z'},perks:{freeSubscriptionUntil:'2026-08-04T00:00:00Z'},now}).accessClass,'fullPaid');
  assert.equal(resolveAccessSnapshot({user:{},perks:{freeSubscriptionUntil:'2026-08-04T00:00:00Z',demoAccessUntil:'2026-08-05T00:00:00Z'},now}).accessClass,'fullPerk');
  assert.equal(resolveAccessSnapshot({user:{},perks:{demoAccessUntil:'2026-08-05T00:00:00Z'},now}).accessClass,'demoActive');
  assert.equal(resolveAccessSnapshot({user:{},perks:{demoAccessUntil:'2026-07-01T00:00:00Z'},now}).accessClass,'demoExpired');
});

test('new user receives the preserved 21-day demo only through the verified server API', async () => {
  const empty={exists:false,data:()=>({})};
  const db={collection:()=>({doc:()=>({get:async()=>empty})})};
  const now=new Date('2026-08-01T00:00:00Z');
  let calls=0;
  const serverApi={uid:'42',ensureDemo:async()=>{calls++;return {ok:true,newlyGranted:true,user:{},perks:{demoAccessUntil:'2026-08-22T00:00:00.000Z'}};}};
  const access=await ensureCurrentAccess(db,'42',now,serverApi);
  assert.equal(access.accessClass,'demoActive');
  assert.equal(DEFAULT_DEMO_DAYS,21);
  assert.equal(access.until.toISOString(),'2026-08-22T00:00:00.000Z');
  assert.equal(calls,1);
  await assert.rejects(ensureCurrentAccess(db,'42',now),/Verified server demo API is required/);
});

test('expired demo permits only payment and limited account routes', () => {
  const expired={accessClass:'demoExpired'};
  assert.equal(accessDecision('home',expired).allowed,false);
  assert.equal(accessDecision('home',expired).redirect,'payment.plans');
  assert.equal(accessDecision('payment.transfer',expired).allowed,true);
  assert.equal(accessDecision('profile.help',expired).allowed,true);
});

test('payment shell preserves plans and transfer-to-manager flow', () => {
  assert.deepEqual(Object.keys(PAYMENT_PLANS),['1m','3m','6m','12m']);
  assert.equal(discountedPlan('1m',10).finalRub,4500);
  const link=managerPaymentLink('3m',0);
  assert.match(link,/^https:\/\/t\.me\/job_bylobychevinsibir\?text=/);
  assert.match(decodeURIComponent(link),/14\s000/);
});

test('runtime context rejects database initialization without authenticated user', () => {
  resetRuntimeContext();
  assert.throws(()=>setAuthenticatedRuntime({user:null,db:{}}));
  assert.equal(getRuntimeContext().fbDb,null);
});
