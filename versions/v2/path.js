const path = (id, name, recommendation, chapters, bridges = []) => Object.freeze({
  id, name, recommendation, bridges:Object.freeze(bridges),
  chapters:Object.freeze(chapters.map((title, index) => Object.freeze({
    id:`${id}.${index + 1}`, number:index + 1, title, durationMinutes:index === chapters.length - 1 ? 20 : 12,
    xp:index === chapters.length - 1 ? 120 : 40, boss:index === chapters.length - 1
  })))
});

export const PATH_CATALOG = Object.freeze([
  Object.freeze({ id:'body', title:'Тело', icon:'🏋️', description:'Энергия, сон, питание, тренировки и восстановление.', paths:Object.freeze([
    path('body.energy','Энергия','Начни с энергии. Без тела сложно тянуть деньги, отношения и дисциплину.',['Где твоя энергия','Сон','Движение','Вода','Восстановление','Самочувствие','Ритм','Босс: 7 дней энергии'],['Тело + Люди: уверенность','Тело + Деньги: энергия для работы']),
    path('body.sleep','Сон','Сон влияет на всё: деньги, настроение, отношения и дисциплину.',['Точка сна','Экран вечером','Кофеин','Ритуал сна','Подъём','Трек сна','Энергия утром','Босс: 7 ночей']),
    path('body.food','Питание','Сначала собери простой порядок питания.',['Что ты ешь','Завтрак','Меню на день','Покупки','Фото еды','Белок','Привычка','Босс: 7 дней еды'])
  ])}),
  Object.freeze({ id:'finance', title:'Деньги', icon:'💰', description:'Финансовый фундамент, работа, навыки, бизнес и капитал.', paths:Object.freeze([
    path('finance.foundation','Финансовый фундамент','Сначала нужно понять, где ты стоишь сейчас.',['Где ты стоишь сегодня','Куда исчезают деньги','Доходы и расходы','Долги и обязательства','Финансовые привычки','Подушка безопасности','Первый финансовый план','Босс: 7 дней плана'],['Деньги + Смысл: зачем зарабатывать','Деньги + Голова: дисциплина и учёт']),
    path('finance.work','Работа','Собери стабильную опору через работу.',['Куда идти','Резюме','Вакансии','Отклики','Собеседование','Оффер','Рост','Босс: оффер или повышение']),
    path('finance.freelance','Фриланс','Начни с понятной услуги и первого клиента.',['Услуга','Цена','Кому нужно','Сообщение','Первый заказ','Сдать работу','Повторить','Босс: +10 000 ₽'])
  ])}),
  Object.freeze({ id:'people', title:'Люди', icon:'❤️', description:'Общение, знакомства, отношения, друзья и сложные разговоры.', paths:Object.freeze([
    path('people.relations','Зрелые отношения','Начни с понимания себя, ясности и уважения.',['Где ты в отношениях','Как ты общаешься','Границы и уважение','Первое свидание','Сложный разговор','Ошибки и паттерны','Зрелая связь','Босс: честный разговор'],['Люди + Тело: внешний вид и энергия','Люди + Смысл: нужные отношения']),
    path('people.dating','Свидания','Свидание — спокойная встреча двух людей.',['Готовность','Место','Разговор','Слушать','Границы','После встречи','Второе свидание','Босс: провести свидание']),
    path('people.conflict','Сложные разговоры','Говори спокойно и честно.',['Что накопилось','Эмоции','Фраза','Слушать','Границы','Решение','Вывод','Босс: провести разговор'])
  ])}),
  Object.freeze({ id:'head', title:'Голова', icon:'🧠', description:'Фокус, стресс, мышление, внимание и управление состоянием.', paths:Object.freeze([
    path('head.focus','Фокус','Сначала собери внимание.',['Где теряешь фокус','Шум и отвлечения','Один блок работы','Список задач','Ментальный шум','Ритуал фокуса','Отметки','Босс: 7 дней фокуса'],['Голова + Деньги: продуктивность','Голова + Тело: режим']),
    path('head.stress','Стресс','Замечай стресс и управляй реакцией.',['Уровень стресса','Дыхание','Выгрузка','Движение','Триггеры','Границы','Наблюдение','Босс: спокойная неделя'])
  ])}),
  Object.freeze({ id:'meaning', title:'Смысл', icon:'🧭', description:'Ценности, ответственность, история жизни, Лучший Я и наследие.', paths:Object.freeze([
    path('meaning.orient','Личный ориентир','Начни с вопроса «зачем».',['Что для тебя важно','История роста','Лучший Я','Капсула времени','Кто рядом','Принципы','Ответственность','Босс: личный кодекс'],['Смысл + Деньги: зачем зарабатывать','Смысл + Люди: какие отношения нужны']),
    path('meaning.lifeBook','История роста','Увидь, через что ты уже прошёл.',['Точка старта','Школа','Первая работа','Сложный момент','Победа','Фото','Вывод Лёвы','Босс: глава жизни']),
    path('meaning.capsule','Капсула времени','Это разговор с собой через годы.',['Кому пишешь','Когда открыть','Формат','Что важно','Приватность','Сохранить','Ожидание','Босс: капсула создана'])
  ])})
]);

const allPaths = () => PATH_CATALOG.flatMap(sphere => sphere.paths.map(item => ({ sphere, path:item })));
const allChapters = () => allPaths().flatMap(item => item.path.chapters.map(chapter => ({ ...item, chapter })));

function uniqueStrings(value) { return [...new Set(Array.isArray(value) ? value.map(String) : [])]; }
function normalizeProgress(value = {}) {
  const validIds=new Set(allChapters().map(item=>item.chapter.id));
  return Object.freeze({
    completedChapterIds:Object.freeze(uniqueStrings(value.completedChapterIds).filter(id=>validIds.has(id))),
    rewardedChapterIds:Object.freeze(uniqueStrings(value.rewardedChapterIds).filter(id=>validIds.has(id))),
    bookmarks:Object.freeze(uniqueStrings(value.bookmarks).filter(id=>validIds.has(id))),
    xp:Math.max(0, Number(value.xp) || 0),
    mc:Math.max(0, Number(value.mc) || 0),
    updatedAt:value.updatedAt || null
  });
}

export function chapterStatus(pathItem, chapterIndex, progress) {
  const completed=new Set(progress.completedChapterIds);
  const chapter=pathItem.chapters[chapterIndex];
  if(completed.has(chapter.id))return 'completed';
  if(chapterIndex===0 || completed.has(pathItem.chapters[chapterIndex-1].id))return 'available';
  return 'locked';
}

export function buildPathExperience(progressValue = {}) {
  const progress=normalizeProgress(progressValue), completed=new Set(progress.completedChapterIds);
  const chapters=allChapters(), lastCompleted=chapters.find(item=>item.chapter.id===progress.completedChapterIds.at(-1));
  const next=(lastCompleted&&chapters.find(item=>item.path.id===lastCompleted.path.id&&chapterStatus(item.path,item.chapter.number-1,progress)==='available'))||chapters.find(item=>item.path.id==='finance.foundation'&&chapterStatus(item.path,item.chapter.number-1,progress)==='available')||chapters.find(item=>chapterStatus(item.path,item.chapter.number-1,progress)==='available')||null;
  const spheres=PATH_CATALOG.map(sphere=>{
    const ids=sphere.paths.flatMap(item=>item.chapters.map(chapter=>chapter.id));
    const done=ids.filter(id=>completed.has(id)).length;
    return Object.freeze({ ...sphere, completed:done, total:ids.length, progress:ids.length?Math.round(done/ids.length*100):0 });
  });
  return Object.freeze({
    status:'ready', progress, spheres:Object.freeze(spheres), totalCompleted:completed.size, totalChapters:chapters.length,
    totalProgress:chapters.length?Math.round(completed.size/chapters.length*100):0, continuation:next,
    history:Object.freeze(chapters.filter(item=>completed.has(item.chapter.id))),
    bookmarked:Object.freeze(chapters.filter(item=>progress.bookmarks.includes(item.chapter.id)))
  });
}

export function createPathRepository(adapter = null) {
  const reads=typeof adapter?.load === 'function';
  const writes=reads && typeof adapter?.complete === 'function' && typeof adapter?.toggleBookmark === 'function';
  return Object.freeze({
    capabilities:Object.freeze({ reads, writes }),
    async load(context){return normalizeProgress(reads ? await adapter.load(context) : {});},
    async complete(context, currentProgress){
      if(!writes)throw Object.assign(new Error('Path writes require an approved adapter and Security Rules'),{code:'path-writes-disabled'});
      if(currentProgress.completedChapterIds.includes(context.chapterId))return Object.freeze({confirmed:true,reward:0,progress:currentProgress,deduplicated:true});
      const result=await adapter.complete(context);
      if(!result?.confirmed||!result.progress)throw Object.assign(new Error('Path completion was not confirmed'),{code:'path-write-unconfirmed'});
      const progress=normalizeProgress(result.progress);
      if(!progress.completedChapterIds.includes(context.chapterId))throw Object.assign(new Error('Confirmed progress does not contain the completed chapter'),{code:'path-state-mismatch'});
      return Object.freeze({confirmed:true,reward:Math.max(0,Number(result.reward)||0),progress,deduplicated:false});
    },
    async toggleBookmark(context){
      if(!writes)throw Object.assign(new Error('Path bookmarks require an approved adapter and Security Rules'),{code:'path-writes-disabled'});
      const result=await adapter.toggleBookmark(context);
      if(!result?.confirmed||!result.progress)throw Object.assign(new Error('Bookmark change was not confirmed'),{code:'path-write-unconfirmed'});
      return Object.freeze({confirmed:true,progress:normalizeProgress(result.progress)});
    }
  });
}

export async function loadPathExperience(repository, context = {}) {
  try{return Object.freeze({ ...buildPathExperience(await repository.load(context)), capabilities:repository.capabilities });}
  catch(error){return Object.freeze({status:'error',error,capabilities:repository.capabilities,spheres:[],progress:normalizeProgress()});}
}

export function findPath(pathId){return allPaths().find(item=>item.path.id===pathId)||null;}
export function findChapter(chapterId){return allChapters().find(item=>item.chapter.id===chapterId)||null;}
