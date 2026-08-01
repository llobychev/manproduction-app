import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { after, before } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const projectId='manproduction-club-rules-test';
let env;

before(async()=>{
  const rules=await readFile(new URL('../firestore.rules',import.meta.url),'utf8');
  env=await initializeTestEnvironment({projectId,firestore:{rules}});
});

after(async()=>env?.cleanup());

async function seedAdmin(uid, data={}) {
  await env.withSecurityRulesDisabled(async context=>{
    await setDoc(doc(context.firestore(),'admin_users',uid),{
      status:'approved',role:'admin',permissions:{admin:{}},...data
    });
  });
}

test('unauthenticated access is denied',async()=>{
  const db=env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db,'news','one')));
  await assertFails(setDoc(doc(db,'users','alice'),{fullName:'Anonymous'}));
});

test('user can read and edit own profile but not another profile',async()=>{
  const alice=env.authenticatedContext('alice').firestore();
  const bob=env.authenticatedContext('bob').firestore();
  await assertSucceeds(setDoc(doc(alice,'users','alice'),{fullName:'Alice'}));
  await assertSucceeds(getDoc(doc(alice,'users','alice')));
  await assertFails(getDoc(doc(bob,'users','alice')));
  await assertFails(setDoc(doc(bob,'users','alice'),{fullName:'Mallory'}));
});

test('user cannot create or alter privileged subscription fields',async()=>{
  const db=env.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(db,'users','alice'),{fullName:'Alice',subscriptionUntil:'2099-01-01'}));
  await env.withSecurityRulesDisabled(async context=>{
    await setDoc(doc(context.firestore(),'users','alice'),{fullName:'Alice',subscriptionUntil:'2026-08-10'});
  });
  await assertSucceeds(updateDoc(doc(db,'users','alice'),{fullName:'Alice Updated'}));
  await assertFails(updateDoc(doc(db,'users','alice'),{subscriptionUntil:'2099-01-01'}));
});

test('personal events require owner document identity and bounded fields',async()=>{
  const alice=env.authenticatedContext('alice').firestore();
  const bob=env.authenticatedContext('bob').firestore();
  const event={userId:'alice',userName:'Alice',eventId:'event-1',title:'Meeting',time:'18:00',dateISO:'2026-08-02',recurrence:{type:'none'},reminderOffset:'none',tag:'club',updatedAt:1};
  await assertSucceeds(setDoc(doc(alice,'events','alice_event-1'),event));
  await assertFails(setDoc(doc(bob,'events','alice_event-2'),event));
  await assertFails(setDoc(doc(alice,'events','alice_event-3'),{...event,subscriptionUntil:'2099-01-01'}));
  await assertFails(getDoc(doc(bob,'events','alice_event-1')));
  await assertSucceeds(deleteDoc(doc(alice,'events','alice_event-1')));
});

test('demo entitlement writes are server-owned',async()=>{
  const db=env.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(db,'roulette_active_perks','alice'),{demoAccessUntil:'2099-01-01T00:00:00.000Z'}));
  await seedAdmin('access-admin',{permissions:{admin:{demoAccess:true}}});
  const admin=env.authenticatedContext('access-admin').firestore();
  await assertSucceeds(setDoc(doc(admin,'roulette_active_perks','alice'),{demoAccessUntil:'2026-08-22T00:00:00.000Z'}));
});

test('leaderboard and reward-bearing progress are server-owned',async()=>{
  const alice=env.authenticatedContext('alice').firestore();
  const valid={userId:'alice',userName:'Alice',points:25,updatedAt:1};
  await assertFails(setDoc(doc(alice,'leaderboard','alice'),valid));
  await assertFails(setDoc(doc(alice,'leaderboard','bob'),{...valid,userId:'bob'}));
  await assertFails(setDoc(doc(alice,'challenge_progress','c1_alice'),{challengeId:'c1',userId:'alice',doneCount:100,updatedAt:1}));
  await assertFails(setDoc(doc(alice,'user_data','alice'),{habits:{points:1000000}}));
  await assertFails(getDoc(doc(alice,'reward_balances','alice')));
  await assertFails(setDoc(doc(alice,'reward_balances','alice'),{migrated:true,points:1000000}));
});

test('member cannot publish admin content; approved permission can',async()=>{
  const alice=env.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(alice,'news','one'),{title:'Forged'}));
  await seedAdmin('editor',{role:'news_editor',permissions:{admin:{news:true}}});
  const editor=env.authenticatedContext('editor').firestore();
  await assertSucceeds(setDoc(doc(editor,'news','one'),{title:'Approved',body:'Text',createdAt:1}));
  await assertFails(setDoc(doc(editor,'promo_codes','FORGED'),{active:true,discountPct:100}));
});

test('admin profile cannot self-escalate permissions',async()=>{
  await env.withSecurityRulesDisabled(async context=>{
    await setDoc(doc(context.firestore(),'admin_users','editor'),{status:'approved',role:'news_editor',permissions:{admin:{news:true}},uiPreferences:{}});
  });
  const db=env.authenticatedContext('editor').firestore();
  await assertSucceeds(updateDoc(doc(db,'admin_users','editor'),{uiPreferences:{pinnedManageItems:['news']},updatedAt:1}));
  await assertFails(updateDoc(doc(db,'admin_users','editor'),{role:'admin'}));
  await assertFails(updateDoc(doc(db,'admin_users','editor'),{permissions:{admin:{users:true}}}));
});

test('unknown collections are denied by default',async()=>{
  const db=env.authenticatedContext('alice').firestore();
  await assertFails(getDoc(doc(db,'unreviewed_v2_state','alice')));
  await assertFails(setDoc(doc(db,'unreviewed_v2_state','alice'),{enabled:true}));
});

test('team captain controls team while a member controls only their membership',async()=>{
  const alice=env.authenticatedContext('alice').firestore();
  const bob=env.authenticatedContext('bob').firestore();
  await assertSucceeds(setDoc(doc(alice,'challenges','c1','teams','t1'),{name:'Pride',captainId:'alice',captainName:'Alice',inviteCode:'ABC123',createdAt:1}));
  await assertSucceeds(setDoc(doc(alice,'challenges','c1','teams','t1','members','alice'),{userId:'alice',userName:'Alice',isCaptain:true,doneCount:0,joinedAt:1}));
  await assertSucceeds(setDoc(doc(bob,'challenges','c1','teams','t1','members','bob'),{userId:'bob',userName:'Bob',isCaptain:false,doneCount:0,joinedAt:1}));
  await assertFails(setDoc(doc(bob,'challenges','c1','teams','t1','members','mallory'),{userId:'bob',userName:'Bob',isCaptain:false,doneCount:999999,joinedAt:1}));
  await assertFails(updateDoc(doc(bob,'challenges','c1','teams','t1'),{name:'Hijacked'}));
  await assertFails(deleteDoc(doc(bob,'challenges','c1','teams','t1','members','alice')));
  await assertSucceeds(deleteDoc(doc(alice,'challenges','c1','teams','t1','members','bob')));
});

test('analytics identity cannot be forged',async()=>{
  const db=env.authenticatedContext('alice').firestore();
  await assertSucceeds(setDoc(doc(db,'analytics','main','events','one'),{tgId:'alice',event:'open',data:{},ts:1}));
  await assertFails(setDoc(doc(db,'analytics','main','events','two'),{tgId:'bob',event:'open',data:{},ts:1}));
});
