import { ROUTES, ROOT_ROUTES, resolveDeepLink, resolveRoute } from './routes.js';
import { NavigationStack, createTelegramBackButtonBoundary } from './navigation.js';
import { createConfirmationDialog, renderContentState, trapDialogFocus } from './state-components.js';
import { authenticateTelegram } from './auth.js';
import { accessDecision, daysRemaining, ensureCurrentAccess } from './access.js';
import { PAYMENT_PLANS, TRANSFER_CARD_DISPLAY, discountedPlan, formatRub, managerPaymentLink } from './payment.js';
import { getRuntimeContext, resetRuntimeContext, setAccessContext, setAuthenticatedRuntime, setLifecycle } from './runtime-context.js';
import { loadHomeDashboard, toggleDailyQuest } from './home.js';
import { EVENT_FILTERS, createEventRepository, filterEvents, loadEventsExperience } from './events.js';
import { chapterStatus, createPathRepository, findChapter, findPath, loadPathExperience } from './path.js';
import { WidgetLayoutEditor, createWidgetRepository, widgetById } from './widgets.js';

const outlet = document.querySelector('#route-outlet');
const bottomNav = document.querySelector('#bottom-nav');
const headerBack = document.querySelector('#header-back');
const headerTitle = document.querySelector('#header-title');
const headerBrand = document.querySelector('#header-brand');
const headerSubtitle = document.querySelector('#header-subtitle');
const modalRoot = document.querySelector('#modal-root');
const announcer = document.querySelector('#status-announcer');
const lifecycleRoot = document.querySelector('#lifecycle-root');
const accessBanner = document.querySelector('#access-banner');
const navigation = new NavigationStack(initialRoute());
let modalState = null;
let selectedPlan = '1m';
let homeState = { status:'loading', data:null, error:null };
let eventRepository = createEventRepository();
let eventsState = { status:'loading', items:[], capabilities:{reads:false,writes:false}, filter:'all', selectedEventId:null, actionState:'idle', message:'' };
let pathRepository = createPathRepository();
let pathState = { status:'loading', spheres:[], capabilities:{reads:false,writes:false}, selectedSphereId:'finance', selectedPathId:'finance.foundation', selectedChapterId:null, actionState:'idle' };
let widgetRepository=createWidgetRepository();
let widgetEditor=new WidgetLayoutEditor();
let widgetState={status:'loading',capabilities:{reads:false,writes:false},selectedWidgetId:null,actionState:'idle'};

const rootCards = Object.freeze({
  home: [['notifications.list', 'Уведомления'], ['quest.detail', 'Задание дня'], ['schedule.today', 'Расписание'], ['news.list', 'Новости']],
  lyova: [['lyova.recommendations', 'Рекомендации'], ['lyova.history', 'История'], ['lyova.actions', 'Действия'], ['lyova.settings', 'Настройки']],
  events: [['events.mine', 'Мои записи'], ['events.detail', 'Карточка события']],
  path: [['path.sphere', 'Пять сфер'], ['path.chapter', 'Текущая глава'], ['path.history', 'История'], ['path.bookmarks', 'Закладки']],
  widgets: [['widgets.edit', 'Настроить'], ['widgets.gallery', 'Галерея'], ['widgets.contacts', 'Контакты'], ['widgets.media', 'Медиа']],
  profile: [['profile.publicPreview', 'Публичный профиль'], ['profile.subscription', 'Подписка'], ['profile.privacy', 'Приватность'], ['profile.about', 'О приложении']]
});

function initialRoute() {
  const params = new URLSearchParams(location.search);
  const deepLink = resolveDeepLink(params.get('startapp') || params.get('start_param'));
  const hashRoute = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  return deepLink || (ROUTES[hashRoute] ? hashRoute : 'home');
}

function rootMarkup(meta) {
  if(meta.id==='home')return homeMarkup();
  if(meta.id==='events.list')return eventsMarkup();
  if(meta.id==='path.home')return pathHomeMarkup();
  if(meta.id==='widgets.home')return widgetsHomeMarkup();
  const links = rootCards[meta.parentTab] || [];
  return `<section class="foundation-hero"><span class="eyebrow">V2 FOUNDATION</span><h2>${meta.title}</h2><p>Изолированная оболочка готова к подключению экранного пакета. Реальные пользовательские данные и бизнес-действия здесь ещё не подключены.</p></section><section class="route-grid">${links.map(([routeId, label]) => `<button class="route-card" type="button" data-navigate="${routeId}"><strong>${label}</strong><span>${routeId}</span></button>`).join('')}</section><section class="foundation-note"><strong>Безопасный режим</strong><p>V1 остаётся активной. Эта версия не выполняет Firestore-записи и не меняет production.</p></section>`;
}

function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function contentBlockState(block,label){
  if(block.state==='error')return renderContentState('error',{title:`Не удалось загрузить: ${label}`,message:'Повтори попытку позже.'});
  if(block.state==='empty'||!block.items?.length)return renderContentState('empty',{title:`${label}: пока пусто`});
  return '';
}
function homeMarkup(){
  if(homeState.status==='loading')return renderContentState('loading',{title:'Собираем Главную',message:'Загружаем профиль, квесты, расписание и новости.'});
  if(homeState.status==='error')return renderContentState('error',{title:'Главная не загрузилась',message:'Данные не заменяются примерами. Попробуй ещё раз.',actionLabel:'Повторить'});
  const d=homeState.data;
  const questItems=d.quests.items||[],questDone=questItems.filter(q=>d.quests.done[q.id]).length;
  return `<section class="home-welcome"><span class="eyebrow">ДОБРО ПОЖАЛОВАТЬ</span><h2>Привет, ${escapeHtml(d.identity.displayName)}</h2><p>Сегодня — ещё один шаг к сильной версии себя.</p><div class="home-metrics"><div><b>${d.points}</b><span>баллов</span></div><div><b>${d.level??'—'}</b><span>уровень</span></div><div><b>${d.streak}</b><span>серия</span></div></div></section>${homePathCard(d.path)}<section class="home-card"><div class="home-card-head"><div><span class="eyebrow">КВЕСТ ДНЯ</span><h3>${questDone} из ${questItems.length}</h3></div><button class="secondary-button" type="button" data-navigate="quest.detail">Все задания</button></div>${d.quests.state==='error'?contentBlockState(d.quests,'Квесты'):questItems.slice(0,3).map(q=>`<button class="quest-item${d.quests.done[q.id]?' done':''}" type="button" data-quest-id="${escapeHtml(q.id)}"><span>${d.quests.done[q.id]?'✓':'○'}</span><b>${escapeHtml(q.text)}</b><small>+${q.points}</small></button>`).join('')}</section><section class="home-grid"><article class="home-card"><span class="eyebrow">БЛИЖАЙШЕЕ СОБЫТИЕ</span>${homeNearestEventMarkup(d.nearestEvent)}</article><article class="home-card"><span class="eyebrow">ЛЁВА РЕКОМЕНДУЕТ</span>${renderContentState('disabled',{title:'Без выдуманных советов',message:d.recommendation.message})}</article></section><section class="home-card"><div class="home-card-head"><div><span class="eyebrow">СЕГОДНЯ</span><h3>Расписание</h3></div><button class="secondary-button" type="button" data-navigate="schedule.today">Открыть</button></div>${contentBlockState(d.schedule,'Расписание')||d.schedule.items.map(item=>`<div class="schedule-item"><time>${escapeHtml(item.time||'—')}</time><span>${escapeHtml(item.title||'Событие')}</span></div>`).join('')}</section><section class="home-card"><div class="home-card-head"><div><span class="eyebrow">КЛУБ</span><h3>Новости</h3></div><button class="secondary-button" type="button" data-navigate="news.list">Все новости</button></div>${contentBlockState(d.news,'Новости')||d.news.items.map(item=>`<button class="news-item" type="button" data-news-id="${escapeHtml(item.id)}"><b>${escapeHtml(item.title||'Новость')}</b><span>${escapeHtml((item.body||'').slice(0,100))}</span></button>`).join('')}</section>`;
}

function homeInnerMarkup(meta){
  const d=homeState.data;
  if(!d)return renderContentState('loading');
  if(meta.id==='quest.detail')return `<section class="inner-intro"><span class="eyebrow">КВЕСТ ДНЯ</span><h2>Задания на сегодня</h2><p>Награда начисляется один раз, даже если снять отметку и поставить её снова.</p></section><section class="home-card">${d.quests.items.map(q=>`<button class="quest-item${d.quests.done[q.id]?' done':''}" type="button" data-quest-id="${escapeHtml(q.id)}"><span>${d.quests.done[q.id]?'✓':'○'}</span><b>${escapeHtml(q.text)}</b><small>+${q.points}</small></button>`).join('')}</section>`;
  if(meta.id==='schedule.today')return `<section class="inner-intro"><span class="eyebrow">СЕГОДНЯ</span><h2>Расписание</h2><p>Личное расписание из существующего V1 mirror.</p></section>${contentBlockState(d.schedule,'Расписание')||`<section class="home-card">${d.schedule.items.map(item=>`<div class="schedule-item"><time>${escapeHtml(item.time||'—')}</time><span>${escapeHtml(item.title||'Событие')}</span></div>`).join('')}</section>`}`;
  if(meta.id==='news.list')return `<section class="inner-intro"><span class="eyebrow">КЛУБ</span><h2>Новости</h2><p>Только публикации из существующей коллекции news.</p></section>${contentBlockState(d.news,'Новости')||`<section class="home-card">${d.news.items.map(item=>`<button class="news-item" type="button" data-news-id="${escapeHtml(item.id)}"><b>${escapeHtml(item.title||'Новость')}</b><span>${escapeHtml((item.body||'').slice(0,180))}</span></button>`).join('')}</section>`}`;
  if(meta.id==='news.detail'){
    const params=new URLSearchParams(location.search),item=d.news.items.find(news=>news.id===params.get('news'))||d.news.items[0];
    return item?`<article class="inner-intro"><span class="eyebrow">НОВОСТЬ</span><h2>${escapeHtml(item.title||'Новость')}</h2><p>${escapeHtml(item.body||'')}</p></article>`:renderContentState('empty',{title:'Новость не найдена'});
  }
  return null;
}

function eventDate(value){
  if(!value)return 'Дата уточняется';
  return value.toLocaleString('ru-RU',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Irkutsk'});
}
function homePathCard(fallback){
  if(pathState.status!=='ready')return `<section class="home-card path-card"><div><span class="eyebrow">ПУТЬ</span><h3>${escapeHtml(fallback.title)}</h3><p>${escapeHtml(fallback.message)}</p></div><button class="primary-button" type="button" data-navigate="path.home">Открыть</button></section>`;
  const next=pathState.continuation;
  return `<section class="home-card path-card"><div><span class="eyebrow">ПУТЬ · ${pathState.totalProgress}%</span><h3>${escapeHtml(next?.chapter.title||'Карта жизни')}</h3><p>${escapeHtml(next?`${next.sphere.title} · ${next.path.name}`:'Все доступные главы завершены')}</p></div><button class="primary-button" type="button" ${next?`data-path-chapter="${escapeHtml(next.chapter.id)}"`:'data-navigate="path.home"'}>${next?'Продолжить':'Открыть'}</button></section>`;
}
function homeNearestEventMarkup(fallback){
  const nearest=eventsState.status==='ready'?filterEvents(eventsState.items,'upcoming')[0]:null;
  if(!nearest)return renderContentState(eventsState.status==='error'?'error':'empty',{title:'Пока не подключено',message:eventsState.message||fallback.message});
  return `<div class="home-event"><h3>${escapeHtml(nearest.title)}</h3><p>${escapeHtml(eventDate(nearest.startsAt))}</p><button class="secondary-button" type="button" data-event-id="${escapeHtml(nearest.id)}">Подробнее</button></div>`;
}
function attendanceCopy(event){
  return {registered:'Ты участвуешь',waitlist:'Лист ожидания',full:'Мест нет',cancelled:'Отменено',completed:'Завершено',archive:'В архиве'}[event.attendanceState]||{full:'Мест нет',cancelled:'Отменено',completed:'Завершено',archive:'В архиве'}[event.state]||'Можно записаться';
}
function eventAction(event,compact=false){
  if(!eventsState.capabilities.writes)return `<span class="event-action-note">Запись скоро</span>`;
  if(event.attendanceState==='registered'||event.attendanceState==='waitlist')return `<button class="${compact?'event-link':'secondary-button'}" type="button" data-event-action="cancel" data-event-id="${escapeHtml(event.id)}">Отменить</button>`;
  if(['full','cancelled','completed','archive'].includes(event.state))return `<span class="event-action-note">${attendanceCopy(event)}</span>`;
  return `<button class="${compact?'event-link':'primary-button'}" type="button" data-event-action="register" data-event-id="${escapeHtml(event.id)}">Записаться</button>`;
}
function eventCard(event){
  return `<article class="event-card"><button class="event-card-main" type="button" data-event-id="${escapeHtml(event.id)}"><span class="event-format">${event.format==='online'?'ОНЛАЙН':'ОФФЛАЙН'}</span><strong>${escapeHtml(event.title)}</strong><small>${escapeHtml(eventDate(event.startsAt))}${event.location?` · ${escapeHtml(event.location)}`:''}</small><span class="attendance-state state-${escapeHtml(event.attendanceState)}">${escapeHtml(attendanceCopy(event))}</span></button>${eventAction(event,true)}</article>`;
}
function eventFiltersMarkup(){
  return `<div class="event-toolbar"><div class="event-filters" role="group" aria-label="Фильтры мероприятий">${EVENT_FILTERS.map(filter=>`<button type="button" data-event-filter="${filter.id}" class="${eventsState.filter===filter.id?'active':''}">${filter.label}</button>`).join('')}</div><button class="secondary-button" type="button" data-navigate="events.mine">Мои записи</button></div>`;
}
function eventsMarkup(){
  const intro='<section class="events-hero"><span class="eyebrow">КЛУБНАЯ АФИША</span><h2>Мероприятия</h2><p>События клуба и твои подтверждённые записи.</p></section>';
  if(eventsState.status==='loading')return intro+eventFiltersMarkup()+renderContentState('loading',{title:'Загружаем мероприятия'});
  if(eventsState.status==='error')return intro+eventFiltersMarkup()+renderContentState('error',{title:'Каталог не загрузился',message:eventsState.message,actionLabel:'Повторить'});
  const visible=filterEvents(eventsState.items,eventsState.filter);
  if(!visible.length)return intro+eventFiltersMarkup()+renderContentState('empty',{title:eventsState.filter==='mine'?'Записей пока нет':'Мероприятий пока нет',message:eventsState.message});
  const nearest=filterEvents(eventsState.items,'upcoming')[0];
  return `${nearest&&eventsState.filter==='all'?`<section class="event-feature"><span class="eyebrow">БЛИЖАЙШЕЕ СОБЫТИЕ</span><h2>${escapeHtml(nearest.title)}</h2><p>${escapeHtml(eventDate(nearest.startsAt))}${nearest.location?` · ${escapeHtml(nearest.location)}`:''}</p><div class="participant-preview" aria-label="Участники">${nearest.participants.length?nearest.participants.map(person=>`<span title="${escapeHtml(person.name)}">${escapeHtml(person.name.slice(0,1))}</span>`).join(''):'<small>Состав участников уточняется</small>'}</div><div class="event-feature-actions"><button class="secondary-button" type="button" data-event-id="${escapeHtml(nearest.id)}">Подробнее</button>${eventAction(nearest)}</div></section>`:intro}${eventFiltersMarkup()}<section class="event-list">${visible.map(eventCard).join('')}</section>`;
}

function selectedEvent(){return eventsState.items.find(event=>event.id===eventsState.selectedEventId)||null;}
function eventInnerMarkup(meta){
  if(!meta.id.startsWith('events.'))return null;
  if(meta.id==='events.mine'){
    const mine=filterEvents(eventsState.items,'mine');
    return `<section class="inner-intro"><span class="eyebrow">МОИ ЗАПИСИ</span><h2>Твои мероприятия</h2><p>Только подтверждённые записи и лист ожидания.</p></section>${mine.length?`<section class="event-list">${mine.map(eventCard).join('')}</section>`:renderContentState('empty',{title:'Записей пока нет',message:eventsState.message})}`;
  }
  const event=selectedEvent();
  if(!event)return renderContentState('empty',{title:'Мероприятие не найдено',message:'Вернись к актуальному каталогу.'});
  if(meta.id==='events.detail')return `<article class="event-detail"><span class="event-format">${event.format==='online'?'ОНЛАЙН':'ОФФЛАЙН'}</span><h2>${escapeHtml(event.title)}</h2><p>${escapeHtml(event.summary||'Описание появится после публикации организатором.')}</p><dl><div><dt>Когда</dt><dd>${escapeHtml(eventDate(event.startsAt))}</dd></div><div><dt>Где</dt><dd>${escapeHtml(event.location||'Место уточняется')}</dd></div><div><dt>Статус</dt><dd>${escapeHtml(attendanceCopy(event))}</dd></div></dl><div class="participant-preview">${event.participants.length?event.participants.map(person=>`<span title="${escapeHtml(person.name)}">${escapeHtml(person.name.slice(0,1))}</span>`).join(''):'<small>Участники пока не опубликованы</small>'}</div><div class="event-feature-actions">${eventAction(event)}</div>${!eventsState.capabilities.writes?renderContentState('disabled',{title:'Запись временно недоступна',message:'Нужны утверждённые схема регистраций и Firestore Security Rules.'}):''}</article>`;
  const cancelling=meta.id==='events.cancellationConfirm';
  return `<section class="inner-intro"><span class="eyebrow">${cancelling?'ОТМЕНА УЧАСТИЯ':'ПОДТВЕРЖДЕНИЕ ЗАПИСИ'}</span><h2>${escapeHtml(event.title)}</h2><p>${cancelling?'После отмены место может перейти другому участнику.':'Проверь дату, формат и условия участия перед подтверждением.'}</p></section><section class="event-confirm-card"><strong>${escapeHtml(eventDate(event.startsAt))}</strong><span>${escapeHtml(event.location||'Место уточняется')}</span>${event.registrationNote?`<p>${escapeHtml(event.registrationNote)}</p>`:''}${eventsState.actionState==='failed'?renderContentState('error',{title:'Изменение не подтверждено',message:'Текущий статус сохранён. Повтори после подключения защищённого backend-контракта.'}):''}${eventsState.capabilities.writes?`<button class="primary-button${cancelling?' destructive':''} full-width" type="button" data-event-confirm="${cancelling?'cancel':'register'}" data-event-id="${escapeHtml(event.id)}">${cancelling?'Подтвердить отмену':'Подтвердить запись'}</button>`:renderContentState('disabled',{title:'Подтверждение недоступно',message:'UI не изображает успешную запись без подтверждённого изменения на сервере.'})}</section>`;
}

function selectedPathInfo(){return findPath(pathState.selectedPathId)||findPath('finance.foundation');}
function selectedChapterInfo(){return findChapter(pathState.selectedChapterId);}
function pathHomeMarkup(){
  if(pathState.status==='loading')return renderContentState('loading',{title:'Собираем карту Пути'});
  if(pathState.status==='error')return renderContentState('error',{title:'Путь не загрузился',message:'Прогресс не заменяется демонстрационными значениями.',actionLabel:'Повторить'});
  const next=pathState.continuation;
  return `<section class="path-hero"><span class="eyebrow">КАРТА ЖИЗНИ</span><h2>Твой Путь · ${pathState.totalProgress}%</h2><p>${pathState.totalCompleted} из ${pathState.totalChapters} глав · ${pathState.progress.xp} XP</p>${next?`<button class="primary-button full-width" type="button" data-path-chapter="${escapeHtml(next.chapter.id)}">Продолжить: ${escapeHtml(next.chapter.title)}</button>`:''}</section><section class="path-spheres">${pathState.spheres.map(sphere=>`<button type="button" data-path-sphere="${sphere.id}"><span>${sphere.icon}</span><strong>${escapeHtml(sphere.title)}</strong><small>${sphere.progress}% · ${sphere.completed}/${sphere.total}</small><i><b style="width:${sphere.progress}%"></b></i></button>`).join('')}</section><section class="path-shortcuts"><button class="secondary-button" type="button" data-navigate="path.history">История</button><button class="secondary-button" type="button" data-navigate="path.bookmarks">Закладки</button></section>${!pathState.capabilities.writes?renderContentState('stale',{title:'Прогресс только для чтения',message:'V1 не сохранял mcPathState. Запись включится после утверждения schema и Security Rules.'}):''}`;
}
function pathRows(items,emptyTitle){
  return items.length?`<section class="path-chapter-list">${items.map(item=>`<button type="button" data-path-chapter="${escapeHtml(item.chapter.id)}"><span>${item.chapter.boss?'👑':item.chapter.number}</span><b>${escapeHtml(item.chapter.title)}</b><small>${escapeHtml(item.sphere.title)} · ${escapeHtml(item.path.name)}</small></button>`).join('')}</section>`:renderContentState('empty',{title:emptyTitle});
}
function pathInnerMarkup(meta){
  if(!meta.id.startsWith('path.'))return null;
  if(pathState.status!=='ready')return pathHomeMarkup();
  if(meta.id==='path.history')return `<section class="inner-intro"><span class="eyebrow">ИСТОРИЯ</span><h2>Пройденные главы</h2><p>Только подтверждённый прогресс.</p></section>${pathRows(pathState.history,'История пока пуста')}`;
  if(meta.id==='path.bookmarks')return `<section class="inner-intro"><span class="eyebrow">ЗАКЛАДКИ</span><h2>Сохранённые уроки</h2><p>Вернись к важным главам.</p></section>${pathRows(pathState.bookmarked,'Закладок пока нет')}`;
  const info=selectedPathInfo(),sphere=pathState.spheres.find(item=>item.id===(pathState.selectedSphereId||info.sphere.id))||info.sphere;
  if(meta.id==='path.sphere')return `<section class="path-region-hero"><span>${sphere.icon}</span><div><span class="eyebrow">СФЕРА</span><h2>${escapeHtml(sphere.title)}</h2><p>${escapeHtml(sphere.description)}</p></div></section><section class="path-route-list">${sphere.paths.map(item=>`<button type="button" data-path-id="${item.id}"><b>${escapeHtml(item.name)}</b><span>${item.chapters.length} глав</span></button>`).join('')}</section>`;
  if(meta.id==='path.chapter')return `<section class="inner-intro"><span class="eyebrow">${escapeHtml(info.sphere.title)}</span><h2>${escapeHtml(info.path.name)}</h2><p>${escapeHtml(info.path.recommendation)}</p></section><section class="path-chapter-list">${info.path.chapters.map((chapter,index)=>{const status=chapterStatus(info.path,index,pathState.progress);return `<button type="button" data-path-chapter="${chapter.id}" class="${status}"><span>${status==='completed'?'✓':status==='locked'?'🔒':chapter.boss?'👑':chapter.number}</span><b>${escapeHtml(chapter.title)}</b><small>${status==='completed'?'Пройдено':status==='locked'?'Сначала предыдущая глава':`~${chapter.durationMinutes} мин · +${chapter.xp} XP`}</small></button>`;}).join('')}</section><section class="path-bridges">${info.path.bridges.map(value=>`<span>${escapeHtml(value)}</span>`).join('')}</section>`;
  const selected=selectedChapterInfo();
  if(!selected)return renderContentState('empty',{title:'Глава не найдена'});
  const status=chapterStatus(selected.path,selected.chapter.number-1,pathState.progress);
  if(meta.id==='path.lockedReason'||status==='locked')return `<section class="inner-intro"><span class="eyebrow">ПОСЛЕДОВАТЕЛЬНЫЙ ПУТЬ</span><h2>${escapeHtml(selected.chapter.title)}</h2><p>Эта глава откроется после завершения предыдущей: ${escapeHtml(selected.path.chapters[selected.chapter.number-2]?.title||'текущей главы')}.</p></section>${renderContentState('locked',{title:'Глава пока закрыта',message:'Пройди маршрут по порядку — подтверждённый прогресс не обходится.'})}`;
  const bookmarked=pathState.progress.bookmarks.includes(selected.chapter.id),done=status==='completed';
  return `<article class="path-lesson"><span class="eyebrow">${escapeHtml(selected.sphere.title)} · ${escapeHtml(selected.path.name)}</span><h2>${escapeHtml(selected.chapter.title)}</h2><p>Практическая глава продвинутой Карты жизни. Содержание и ответы будут подключены через отдельный content adapter без потери структуры V1.</p><div class="path-lesson-meta"><span>~${selected.chapter.durationMinutes} мин</span><span>+${selected.chapter.xp} XP</span><span>${done?'Пройдено':'Доступно'}</span></div>${pathState.capabilities.writes?`<button class="secondary-button full-width" type="button" data-path-bookmark="${selected.chapter.id}">${bookmarked?'Убрать из закладок':'В закладки'}</button>`:''}${done?'':pathState.capabilities.writes?`<button class="primary-button full-width" type="button" data-path-complete="${selected.chapter.id}">Завершить главу</button>`:renderContentState('disabled',{title:'Завершение пока недоступно',message:'Награда, прогресс и закладки появятся только после подтверждённой серверной записи.'})}</article>`;
}

function widgetCard(item,editing=false){
  const widget=widgetById(item.widgetId);if(!widget)return '';
  if(editing)return `<article class="widget-card editing size-${item.size}"><div class="widget-drag">••• ПЕРЕТАЩИ</div><div class="widget-card-head"><span>${widget.icon}</span><div><b>${escapeHtml(widget.title)}</b><small>${escapeHtml(item.size)}</small></div></div><div class="widget-controls"><button type="button" data-widget-move="-1" data-widget-id="${widget.id}" aria-label="Выше">↑</button><button type="button" data-widget-move="1" data-widget-id="${widget.id}" aria-label="Ниже">↓</button><button type="button" data-widget-resize="${widget.id}">Размер</button><button type="button" data-widget-hide="${widget.id}">Скрыть</button></div></article>`;
  return `<button class="widget-card size-${item.size}" type="button" data-widget-open="${widget.id}"><div class="widget-card-head"><span>${widget.icon}</span><div><b>${escapeHtml(widget.title)}</b><small>${escapeHtml(widget.description)}</small></div></div><i>Открыть →</i></button>`;
}
function widgetsHomeMarkup(){
  if(widgetState.status==='loading')return renderContentState('loading',{title:'Загружаем рабочую панель'});
  if(widgetState.status==='error')return renderContentState('error',{title:'Виджеты не загрузились',actionLabel:'Повторить'});
  return `<section class="widgets-hero"><span class="eyebrow">РАБОЧАЯ ПАНЕЛЬ</span><h2>Виджеты</h2><p>Инструменты в утверждённой вертикальной компоновке.</p><div><button class="secondary-button" type="button" data-navigate="widgets.edit">Изменить</button><button class="primary-button" type="button" data-navigate="widgets.gallery">+ Добавить</button></div></section><section class="widget-stack">${widgetEditor.visible().map(item=>widgetCard(item)).join('')}</section>`;
}
function widgetToolMarkup(meta){
  if(meta.id==='widgets.contactNew')return `<section class="inner-intro"><span class="eyebrow">КОНТАКТЫ</span><h2>Новый контакт</h2><p>Deep link new_contact приводит прямо сюда.</p></section><section class="widget-form"><input placeholder="Имя" disabled><input placeholder="Telegram" disabled><textarea placeholder="Заметка" disabled></textarea>${renderContentState('disabled',{title:'Сохранение подключится через V1 adapter',message:'Форма не сообщает об успехе без подтверждённой записи.'})}</section>`;
  if(meta.id==='widgets.quickActions')return `<section class="inner-intro"><span class="eyebrow">БЫСТРЫЕ ДЕЙСТВИЯ</span><h2>Что сделать?</h2><p>Каждая активная кнопка ведёт в реальный маршрут.</p></section><section class="quick-action-grid"><button data-navigate="widgets.contactNew">Новый контакт</button><button data-navigate="widgets.finance">Финансы</button><button data-navigate="events.list">Мероприятия</button><button data-navigate="widgets.notes">Заметка</button></section>`;
  const widgetId={
    'widgets.mind':'mind','widgets.contacts':'contacts','widgets.finance':'finance','widgets.habits':'habits','widgets.health':'health','widgets.events':'events','widgets.notes':'notes','widgets.media':'media'
  }[meta.id]||widgetState.selectedWidgetId;
  const widget=widgetById(widgetId);
  if(!widget)return null;
  const action=widget.id==='contacts'?'<button class="primary-button full-width" type="button" data-navigate="widgets.contactNew">+ Новый контакт</button>':widget.id==='events'?'<button class="primary-button full-width" type="button" data-navigate="events.list">Открыть мероприятия</button>':'';
  return `<section class="widget-tool"><span>${widget.icon}</span><div><span class="eyebrow">ИНСТРУМЕНТ V1</span><h2>${escapeHtml(widget.title)}</h2><p>${escapeHtml(widget.description)}. Существующая бизнес-логика будет подключена через совместимый adapter в Package 9.</p></div></section>${action}${renderContentState(widget.id==='media'?'empty':'disabled',{title:widget.id==='media'?'Медиа пока пусто':'Данные пока не подключены',message:'Экран не подменяет реальные данные примерами.'})}`;
}
function widgetInnerMarkup(meta){
  if(!meta.id.startsWith('widgets.'))return null;
  if(meta.id==='widgets.edit')return `<section class="inner-intro"><span class="eyebrow">РЕДАКТОР</span><h2>Настрой панель</h2><p>Порядок, размер и видимость изменяются в черновике до сохранения.</p></section><section class="widget-stack">${widgetEditor.visible().map(item=>widgetCard(item,true)).join('')}</section><div class="widget-edit-actions"><button class="secondary-button" type="button" data-widget-reset>Сбросить</button><button class="secondary-button" type="button" data-widget-cancel>Отмена</button><button class="primary-button" type="button" data-widget-save ${widgetState.capabilities.writes?'':'disabled'}>Сохранить</button></div>${!widgetState.capabilities.writes?renderContentState('stale',{title:'Сохранение пока отключено',message:'Layout сохраняется только в Firestore после schema/security approval. Черновик можно проверить и отменить.'}):''}`;
  if(meta.id==='widgets.gallery')return `<section class="inner-intro"><span class="eyebrow">ГАЛЕРЕЯ</span><h2>Скрытые виджеты</h2><p>Восстанови модуль в рабочую панель.</p></section>${widgetEditor.hidden().length?`<section class="widget-gallery">${widgetEditor.hidden().map(item=>{const widget=widgetById(item.widgetId);return `<button type="button" data-widget-restore="${widget.id}"><span>${widget.icon}</span><b>${escapeHtml(widget.title)}</b><small>Восстановить</small></button>`;}).join('')}</section>`:renderContentState('empty',{title:'Все виджеты на панели'})}`;
  return widgetToolMarkup(meta);
}

function innerMarkup(meta) {
  if (meta.id.startsWith('payment.')) return paymentMarkup(meta.id);
  const homeInner=homeInnerMarkup(meta);if(homeInner)return homeInner;
  const eventInner=eventInnerMarkup(meta);if(eventInner)return eventInner;
  const pathInner=pathInnerMarkup(meta);if(pathInner)return pathInner;
  const widgetInner=widgetInnerMarkup(meta);if(widgetInner)return widgetInner;
  const specialState = meta.id === 'path.lockedReason' ? 'locked' : meta.id === 'payment.error' ? 'error' : meta.id === 'lyova.history' ? 'empty' : 'disabled';
  return `<section class="inner-intro"><span class="eyebrow">${meta.id}</span><h2>${meta.title}</h2><p>Route зарегистрирован, связан с вкладкой «${meta.parentTab}» и готов к экранной реализации следующего пакета.</p></section>${renderContentState(specialState, specialState === 'disabled' ? { title: 'Экран подключится следующим пакетом', message: 'Foundation не изображает работу ещё не подключённой функции.' } : {})}${meta.critical ? '<button class="primary-button destructive-demo" type="button" data-confirm-demo>Проверить безопасное подтверждение</button>' : ''}`;
}

function paymentMarkup(routeId) {
  const access = getRuntimeContext().access;
  const discountPct = access?.discountPct || 0;
  if (routeId === 'payment.plans') {
    return `<section class="inner-intro payment-hero"><span class="eyebrow">ДОСТУП MENCLUB</span><h2>Выбери тариф</h2><p>Прогресс сохраняется. Оплата подтверждается менеджером после перевода и отправки чека.</p></section><section class="plan-list">${Object.keys(PAYMENT_PLANS).map(id => { const plan=discountedPlan(id,discountPct); return `<button type="button" class="plan-card${id===selectedPlan?' selected':''}" data-plan="${id}"><span><strong>${plan.label}</strong><small>≈ ${plan.finalStars.toLocaleString('ru-RU')} ⭐</small></span><b>${formatRub(plan.finalRub)}</b></button>`; }).join('')}</section><button class="primary-button full-width" type="button" data-payment-next>Продолжить с выбранным тарифом</button>`;
  }
  if (routeId === 'payment.transfer') {
    const plan = discountedPlan(selectedPlan, discountPct);
    return `<section class="inner-intro"><span class="eyebrow">ОПЛАТА ПЕРЕВОДОМ</span><h2>${plan.label} · ${formatRub(plan.finalRub)}</h2><p>Переведи сумму на карту, затем напиши менеджеру и приложи чек. Доступ откроют после ручной проверки.</p></section><section class="transfer-card"><span>Газпромбанк · Оксана Л.</span><strong id="transfer-card-number">${TRANSFER_CARD_DISPLAY}</strong><button class="secondary-button" type="button" data-copy-card>Скопировать номер</button></section><button class="primary-button full-width" type="button" data-payment-confirm>Проверить и написать менеджеру</button>`;
  }
  if (routeId === 'payment.confirmation') {
    const plan = discountedPlan(selectedPlan, discountPct);
    return `<section class="inner-intro"><span class="eyebrow">ПОДТВЕРЖДЕНИЕ</span><h2>Чек готов к отправке?</h2><p>Тариф: ${plan.label}. Сумма: ${formatRub(plan.finalRub)}. Telegram откроет диалог с менеджером; приложение не считает оплату успешной до ручного подтверждения.</p></section><button class="primary-button full-width" type="button" data-open-manager>Открыть диалог с менеджером</button>`;
  }
  if (routeId === 'payment.success') return renderContentState('stale', { title:'Ожидаем подтверждение', message:'Успешная оплата появится только после подтверждённого результата от платёжного процесса.' });
  return renderContentState(routeId === 'payment.error' ? 'error' : 'stale');
}

function render(routeId, options = {}) {
  const meta = resolveRoute(routeId);
  const decision = accessDecision(meta.id, getRuntimeContext().access);
  if (!decision.allowed && decision.redirect && meta.id !== decision.redirect) {
    navigation.navigate(decision.redirect, { replace:true });
    return render(decision.redirect, options);
  }
  const root = ROOT_ROUTES[meta.parentTab] === meta.id;
  document.querySelector('#app').dataset.lifecycle = navigator.onLine ? 'ready' : 'offlineReady';
  headerTitle.textContent = meta.title;
  headerBrand.textContent = root && meta.id === 'home' ? 'MENCLUB' : 'MENCLUB V2';
  headerSubtitle.textContent = root ? 'Development foundation' : meta.id;
  headerBack.hidden = !navigation.canGoBack();
  bottomNav.hidden = !meta.bottomNavVisible;
  bottomNav.querySelectorAll('[data-route]').forEach(button => {
    const active = resolveRoute(button.dataset.route).parentTab === meta.parentTab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });
  outlet.innerHTML = root ? rootMarkup(meta) : innerMarkup(meta);
  location.hash = `/${meta.id}`;
  telegramBack.sync(navigation.canGoBack() || Boolean(modalState));
  requestAnimationFrame(() => {
    outlet.scrollTop = options.repeated ? 0 : (options.restoreScroll || 0);
    outlet.focus({ preventScroll: true });
  });
  announcer.textContent = `Открыт экран: ${meta.title}`;
}

function syncAccessBanner() {
  const access = getRuntimeContext().access;
  if (access?.accessClass === 'demoActive') {
    const days = daysRemaining(access.until);
    accessBanner.textContent = `Демо-доступ: осталось ${days} дн. · Открыть тарифы`;
    accessBanner.hidden = false;
  } else if (access?.accessClass === 'demoExpired') {
    accessBanner.textContent = 'Демо завершено · Выбрать тариф';
    accessBanner.hidden = false;
  } else accessBanner.hidden = true;
}

function renderLifecycle(state, error) {
  if (state) {
    setLifecycle(state);
    document.querySelector('#app').dataset.lifecycle = state;
  }
  const copy = {
    booting:['Запускаем MenClub','Подготавливаем безопасную оболочку…'],
    authenticating:['Проверяем доступ','Подтверждаем Telegram и Firebase…'],
    loadingCoreData:['Загружаем доступ','Проверяем подписку и демо-период…'],
    authError:['Не удалось войти',error?.message || 'Попробуй ещё раз.'],
    fatalError:['Не удалось запустить приложение',error?.message || 'Попробуй открыть V1.']
  }[state];
  if (!copy) { lifecycleRoot.hidden = true; lifecycleRoot.innerHTML = ''; return; }
  lifecycleRoot.hidden = false;
  lifecycleRoot.innerHTML = `<section class="lifecycle-card">${renderContentState(state==='authError'||state==='fatalError'?'error':'loading',{title:copy[0],message:copy[1]})}${state==='authError'?'<button class="primary-button full-width" type="button" data-auth-retry>Повторить</button>':''}<a class="fallback-link" href="../v1/index.html">Открыть V1 Stable</a></section>`;
}

async function bootstrap() {
  resetRuntimeContext();
  renderLifecycle('booting');
  const telegram = window.Telegram?.WebApp;
  telegram?.ready?.();
  telegram?.expand?.();
  try {
    renderLifecycle('authenticating');
    const authenticated = await authenticateTelegram({ firebase:window.firebase, telegram });
    setAuthenticatedRuntime(authenticated);
    renderLifecycle('loadingCoreData');
    const access = await ensureCurrentAccess(authenticated.db, authenticated.user.uid);
    setAccessContext(access);
    homeState={status:'loading',data:null,error:null};
    try{homeState={status:'ready',data:await loadHomeDashboard(authenticated.db,authenticated.user.uid,{telegramUser:telegram?.initDataUnsafe?.user||null}),error:null};}
    catch(error){homeState={status:'error',data:null,error};}
    eventRepository=createEventRepository(window.MENCLUB_V2_EVENT_ADAPTER||null);
    eventsState={...(await loadEventsExperience(eventRepository,{db:authenticated.db,uid:authenticated.user.uid})),filter:'all',selectedEventId:null,actionState:'idle'};
    pathRepository=createPathRepository(window.MENCLUB_V2_PATH_ADAPTER||null);
    pathState={...(await loadPathExperience(pathRepository,{db:authenticated.db,uid:authenticated.user.uid})),selectedSphereId:'finance',selectedPathId:'finance.foundation',selectedChapterId:null,actionState:'idle'};
    widgetRepository=createWidgetRepository(window.MENCLUB_V2_WIDGET_ADAPTER||null);
    try{widgetEditor=new WidgetLayoutEditor(await widgetRepository.load({db:authenticated.db,uid:authenticated.user.uid}));widgetState={status:'ready',capabilities:widgetRepository.capabilities,selectedWidgetId:null,actionState:'idle'};}
    catch(error){widgetState={status:'error',capabilities:widgetRepository.capabilities,selectedWidgetId:null,actionState:'failed'};}
    const readyState=navigator.onLine ? 'ready' : 'offlineReady';
    setLifecycle(readyState);
    document.querySelector('#app').dataset.lifecycle=readyState;
    renderLifecycle(null);
    syncAccessBanner();
    render(navigation.current);
  } catch (error) {
    console.warn('V2 bootstrap failed:', error?.code || error?.name || 'unknown');
    renderLifecycle(error?.code ? 'authError' : 'fatalError', error);
  }
}

function navigate(routeId, options={}) {
  if(!options.bypassWidgetGuard&&navigation.current==='widgets.edit'&&widgetEditor.dirty&&routeId!=='widgets.edit'){openWidgetDiscardConfirmation(routeId);return;}
  closeModal();
  const outcome = navigation.navigate(routeId, { currentScroll: outlet.scrollTop });
  render(outcome.routeId, outcome);
}

function openWidgetConfirmation(kind,pendingRoute=null){
  if(modalState)return;const trigger=document.activeElement;
  const reset=kind==='widget-reset';
  const dialog=createConfirmationDialog({title:reset?'Сбросить расположение?':'Отменить изменения?',body:reset?'Панель вернётся к утверждённому начальному составу и порядку.':'Несохранённый порядок, размеры и скрытые виджеты будут потеряны.',primaryLabel:reset?'Сбросить':'Выйти без сохранения',destructive:true,critical:true});
  modalRoot.append(dialog);modalState={dialog,trigger,releaseFocusTrap:trapDialogFocus(dialog),kind,pendingRoute};telegramBack.sync(true);
}
function openWidgetDiscardConfirmation(routeId){openWidgetConfirmation('widget-discard',routeId);}

function goBack() {
  if (modalState) { closeModal(); return; }
  if(navigation.current==='widgets.edit'&&widgetEditor.dirty){openWidgetConfirmation('widget-discard-back');return;}
  const previous = navigation.back();
  if (previous) render(previous);
}

function openConfirmation() {
  if (modalState) return;
  const trigger = document.activeElement;
  const dialog = createConfirmationDialog({
    title: 'Подтвердить действие?',
    body: 'Это демонстрация общего confirmation-компонента. Никакие данные не будут изменены.',
    primaryLabel: 'Подтвердить без записи',
    destructive: true,
    critical: true
  });
  modalRoot.append(dialog);
  const releaseFocusTrap = trapDialogFocus(dialog);
  modalState = { dialog, trigger, releaseFocusTrap };
  telegramBack.sync(true);
}

function closeModal() {
  if (!modalState) return;
  modalState.releaseFocusTrap();
  modalState.dialog.remove();
  modalState.trigger?.focus?.();
  modalState = null;
  telegramBack.sync(navigation.canGoBack());
}

const telegramBack = createTelegramBackButtonBoundary(window, goBack);

bottomNav.addEventListener('click', event => {
  const button = event.target.closest('[data-route]');
  if (button) navigate(button.dataset.route);
});
headerBack.addEventListener('click', goBack);
outlet.addEventListener('click', event => {
  const widgetOpen=event.target.closest('[data-widget-open]');if(widgetOpen){widgetState.selectedWidgetId=widgetOpen.dataset.widgetOpen;navigate(widgetById(widgetState.selectedWidgetId)?.route||'widgets.widget');return;}
  const widgetMove=event.target.closest('[data-widget-move]');if(widgetMove){widgetEditor.move(widgetMove.dataset.widgetId,Number(widgetMove.dataset.widgetMove));render('widgets.edit');return;}
  const widgetResize=event.target.closest('[data-widget-resize]');if(widgetResize){widgetEditor.resize(widgetResize.dataset.widgetResize);render('widgets.edit');return;}
  const widgetHide=event.target.closest('[data-widget-hide]');if(widgetHide){widgetEditor.hide(widgetHide.dataset.widgetHide);render('widgets.edit');return;}
  const widgetRestore=event.target.closest('[data-widget-restore]');if(widgetRestore){widgetEditor.restore(widgetRestore.dataset.widgetRestore);navigate('widgets.edit');return;}
  if(event.target.closest('[data-widget-reset]')){openWidgetConfirmation('widget-reset');return;}
  if(event.target.closest('[data-widget-cancel]')){widgetEditor.cancel();navigate('widgets.home',{bypassWidgetGuard:true});return;}
  if(event.target.closest('[data-widget-save]')){saveWidgetLayout();return;}
  const pathSphere=event.target.closest('[data-path-sphere]');
  if(pathSphere){pathState.selectedSphereId=pathSphere.dataset.pathSphere;const sphere=pathState.spheres.find(item=>item.id===pathState.selectedSphereId);pathState.selectedPathId=sphere?.paths[0]?.id||pathState.selectedPathId;navigate('path.sphere');return;}
  const pathRoute=event.target.closest('[data-path-id]');
  if(pathRoute){pathState.selectedPathId=pathRoute.dataset.pathId;pathState.selectedSphereId=findPath(pathState.selectedPathId)?.sphere.id||pathState.selectedSphereId;navigate('path.chapter');return;}
  const pathChapter=event.target.closest('[data-path-chapter]');
  if(pathChapter){pathState.selectedChapterId=pathChapter.dataset.pathChapter;const info=findChapter(pathState.selectedChapterId);if(info){pathState.selectedPathId=info.path.id;pathState.selectedSphereId=info.sphere.id;navigate(chapterStatus(info.path,info.chapter.number-1,pathState.progress)==='locked'?'path.lockedReason':'path.lesson');}return;}
  const pathBookmark=event.target.closest('[data-path-bookmark]');
  if(pathBookmark){performPathBookmark(pathBookmark.dataset.pathBookmark);return;}
  const pathComplete=event.target.closest('[data-path-complete]');
  if(pathComplete){performPathCompletion(pathComplete.dataset.pathComplete);return;}
  const eventFilter=event.target.closest('[data-event-filter]');
  if(eventFilter){eventsState.filter=eventFilter.dataset.eventFilter;render('events.list');return;}
  const eventActionControl=event.target.closest('[data-event-action]');
  if(eventActionControl){eventsState.selectedEventId=eventActionControl.dataset.eventId;eventsState.actionState='idle';navigate(eventActionControl.dataset.eventAction==='cancel'?'events.cancellationConfirm':'events.registrationConfirm');return;}
  const eventConfirm=event.target.closest('[data-event-confirm]');
  if(eventConfirm){performEventAction(eventConfirm.dataset.eventConfirm,eventConfirm.dataset.eventId);return;}
  const eventControl=event.target.closest('[data-event-id]');
  if(eventControl){eventsState.selectedEventId=eventControl.dataset.eventId;navigate('events.detail');return;}
  const routeControl = event.target.closest('[data-navigate]');
  if (routeControl) navigate(routeControl.dataset.navigate);
  if (event.target.closest('[data-confirm-demo]')) openConfirmation();
  const planControl = event.target.closest('[data-plan]');
  if (planControl) { selectedPlan=planControl.dataset.plan; render('payment.plans'); }
  if (event.target.closest('[data-payment-next]')) navigate('payment.transfer');
  if (event.target.closest('[data-payment-confirm]')) navigate('payment.confirmation');
  if (event.target.closest('[data-copy-card]')) navigator.clipboard?.writeText(TRANSFER_CARD_DISPLAY.replace(/\s/g,'')).then(() => { announcer.textContent='Номер карты скопирован'; }).catch(() => { announcer.textContent='Скопируй номер вручную'; });
  if (event.target.closest('[data-open-manager]')) {
    const link=managerPaymentLink(selectedPlan,getRuntimeContext().access?.discountPct||0);
    const telegram=window.Telegram?.WebApp;
    if (telegram?.openTelegramLink) telegram.openTelegramLink(link); else location.href=link;
  }
  const questControl=event.target.closest('[data-quest-id]');
  if(questControl)handleQuestToggle(questControl.dataset.questId);
  const newsControl=event.target.closest('[data-news-id]');
  if(newsControl){const url=new URL(location.href);url.searchParams.set('news',newsControl.dataset.newsId);history.replaceState(null,'',url);navigate('news.detail');}
  if(event.target.closest('[data-state-action]')&&homeState.status==='error')reloadHome();
  if(event.target.closest('[data-state-action]')&&navigation.current.startsWith('events.'))reloadEvents();
  if(event.target.closest('[data-state-action]')&&navigation.current.startsWith('path.'))reloadPath();
  if(event.target.closest('[data-state-action]')&&navigation.current.startsWith('widgets.'))reloadWidgets();
});

async function reloadWidgets(){
  const runtime=getRuntimeContext();widgetState={...widgetState,status:'loading'};render(navigation.current);
  try{widgetEditor=new WidgetLayoutEditor(await widgetRepository.load({db:runtime.fbDb,uid:runtime.firebaseUser?.uid}));widgetState={...widgetState,status:'ready',actionState:'idle'};}
  catch(error){widgetState={...widgetState,status:'error',actionState:'failed'};}render(navigation.current);
}

async function saveWidgetLayout(){
  if(widgetState.actionState==='working'||!widgetState.capabilities.writes)return;widgetState.actionState='working';const runtime=getRuntimeContext();
  try{const layout=await widgetRepository.save({db:runtime.fbDb,uid:runtime.firebaseUser?.uid},widgetEditor.draft);widgetEditor.accept(layout);widgetState.actionState='succeeded';announcer.textContent='Расположение виджетов сохранено';navigate('widgets.home',{bypassWidgetGuard:true});}
  catch(error){widgetState.actionState='failed';announcer.textContent='Расположение не подтверждено';render('widgets.edit');}
}

async function reloadPath(){
  const runtime=getRuntimeContext();pathState={...pathState,status:'loading'};render(navigation.current);
  const loaded=await loadPathExperience(pathRepository,{db:runtime.fbDb,uid:runtime.firebaseUser?.uid});pathState={...pathState,...loaded};render(navigation.current);
}
async function performPathCompletion(chapterId){
  if(pathState.actionState==='working')return;pathState.actionState='working';
  const runtime=getRuntimeContext();
  try{const result=await pathRepository.complete({db:runtime.fbDb,uid:runtime.firebaseUser?.uid,chapterId},pathState.progress);pathState={...pathState,...(await loadPathExperience({load:async()=>result.progress,capabilities:pathRepository.capabilities})),selectedChapterId:chapterId,actionState:'succeeded'};announcer.textContent=result.reward?`Глава завершена. +${result.reward} XP`:'Глава уже была завершена';render('path.lesson');}
  catch(error){pathState.actionState='failed';announcer.textContent='Прогресс не подтверждён';render(navigation.current);}
}
async function performPathBookmark(chapterId){
  if(pathState.actionState==='working')return;pathState.actionState='working';
  const runtime=getRuntimeContext();
  try{const result=await pathRepository.toggleBookmark({db:runtime.fbDb,uid:runtime.firebaseUser?.uid,chapterId});pathState={...pathState,...(await loadPathExperience({load:async()=>result.progress,capabilities:pathRepository.capabilities})),selectedChapterId:chapterId,actionState:'succeeded'};announcer.textContent='Закладки обновлены';render(navigation.current);}
  catch(error){pathState.actionState='failed';announcer.textContent='Закладка не подтверждена';render(navigation.current);}
}

async function reloadEvents(){
  const runtime=getRuntimeContext();eventsState={...eventsState,status:'loading',items:[]};render(navigation.current);
  const loaded=await loadEventsExperience(eventRepository,{db:runtime.fbDb,uid:runtime.firebaseUser?.uid});eventsState={...eventsState,...loaded};render(navigation.current);
}
async function performEventAction(action,eventId){
  if(eventsState.actionState==='working')return;
  const runtime=getRuntimeContext(),control=document.querySelector(`[data-event-confirm="${CSS.escape(action)}"]`);if(control)control.disabled=true;
  eventsState.actionState='working';
  try{
    const result=await eventRepository[action]({db:runtime.fbDb,uid:runtime.firebaseUser?.uid,eventId});
    if(!result.confirmed)throw new Error('Unconfirmed event action');
    eventsState.items=eventsState.items.map(event=>event.id===eventId?result.event:event);eventsState.actionState='succeeded';
    announcer.textContent=action==='cancel'?'Участие отменено':'Запись подтверждена';navigate('events.detail');
  }catch(error){eventsState.actionState='failed';announcer.textContent='Изменение не подтверждено';render(navigation.current);}
}

async function reloadHome(){
  const runtime=getRuntimeContext();if(!runtime.fbDb||!runtime.firebaseUser)return;
  homeState={status:'loading',data:null,error:null};render(navigation.current);
  try{homeState={status:'ready',data:await loadHomeDashboard(runtime.fbDb,runtime.firebaseUser.uid,{telegramUser:window.Telegram?.WebApp?.initDataUnsafe?.user||null}),error:null};}
  catch(error){homeState={status:'error',data:null,error};}
  render(navigation.current);
}
async function handleQuestToggle(questId){
  const runtime=getRuntimeContext(),quest=homeState.data?.quests.items.find(item=>item.id===questId);
  if(!runtime.fbDb||!runtime.firebaseUser||!quest)return;
  const controls=[...document.querySelectorAll(`[data-quest-id="${CSS.escape(questId)}"]`)];controls.forEach(button=>button.disabled=true);
  try{const result=await toggleDailyQuest(runtime.fbDb,runtime.firebaseUser.uid,quest);homeState.data.quests.done=result.quests.done;homeState.data.quests.awarded=result.quests.awarded;homeState.data.points=result.points;announcer.textContent=result.reward?`Квест выполнен. Начислено ${result.reward} баллов`:'Статус квеста обновлён';render(navigation.current);}
  catch(error){announcer.textContent='Не удалось обновить квест';controls.forEach(button=>button.disabled=false);}
}
modalRoot.addEventListener('click', event => {
  if (event.target.closest('[data-dialog-cancel]')) closeModal();
  if (event.target.closest('[data-dialog-confirm]')) {
    if(modalState?.kind==='widget-reset'){widgetEditor.reset();closeModal();render('widgets.edit');return;}
    if(modalState?.kind==='widget-discard'){const route=modalState.pendingRoute;widgetEditor.cancel();closeModal();navigate(route,{bypassWidgetGuard:true});return;}
    if(modalState?.kind==='widget-discard-back'){widgetEditor.cancel();closeModal();const previous=navigation.back();if(previous)render(previous);return;}
    announcer.textContent = 'Демонстрация подтверждена. Запись не выполнялась.';
    closeModal();
  }
  if (event.target.classList.contains('modal-overlay') && event.target.dataset.critical !== 'true') closeModal();
});
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && modalState && modalState.dialog.dataset.critical !== 'true') closeModal();
});
window.addEventListener('hashchange', () => {
  const hashRoute = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  if (ROUTES[hashRoute] && hashRoute !== navigation.current) navigate(hashRoute);
});
window.addEventListener('online', () => render(navigation.current));
window.addEventListener('offline', () => render(navigation.current));
window.addEventListener('beforeunload', () => telegramBack.destroy());
accessBanner.addEventListener('click', () => navigate('payment.plans'));
lifecycleRoot.addEventListener('click', event => { if (event.target.closest('[data-auth-retry]')) bootstrap(); });

bootstrap();
