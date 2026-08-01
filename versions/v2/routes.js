export const CONTENT_STATES = Object.freeze([
  'loading', 'ready', 'empty', 'error', 'stale', 'locked', 'paywalled', 'disabled'
]);

export const ACTION_STATES = Object.freeze([
  'idle', 'confirming', 'working', 'succeeded', 'failed'
]);

export const APP_LIFECYCLE_STATES = Object.freeze([
  'booting', 'authenticating', 'authError', 'loadingCoreData', 'ready', 'offlineReady', 'fatalError'
]);

export const ROOT_ROUTES = Object.freeze({
  home: 'home',
  lyova: 'lyova.chat',
  events: 'events.list',
  path: 'path.home',
  widgets: 'widgets.home',
  profile: 'profile.cabinet'
});

const route = (id, parentTab, title, options = {}) => Object.freeze({
  id,
  parentTab,
  title,
  accessPolicy: options.accessPolicy || 'authenticated',
  bottomNavVisible: options.bottomNavVisible !== false,
  backTarget: options.backTarget ?? ROOT_ROUTES[parentTab] ?? null,
  analyticsName: options.analyticsName || `v2_route_${id.replaceAll('.', '_')}`,
  loadingState: 'loading',
  errorState: 'error',
  critical: Boolean(options.critical)
});

const definitions = [
  route('home', 'home', 'Главная', { backTarget: null }),
  route('notifications.list', 'home', 'Уведомления'),
  route('quest.detail', 'home', 'Задание дня'),
  route('schedule.today', 'home', 'Расписание'),
  route('news.list', 'home', 'Новости клуба'),
  route('news.detail', 'home', 'Новость', { backTarget: 'news.list' }),

  route('lyova.chat', 'lyova', 'Лёва', { backTarget: null }),
  route('lyova.recommendations', 'lyova', 'Рекомендации'),
  route('lyova.history', 'lyova', 'История'),
  route('lyova.actions', 'lyova', 'Действия'),
  route('lyova.settings', 'lyova', 'Настройки Лёвы'),
  route('lyova.thread', 'lyova', 'Диалог'),

  route('events.list', 'events', 'Мероприятия', { backTarget: null }),
  route('events.mine', 'events', 'Мои записи'),
  route('events.detail', 'events', 'Мероприятие'),
  route('events.registrationConfirm', 'events', 'Подтверждение записи', { bottomNavVisible: false, critical: true }),
  route('events.cancellationConfirm', 'events', 'Отмена записи', { bottomNavVisible: false, critical: true }),

  route('path.home', 'path', 'Путь', { backTarget: null }),
  route('path.sphere', 'path', 'Сфера'),
  route('path.chapter', 'path', 'Глава'),
  route('path.lesson', 'path', 'Урок'),
  route('path.history', 'path', 'История Пути'),
  route('path.bookmarks', 'path', 'Закладки'),
  route('path.lockedReason', 'path', 'Почему закрыто'),

  route('widgets.home', 'widgets', 'Виджеты', { backTarget: null }),
  route('widgets.edit', 'widgets', 'Настройка виджетов'),
  route('widgets.gallery', 'widgets', 'Галерея виджетов'),
  route('widgets.widget', 'widgets', 'Виджет'),
  route('widgets.contacts', 'widgets', 'Контакты'),
  route('widgets.contactNew', 'widgets', 'Новый контакт'),
  route('widgets.finance', 'widgets', 'Финансы'),
  route('widgets.habits', 'widgets', 'Привычки'),
  route('widgets.health', 'widgets', 'Здоровье'),
  route('widgets.events', 'widgets', 'Мероприятия'),
  route('widgets.notes', 'widgets', 'Заметки'),
  route('widgets.media', 'widgets', 'Медиа'),
  route('widgets.quickActions', 'widgets', 'Быстрые действия'),
  route('widgets.mind', 'widgets', 'Разум'),

  route('profile.cabinet', 'profile', 'Мой кабинет', { backTarget: null }),
  route('profile.personalData', 'profile', 'Личные данные'),
  route('profile.settings', 'profile', 'Настройки'),
  route('profile.notifications', 'profile', 'Уведомления'),
  route('profile.privacy', 'profile', 'Приватность'),
  route('profile.security', 'profile', 'Безопасность'),
  route('profile.language', 'profile', 'Язык'),
  route('profile.subscription', 'profile', 'Подписка'),
  route('profile.payments', 'profile', 'История платежей'),
  route('profile.clubAccess', 'profile', 'Клубные доступы'),
  route('profile.achievements', 'profile', 'Достижения'),
  route('profile.invite', 'profile', 'Пригласить друга'),
  route('profile.giftCards', 'profile', 'Подарочные карты'),
  route('profile.help', 'profile', 'Помощь'),
  route('profile.about', 'profile', 'О приложении'),
  route('profile.version', 'profile', 'Версия приложения'),
  route('profile.logoutConfirm', 'profile', 'Выход', { bottomNavVisible: false, critical: true }),
  route('profile.dataReset', 'profile', 'Сброс данных', { bottomNavVisible: false, critical: true }),
  route('profile.dataResetConfirm', 'profile', 'Подтверждение сброса', { bottomNavVisible: false, critical: true, backTarget: 'profile.dataReset' }),
  route('profile.publicPreview', 'profile', 'Публичный профиль'),
  route('profile.publicEdit', 'profile', 'Редактировать профиль'),

  route('payment.plans', 'profile', 'Выбор тарифа', { bottomNavVisible: false, accessPolicy: 'public' }),
  route('payment.transfer', 'profile', 'Оплата переводом', { bottomNavVisible: false, accessPolicy: 'public' }),
  route('payment.confirmation', 'profile', 'Подтверждение оплаты', { bottomNavVisible: false, accessPolicy: 'public', critical: true }),
  route('payment.pending', 'profile', 'Платёж проверяется', { bottomNavVisible: false, accessPolicy: 'public' }),
  route('payment.success', 'profile', 'Оплата подтверждена', { bottomNavVisible: false, accessPolicy: 'public' }),
  route('payment.error', 'profile', 'Ошибка оплаты', { bottomNavVisible: false, accessPolicy: 'public' })
];

export const ROUTES = Object.freeze(Object.fromEntries(definitions.map(item => [item.id, item])));

export const DEEP_LINKS = Object.freeze({
  new_contact: 'widgets.contactNew'
});

export function resolveRoute(routeId) {
  return ROUTES[routeId] || ROUTES.home;
}

export function resolveDeepLink(value) {
  return DEEP_LINKS[value] || null;
}

export function isRootRoute(routeId) {
  return Object.values(ROOT_ROUTES).includes(routeId);
}
