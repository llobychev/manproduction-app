import assert from 'node:assert/strict';
import test from 'node:test';
import { MainAppApiError, createMainAppServerApi } from '../versions/v2/server-api.js';

test('server API authenticates every mutation with a Firebase ID token',async()=>{
  const calls=[];
  const firebaseUser={uid:'42',getIdToken:async()=>{calls.push('token');return 'signed-id-token';}};
  const api=createMainAppServerApi({firebaseUser,baseUrl:'https://server.test',fetchImpl:async(url,options)=>{calls.push({url,options});return {ok:true,status:200,json:async()=>({ok:true,newlyGranted:true,user:{},perks:{}})};}});
  await api.ensureDemo();
  assert.equal(calls[0],'token');
  assert.equal(calls[1].options.headers.Authorization,'Bearer signed-id-token');
  assert.equal(calls[1].url,'https://server.test/app/v2/access/ensure-demo');
});

test('quest endpoint sends only desired state and never client reward points',async()=>{
  let request;
  const api=createMainAppServerApi({firebaseUser:{uid:'42',getIdToken:async()=>'token'},fetchImpl:async(url,options)=>{request={url,options};return {ok:true,status:200,json:async()=>({ok:true,done:true,reward:50,points:150,quests:{}})};}});
  await api.setDailyQuest('lesson',true);
  assert.match(request.url,/\/quests\/lesson\/state$/);
  assert.deepEqual(JSON.parse(request.options.body),{done:true});
  assert.doesNotMatch(request.options.body,/points|reward/);
});

test('server rejection fails closed with typed error',async()=>{
  const api=createMainAppServerApi({firebaseUser:{uid:'42',getIdToken:async()=>'token'},fetchImpl:async()=>({ok:false,status:403,json:async()=>({ok:false,error:'denied'})})});
  await assert.rejects(api.ensureDemo(),error=>error instanceof MainAppApiError&&error.status===403);
});
