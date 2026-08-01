import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_DAILY_QUESTS, loadHomeDashboard, toggleDailyQuest } from '../versions/v2/home.js';

function doc(data,exists=true){return {exists,data:()=>data};}
function query(docs=[]){return {orderBy(){return this;},limit(){return this;},where(){return this;},get:async()=>({docs:docs.map(([id,data])=>({id,data:()=>data}))})};}

test('Home reads only existing authoritative sources and keeps Path/event catalog honest', async()=>{
  const collections={
    users:{doc:()=>({get:async()=>doc({first:'Алексей',level:3})})},
    user_data:{doc:()=>({get:async()=>doc({habits:{points:120,active:[]},questsDone:{date:'2026-08-01',done:{lesson:true},awarded:{lesson:true}},schedules:[{id:'a',title:'Звонок',time:'10:00',dateISO:'2026-08-01'}]})})},
    news:query([['n1',{title:'Новость',body:'Текст',createdAt:'2026-08-01T09:00:00Z'}]]),
    daily_quests:query([['lesson',{active:true,text:'Посмотри урок',points:50}]]),
    events:query([])
  };
  const db={collection:name=>collections[name]};
  const home=await loadHomeDashboard(db,'42',{now:new Date('2026-08-01T12:00:00Z')});
  assert.equal(home.identity.displayName,'Алексей');
  assert.equal(home.points,120);assert.equal(home.level,3);
  assert.equal(home.quests.done.lesson,true);
  assert.equal(home.schedule.items[0].title,'Звонок');
  assert.equal(home.news.items[0].title,'Новость');
  assert.equal(home.path.state,'disabled');
  assert.equal(home.nearestEvent.state,'empty');
});

test('Home falls back to the existing V1 default quests when catalog is empty',async()=>{
  const emptyQuery=query([]),db={collection:name=>name==='users'||name==='user_data'?{doc:()=>({get:async()=>doc({},false)})}:emptyQuery};
  const home=await loadHomeDashboard(db,'42',{now:new Date('2026-08-01T12:00:00Z')});
  assert.deepEqual(home.quests.items,DEFAULT_DAILY_QUESTS);
});

test('quest state and reward come only from the verified server API',async()=>{
  const calls=[];
  const serverApi={setDailyQuest:async(id,done)=>{calls.push({id,done});return {done,reward:done?50:0,points:150,quests:{date:'2026-08-01',done:{lesson:done},awarded:{lesson:true}}};}};
  const quest={id:'lesson',text:'Посмотри урок',points:999999};
  const first=await toggleDailyQuest(serverApi,quest,false);
  const second=await toggleDailyQuest(serverApi,quest,true);
  assert.equal(first.reward,50);assert.equal(first.points,150);
  assert.equal(second.reward,0);assert.deepEqual(calls,[{id:'lesson',done:true},{id:'lesson',done:false}]);
  await assert.rejects(toggleDailyQuest(null,quest),/Verified server quest API is required/);
});

test('schedule deduplicates local and cloud mirror entries',async()=>{
  const collections={users:{doc:()=>({get:async()=>doc({})})},user_data:{doc:()=>({get:async()=>doc({schedules:[{id:'a',title:'Звонок',time:'10:00',dateISO:'2026-08-01'}]})})},news:query([]),daily_quests:query([]),events:query([['a',{eventId:'a',title:'Звонок',time:'10:00',dateISO:'2026-08-01'}]])};
  const home=await loadHomeDashboard({collection:name=>collections[name]},'42',{now:new Date('2026-08-01T12:00:00Z')});
  assert.equal(home.schedule.items.length,1);
});
