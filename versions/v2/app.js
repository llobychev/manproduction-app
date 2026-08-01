import { ROUTES, ROOT_ROUTES, resolveDeepLink, resolveRoute } from './routes.js';
import { NavigationStack, createTelegramBackButtonBoundary } from './navigation.js';
import { createConfirmationDialog, renderContentState, trapDialogFocus } from './state-components.js';

const outlet = document.querySelector('#route-outlet');
const bottomNav = document.querySelector('#bottom-nav');
const headerBack = document.querySelector('#header-back');
const headerTitle = document.querySelector('#header-title');
const headerBrand = document.querySelector('#header-brand');
const headerSubtitle = document.querySelector('#header-subtitle');
const modalRoot = document.querySelector('#modal-root');
const announcer = document.querySelector('#status-announcer');
const navigation = new NavigationStack(initialRoute());
let modalState = null;

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
  const specialState = meta.id === 'path.lockedReason' ? 'locked' : meta.id === 'payment.error' ? 'error' : meta.id === 'lyova.history' ? 'empty' : 'disabled';
  return `<section class="inner-intro"><span class="eyebrow">${meta.id}</span><h2>${meta.title}</h2><p>Route зарегистрирован, связан с вкладкой «${meta.parentTab}» и готов к экранной реализации следующего пакета.</p></section>${renderContentState(specialState, specialState === 'disabled' ? { title: 'Экран подключится следующим пакетом', message: 'Foundation не изображает работу ещё не подключённой функции.' } : {})}${meta.critical ? '<button class="primary-button destructive-demo" type="button" data-confirm-demo>Проверить безопасное подтверждение</button>' : ''}`;
}

function render(routeId, options = {}) {
  const meta = resolveRoute(routeId);
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

render(navigation.current);
