import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { EVENT_FILTERS, EVENT_STATES, createEventRepository, filterEvents, loadEventsExperience, normalizeEvent } from '../versions/v2/events.js';

const fixtures = [
  normalizeEvent({ id:'online', title:'Онлайн-встреча', startsAt:'2030-08-02T12:00:00Z', format:'online', attendanceState:'registered' }),
  normalizeEvent({ id:'offline', title:'Встреча в клубе', startsAt:'2030-08-03T12:00:00Z', format:'offline', attendanceState:'available' }),
  normalizeEvent({ id:'past', title:'Архив', startsAt:'2029-01-01T12:00:00Z', endsAt:'2029-01-01T13:00:00Z', state:'completed' })
];

test('event vocabulary and filters cover the frozen UI Contract', () => {
  assert.deepEqual(EVENT_STATES, ['upcoming','registered','waitlist','full','online','offline','cancelled','completed','archive']);
  assert.deepEqual(EVENT_FILTERS.map(item => item.id), ['all','upcoming','online','offline','mine','archive']);
  assert.deepEqual(filterEvents(fixtures, 'online', new Date('2030-08-01')).map(item => item.id), ['online']);
  assert.deepEqual(filterEvents(fixtures, 'offline', new Date('2030-08-01')).map(item => item.id), ['offline']);
  assert.deepEqual(filterEvents(fixtures, 'mine', new Date('2030-08-01')).map(item => item.id), ['online']);
  assert.deepEqual(filterEvents(fixtures, 'archive', new Date('2030-08-01')).map(item => item.id), ['past']);
});

test('event normalization keeps authoritative attendance and participant preview', () => {
  const event = normalizeEvent({ id:'42', title:'Мужской круг', startsAt:'2030-08-02T12:00:00Z', attendanceState:'waitlist', participants:[{id:'1',name:'Иван'},{id:'2'}] });
  assert.equal(event.attendanceState, 'waitlist');
  assert.equal(event.participants.length, 2);
  assert.equal(event.participants[1].name, 'Участник');
  assert.ok(event.startsAt instanceof Date);
});

test('default repository is fail-closed and never simulates event success', async () => {
  const repository = createEventRepository();
  const model = await loadEventsExperience(repository, { uid:'42' });
  assert.equal(model.status, 'empty');
  assert.equal(model.capabilities.reads, false);
  assert.equal(model.capabilities.writes, false);
  await assert.rejects(repository.register({ uid:'42', eventId:'e1' }), error => error.code === 'event-writes-disabled');
  await assert.rejects(repository.cancel({ uid:'42', eventId:'e1' }), error => error.code === 'event-writes-disabled');
});

test('authoritative adapter result is required before attendance changes', async () => {
  const unconfirmed = createEventRepository({ list:async()=>fixtures, register:async()=>({ confirmed:false }), cancel:async()=>({ confirmed:false }) });
  await assert.rejects(unconfirmed.register({ uid:'42', eventId:'online' }), error => error.code === 'event-write-unconfirmed');
  const confirmed = createEventRepository({
    list:async()=>fixtures,
    register:async()=>({ confirmed:true, event:{ ...fixtures[1], attendanceState:'registered', state:'registered' } }),
    cancel:async()=>({ confirmed:true, event:{ ...fixtures[0], attendanceState:'available', state:'upcoming' } })
  });
  assert.equal((await confirmed.register({ uid:'42', eventId:'offline' })).event.attendanceState, 'registered');
  assert.equal((await confirmed.cancel({ uid:'42', eventId:'online' })).event.attendanceState, 'available');
});

test('production event module has no physical schema, local persistence or dated fixture', async () => {
  const source = await readFile(new URL('../versions/v2/events.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\.collection\(|localStorage|sessionStorage|indexedDB/);
  assert.doesNotMatch(source, /20(?:2[0-9]|3[0-9])-[01][0-9]-[0-3][0-9]T/);
  const app = await readFile(new URL('../versions/v2/app.js', import.meta.url), 'utf8');
  assert.match(app, /events\.registrationConfirm/);
  assert.match(app, /events\.cancellationConfirm/);
  assert.match(app, /actionState==='working'/);
});
