import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { ACTION_STATES, APP_LIFECYCLE_STATES, CONTENT_STATES, DEEP_LINKS, ROOT_ROUTES, ROUTES } from '../versions/v2/routes.js';
import { NavigationStack, createTelegramBackButtonBoundary } from '../versions/v2/navigation.js';
import { ActionController, renderContentState } from '../versions/v2/state-components.js';

test('every V2 route exposes mandatory UI Contract metadata', () => {
  assert.ok(Object.keys(ROUTES).length >= 60);
  for (const [id, route] of Object.entries(ROUTES)) {
    assert.equal(route.id, id);
    for (const key of ['parentTab','accessPolicy','bottomNavVisible','backTarget','analyticsName','loadingState','errorState']) {
      assert.ok(Object.hasOwn(route, key), `${id} missing ${key}`);
    }
  }
});

test('root tabs and new_contact deep link preserve the frozen mapping', () => {
  assert.deepEqual(ROOT_ROUTES, { home:'home', lyova:'lyova.chat', events:'events.list', path:'path.home', widgets:'widgets.home', profile:'profile.cabinet' });
  assert.equal(DEEP_LINKS.new_contact, 'widgets.contactNew');
  assert.equal(ROUTES['widgets.contactNew'].parentTab, 'widgets');
});

test('payment and critical confirmation routes hide bottom navigation', () => {
  for (const route of Object.values(ROUTES).filter(route => route.id.startsWith('payment.'))) assert.equal(route.bottomNavVisible, false);
  for (const route of Object.values(ROUTES).filter(route => route.critical)) assert.equal(route.bottomNavVisible, false);
});

test('system state registries match the frozen contract', () => {
  assert.deepEqual(CONTENT_STATES, ['loading','ready','empty','error','stale','locked','paywalled','disabled']);
  assert.deepEqual(ACTION_STATES, ['idle','confirming','working','succeeded','failed']);
  assert.deepEqual(APP_LIFECYCLE_STATES, ['booting','authenticating','authError','loadingCoreData','ready','offlineReady','fatalError']);
});

test('navigation handles inner back stack, parent roots and repeated tab tap', () => {
  const navigation = new NavigationStack('home');
  navigation.navigate('news.list');
  navigation.navigate('news.detail');
  assert.equal(navigation.back(), 'news.list');
  assert.equal(navigation.back(), 'home');
  navigation.navigate('widgets.home', { currentScroll: 42 });
  assert.equal(navigation.current, 'widgets.home');
  assert.equal(navigation.navigate('widgets.home').repeated, true);
});

test('Telegram BackButton boundary is optional and mirrors visibility', () => {
  const calls = [];
  const fake = { Telegram:{ WebApp:{ BackButton:{ onClick:() => calls.push('on'), offClick:() => calls.push('off'), show:() => calls.push('show'), hide:() => calls.push('hide') } } } };
  const boundary = createTelegramBackButtonBoundary(fake, () => {});
  assert.equal(boundary.sync(true), true);
  boundary.sync(false);
  boundary.destroy();
  assert.deepEqual(calls, ['on','show','hide','off','hide']);
  assert.equal(createTelegramBackButtonBoundary({}, () => {}).sync(true), false);
});

test('shared state renderer escapes content and ActionController deduplicates working taps', async () => {
  assert.match(renderContentState('empty', { title:'<unsafe>' }), /&lt;unsafe&gt;/);
  let executions = 0;
  let release;
  const controller = new ActionController(() => { executions += 1; return new Promise(resolve => { release = resolve; }); });
  const first = controller.run('a');
  const second = controller.run('b');
  assert.equal(executions, 0);
  await Promise.resolve();
  assert.equal(executions, 1);
  release('ok');
  assert.equal(await first, 'ok');
  assert.equal(await second, 'ok');
  assert.equal(controller.state, 'succeeded');
});

test('V2 foundation contains no persistence, Firebase, auth or production activation code', async () => {
  const files = await Promise.all(['index.html','app.js','routes.js','navigation.js','state-components.js'].map(name => readFile(new URL(`../versions/v2/${name}`, import.meta.url), 'utf8')));
  const source = files.join('\n');
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|signInWithCustomToken|from\s+['"][^'"]*firebase|fetch\([^\n]*versions\/active\.json|BotFather/i);
  assert.doesNotMatch(source, /\bfbDb\b|\bcollection\(|\bdoc\(|\baddDoc\(|\bsetDoc\(|\bupdateDoc\(|\bdeleteDoc\(/);
});
