export const DEFAULT_DAILY_QUESTS = Object.freeze([
  Object.freeze({ id:'lesson', text:'Посмотри урок', points:50 }),
  Object.freeze({ id:'task', text:'Создай задачу', points:30 }),
  Object.freeze({ id:'habit', text:'Открой привычку', points:20 })
]);

function valueOf(doc) {
  return doc?.exists ? (doc.data() || {}) : {};
}

function asDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const date=new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function todayIso(now = new Date()) {
  return now.toISOString().slice(0,10);
}

function habitStreak(habit, now = new Date()) {
  const dates=[...new Set(habit?.doneDates || [])].sort();
  if (!dates.length) return 0;
  const today=todayIso(now);
  const yesterday=todayIso(new Date(now.getTime()-86400000));
  if (dates.at(-1)!==today && dates.at(-1)!==yesterday) return 0;
  let streak=1;
  for(let i=dates.length-1;i>0;i--){
    const diff=(new Date(`${dates[i]}T00:00:00Z`)-new Date(`${dates[i-1]}T00:00:00Z`))/86400000;
    if(diff!==1)break;
    streak+=1;
  }
  return streak;
}

function normalizeSchedule(userData, cloudEvents, now) {
  const today=todayIso(now);
  const local=[];
  const schedules=userData.schedules;
  if (Array.isArray(schedules)) local.push(...schedules);
  else if (schedules && typeof schedules==='object') {
    for (const value of Object.values(schedules)) if (Array.isArray(value)) local.push(...value);
  }
  const all=[...local,...cloudEvents];
  const seen=new Set();
  return all.filter(item=>item && (!item.dateISO || item.dateISO===today)).filter(item=>{
    const key=item.id||item.eventId||`${item.title||''}|${item.time||''}|${item.dateISO||today}`;
    if(seen.has(key))return false;
    seen.add(key);return true;
  }).sort((a,b)=>String(a.time||'99:99').localeCompare(String(b.time||'99:99'))).slice(0,5);
}

async function safe(load, fallback) {
  try { return { state:'ready', value:await load() }; }
  catch (error) { return { state:'error', value:fallback, error }; }
}

export async function loadHomeDashboard(db, uid, { now = new Date(), telegramUser = null } = {}) {
  if(!db||!uid)throw new Error('Authenticated Firestore and uid are required');
  const [userDoc,userDataDoc,newsResult,questsResult,eventsResult]=await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('user_data').doc(uid).get(),
    safe(async()=>{const snap=await db.collection('news').orderBy('createdAt','desc').limit(3).get();return snap.docs.map(doc=>({id:doc.id,...doc.data()}));},[]),
    safe(async()=>{const snap=await db.collection('daily_quests').where('active','==',true).get();const items=snap.docs.map(doc=>({id:doc.id,text:doc.data().text||'',points:Number(doc.data().points)||0}));return items.length?items:DEFAULT_DAILY_QUESTS;},DEFAULT_DAILY_QUESTS),
    safe(async()=>{const snap=await db.collection('events').where('userId','==',uid).get();return snap.docs.map(doc=>({id:doc.id,...doc.data()}));},[])
  ]);
  const user=valueOf(userDoc), userData=valueOf(userDataDoc), habits=userData.habits||{};
  const questsDone=userData.questsDone?.date===todayIso(now)?userData.questsDone:{date:todayIso(now),done:{},awarded:{}};
  const displayName=user.first||user.firstName||user.fullName?.split(' ')[0]||telegramUser?.first_name||'участник';
  const streak=Math.max(0,...(habits.active||[]).map(item=>habitStreak(item,now)));
  return Object.freeze({
    identity:{displayName},
    points:Number(habits.points)||Number(user.points)||0,
    level:Number(user.level)||null,
    streak,
    path:{state:'disabled',title:'Путь',message:'Точный прогресс подключится к единому Path adapter в Package 5.'},
    quests:{state:questsResult.state,items:questsResult.value,done:questsDone.done||{},awarded:questsDone.awarded||{},date:questsDone.date},
    schedule:{state:eventsResult.state,items:normalizeSchedule(userData,eventsResult.value,now)},
    nearestEvent:{state:'empty',message:'Каталог клубных событий получит отдельный schema/security contract.'},
    recommendation:{state:'disabled',message:'Рекомендация Лёвы появится после подключения Path/AI источника.'},
    news:{state:newsResult.state,items:newsResult.value.map(item=>({...item,createdAt:asDate(item.createdAt)}))}
  });
}

export async function toggleDailyQuest(db, uid, quest, now = new Date()) {
  if(!db||!uid||!quest?.id)throw new Error('Quest write requires db, uid and quest');
  const ref=db.collection('user_data').doc(uid);
  return db.runTransaction(async transaction=>{
    const doc=await transaction.get(ref);
    const data=valueOf(doc);
    const today=todayIso(now);
    const quests=data.questsDone?.date===today?structuredClone(data.questsDone):{date:today,done:{},awarded:{}};
    quests.done=quests.done||{};quests.awarded=quests.awarded||{};
    const wasDone=Boolean(quests.done[quest.id]);
    quests.done[quest.id]=!wasDone;
    const habits=structuredClone(data.habits||{});
    habits.points=Number(habits.points)||0;
    let reward=0;
    if(!wasDone&&!quests.awarded[quest.id]){
      quests.awarded[quest.id]=true;
      reward=Math.max(0,Number(quest.points)||0);
      habits.points+=reward;
    }
    transaction.set(ref,{questsDone:quests,habits},{merge:true});
    return Object.freeze({done:quests.done[quest.id],reward,points:habits.points,quests});
  });
}
