import { ROUTES, ROOT_ROUTES, resolveDeepLink, resolveRoute } from './routes.js';
import { NavigationStack, createTelegramBackButtonBoundary } from './navigation.js';
import { createConfirmationDialog, renderContentState, trapDialogFocus } from './state-components.js';
import { authenticateTelegram } from './auth.js';
import { accessDecision, daysRemaining, ensureCurrentAccess } from './access.js';
import { PAYMENT_PLANS, TRANSFER_CARD_DISPLAY, discountedPlan, formatRub, managerPaymentLink } from './payment.js';
import { getRuntimeContext, resetRuntimeContext, setAccessContext, setAuthenticatedRuntime, setLifecycle } from './runtime-context.js';

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
  const links = rootCards[meta.parentTab] || [];
  return `<section class="foundation-hero"><span class="eyebrow">V2 FOUNDATION</span><h2>${meta.title}</h2><p>Изолированная оболочка готова к подключению экранного пакета. Реальные пользовательские данные и бизнес-действия здесь ещё не подключены.</p></section><section class="route-grid">${links.map(([routeId, label]) => `<button class="route-card" type="button" data-navigate="${routeId}"><strong>${label}</strong><span>${routeId}</span></button>`).join('')}</section><section class="foundation-note"><strong>Безопасный режим</strong><p>V1 остаётся активной. Эта версия не выполняет Firestore-записи и не меняет production.</p></section>`;
}

function innerMarkup(meta) {
  if (meta.id.startsWith('payment.')) return paymentMarkup(meta.id);
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

function navigate(routeId) {
  closeModal();
  const outcome = navigation.navigate(routeId, { currentScroll: outlet.scrollTop });
  render(outcome.routeId, outcome);
}

function goBack() {
  if (modalState) { closeModal(); return; }
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
});
modalRoot.addEventListener('click', event => {
  if (event.target.closest('[data-dialog-cancel]')) closeModal();
  if (event.target.closest('[data-dialog-confirm]')) {
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
