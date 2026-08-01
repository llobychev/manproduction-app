export const EVENT_STATES = Object.freeze([
  'upcoming', 'registered', 'waitlist', 'full', 'online', 'offline', 'cancelled', 'completed', 'archive'
]);

export const EVENT_FILTERS = Object.freeze([
  Object.freeze({ id:'all', label:'Все' }),
  Object.freeze({ id:'upcoming', label:'Ближайшие' }),
  Object.freeze({ id:'online', label:'Онлайн' }),
  Object.freeze({ id:'offline', label:'Оффлайн' }),
  Object.freeze({ id:'mine', label:'Мои записи' }),
  Object.freeze({ id:'archive', label:'Архив' })
]);

const ATTENDANCE = new Set(['registered', 'waitlist']);
const ARCHIVE = new Set(['completed', 'archive', 'cancelled']);

function asDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const result = new Date(value);
  return Number.isNaN(result.getTime()) ? null : result;
}

function asText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function normalizedState(value) {
  return EVENT_STATES.includes(value) ? value : 'upcoming';
}

export function normalizeEvent(raw, id = raw?.id) {
  if (!raw || !id) return null;
  const state = normalizedState(raw.attendanceState || raw.state);
  const format = raw.format === 'online' || state === 'online' ? 'online' : 'offline';
  const startsAt = asDate(raw.startsAt);
  return Object.freeze({
    id:String(id),
    title:asText(raw.title, 'Мероприятие'),
    summary:asText(raw.summary || raw.description),
    startsAt,
    endsAt:asDate(raw.endsAt),
    timezone:asText(raw.timezone, 'Asia/Irkutsk'),
    format,
    location:format === 'online' ? asText(raw.location, 'Онлайн') : asText(raw.location),
    state,
    attendanceState:ATTENDANCE.has(state) ? state : asText(raw.attendanceState, 'available'),
    capacity:Number.isFinite(Number(raw.capacity)) ? Math.max(0, Number(raw.capacity)) : null,
    seatsLeft:Number.isFinite(Number(raw.seatsLeft)) ? Math.max(0, Number(raw.seatsLeft)) : null,
    participants:Array.isArray(raw.participants) ? raw.participants.slice(0, 5).map(person => ({
      id:asText(person?.id), name:asText(person?.name, 'Участник'), avatarUrl:asText(person?.avatarUrl)
    })) : [],
    cancellationDeadline:asDate(raw.cancellationDeadline),
    registrationRequiresConfirmation:Boolean(raw.registrationRequiresConfirmation),
    registrationNote:asText(raw.registrationNote)
  });
}

export function filterEvents(items, filter = 'all', now = new Date()) {
  const current = now.getTime();
  return items.filter(event => {
    if (filter === 'mine') return ATTENDANCE.has(event.attendanceState);
    if (filter === 'online' || filter === 'offline') return event.format === filter && !ARCHIVE.has(event.state);
    if (filter === 'archive') return ARCHIVE.has(event.state) || (event.endsAt?.getTime() ?? event.startsAt?.getTime() ?? Infinity) < current;
    if (filter === 'upcoming') return !ARCHIVE.has(event.state) && (event.startsAt?.getTime() ?? Infinity) >= current;
    return true;
  }).sort((a, b) => (a.startsAt?.getTime() ?? Infinity) - (b.startsAt?.getTime() ?? Infinity));
}

export function createEventRepository(adapter = null) {
  const readsReady = typeof adapter?.list === 'function';
  const writesReady = readsReady && typeof adapter?.register === 'function' && typeof adapter?.cancel === 'function';
  return Object.freeze({
    capabilities:Object.freeze({ reads:readsReady, writes:writesReady }),
    async list(context) {
      if (!readsReady) return [];
      const values = await adapter.list(context);
      return (Array.isArray(values) ? values : []).map(value => normalizeEvent(value, value.id)).filter(Boolean);
    },
    async register(context) {
      if (!writesReady) throw Object.assign(new Error('Event registration is disabled until schema and Security Rules are approved'), { code:'event-writes-disabled' });
      const result = await adapter.register(context);
      if (!result?.confirmed || !result.event) throw Object.assign(new Error('Registration was not confirmed by the authoritative adapter'), { code:'event-write-unconfirmed' });
      return Object.freeze({ confirmed:true, event:normalizeEvent(result.event, context.eventId) });
    },
    async cancel(context) {
      if (!writesReady) throw Object.assign(new Error('Event cancellation is disabled until schema and Security Rules are approved'), { code:'event-writes-disabled' });
      const result = await adapter.cancel(context);
      if (!result?.confirmed || !result.event) throw Object.assign(new Error('Cancellation was not confirmed by the authoritative adapter'), { code:'event-write-unconfirmed' });
      return Object.freeze({ confirmed:true, event:normalizeEvent(result.event, context.eventId) });
    }
  });
}

export async function loadEventsExperience(repository, context = {}) {
  if (!repository) throw new Error('Event repository is required');
  try {
    const items = await repository.list(context);
    return Object.freeze({
      status:items.length ? 'ready' : 'empty',
      items,
      capabilities:repository.capabilities,
      message:repository.capabilities.reads
        ? 'Актуальных клубных мероприятий пока нет.'
        : 'Каталог подключится после утверждения физической схемы и Firestore Security Rules.'
    });
  } catch (error) {
    return Object.freeze({ status:'error', items:[], capabilities:repository.capabilities, error, message:'Не удалось получить актуальный каталог.' });
  }
}
