# MenClub Main App V2 — UI Contract V2

Версия: 2.0.0

Дата заморозки: 2026-08-01

Статус: frozen for implementation

Источник визуального направления: `prototype-v2-approved.html`

Источник аудита: `docs/reviews/2026-08-01-main-app-v2-clickable-prototype-audit.md`

## 1. Назначение контракта

Этот документ фиксирует обязательное поведение Main App V2 до начала production-реализации.

Контракт определяет:

- shell и навигацию;
- route registry;
- parent-tab mapping;
- системные и экранные states;
- data dependencies;
- demo/paywall/access rules;
- confirmation rules;
- public-profile visibility;
- обязательные действия каждого экрана;
- acceptance criteria;
- границы отложенных функций.

Визуальный прототип задаёт направление композиции. При конфликте между декоративной симуляцией прототипа и этим контрактом приоритет имеет этот контракт.

## 2. Неприкосновенные инварианты

1. V1 Stable и V2 Development существуют параллельно до контролируемой активации.
2. Production `index.html` и Telegram Mini App URL не меняются до отдельного activation checkpoint.
3. V1 остаётся fallback.
4. Firebase custom-token authentication сохраняется.
5. `fbDb` создаётся только после успешного `signInWithCustomToken`.
6. Firestore является единственным постоянным хранилищем.
7. localStorage, sessionStorage и IndexedDB не используются для пользовательских данных или layout persistence.
8. Существующие collections, document IDs и поля не переименовываются и не удаляются в рамках UI-миграции.
9. Новые данные добавляются backward-compatible способом.
10. Demo, countdown, paywall, subscription и payment-by-transfer flow сохраняются.
11. Points, `awardPoints()` и anti-duplicate rewards сохраняются.
12. `new_contact` deep link сохраняется.
13. Advanced Path / Life Map не заменяется упрощённым экраном прототипа.
14. Logout и destructive data reset остаются разными действиями.
15. Любая V2-активация проходит проверку `V1 -> V2 -> V1`.
16. GitHub Actions не используются.
17. В активной модели отображаются пять сфер: `body`, `money`, `people`, `mind`, `meaning`.
18. Legacy data не удаляется только потому, что больше не показывается в V2.

## 3. Глобальный shell

### 3.1. Bottom navigation

Постоянный порядок:

1. Главная
2. Лёва
3. Мероприятия
4. Путь
5. Виджеты
6. Профиль

Правила:

- Лёва визуально выделен увеличенной круглой кнопкой.
- Активный root tab всегда подсвечен.
- Повторный tap по активному tab прокручивает его root screen наверх.
- Переход на другой tab и возврат восстанавливают последний scroll position в рамках текущей сессии.
- Inner route сохраняет подсветку своего parent tab.
- Bottom navigation скрыта на payment routes, destructive confirmations и full-screen critical states.
- Dev version switch не является частью production shell.

### 3.2. Header

- Root screens используют sticky header.
- Home: brand/logo + notifications.
- Inner routes: back action + title + context actions.
- Back action сначала закрывает modal/sheet, затем возвращает предыдущий inner route, затем root parent tab.
- Telegram BackButton повторяет это поведение.

### 3.3. Safe areas и keyboard

- Учитываются `safe-area-inset-top` и `safe-area-inset-bottom`.
- Bottom nav и chat composer не перекрывают контент.
- При открытии клавиатуры активное поле остаётся видимым.
- После закрытия клавиатуры layout возвращается без скачка route state.

## 4. Route registry

Route IDs внутренние. URL/hash implementation может отличаться, но route identity и metadata обязательны.

Каждый route обязан иметь:

- `id`;
- `parentTab`;
- `accessPolicy`;
- `bottomNavVisible`;
- `backTarget`;
- `analyticsName`;
- `loadingState`;
- `errorState`.

### 4.1. Root routes

| Route ID | Экран | Parent tab | Bottom nav |
|---|---|---|---|
| `home` | Главная | home | visible |
| `lyova.chat` | Лёва / Чат | lyova | visible |
| `events.list` | Мероприятия | events | visible |
| `path.home` | Путь | path | visible |
| `widgets.home` | Виджеты | widgets | visible |
| `profile.cabinet` | Мой кабинет | profile | visible |
| `profile.publicPreview` | Публичный профиль: preview | profile | visible |

### 4.2. Home inner routes

- `notifications.list`
- `quest.detail`
- `schedule.today`
- `news.list`
- `news.detail`

### 4.3. Lyova routes

- `lyova.chat`
- `lyova.recommendations`
- `lyova.history`
- `lyova.actions`
- `lyova.settings`
- `lyova.thread`

### 4.4. Events routes

- `events.list`
- `events.mine`
- `events.detail`
- `events.registrationConfirm`
- `events.cancellationConfirm`

### 4.5. Path routes

- `path.home`
- `path.sphere`
- `path.chapter`
- `path.lesson`
- `path.history`
- `path.bookmarks`
- `path.lockedReason`

Lessons являются частью Path и не возвращаются как отдельный bottom tab.

### 4.6. Widgets routes

- `widgets.home`
- `widgets.edit`
- `widgets.gallery`
- `widgets.widget`
- `widgets.contacts`
- `widgets.contactNew`
- `widgets.finance`
- `widgets.habits`
- `widgets.health`
- `widgets.events`
- `widgets.notes`
- `widgets.media`
- `widgets.quickActions`
- `widgets.mind`

Обязательный deep link mapping:

`new_contact -> widgets.contactNew`

При переходе parent tab `widgets` остаётся активным.

### 4.7. Profile routes

- `profile.cabinet`
- `profile.personalData`
- `profile.settings`
- `profile.notifications`
- `profile.privacy`
- `profile.security`
- `profile.language`
- `profile.subscription`
- `profile.payments`
- `profile.clubAccess`
- `profile.achievements`
- `profile.invite`
- `profile.giftCards`
- `profile.help`
- `profile.about`
- `profile.version`
- `profile.logoutConfirm`
- `profile.dataReset`
- `profile.dataResetConfirm`
- `profile.publicPreview`
- `profile.publicEdit`

### 4.8. Payment routes

- `payment.plans`
- `payment.transfer`
- `payment.confirmation`
- `payment.pending`
- `payment.success`
- `payment.error`

Bottom navigation скрыта на всех payment routes.

## 5. Системная модель состояний

### 5.1. App lifecycle

Обязательные states:

- `booting`
- `authenticating`
- `authError`
- `loadingCoreData`
- `ready`
- `offlineReady`
- `fatalError`

Правила:

- до `ready` пользовательские данные не показываются как реальные;
- auth failure предоставляет retry;
- fallback на V1 выполняется только launcher-уровнем, а не маскирует runtime ошибки V2;
- offline state не изображает успешное сохранение.

### 5.2. Content state

Каждый data screen поддерживает:

- `loading`
- `ready`
- `empty`
- `error`
- `stale`
- `locked`
- `paywalled`
- `disabled`

### 5.3. Action state

Каждое write action поддерживает:

- `idle`
- `confirming`, когда требуется;
- `working`
- `succeeded`
- `failed`

Правила:

- повторный tap во время `working` не создаёт вторую операцию;
- success показывается только после подтверждённого результата;
- failed action сохраняет введённые данные, если это безопасно;
- destructive success обновляет экран, а не ограничивается toast.

### 5.4. Modal/sheet state

- Modal имеет title, body, primary action, secondary action и close policy.
- Destructive primary action визуально отличается.
- Dialog имеет focus trap и возвращает фокус инициатору.
- Overlay tap не закрывает critical confirmation.
- Escape работает только в desktop preview и не заменяет mobile back contract.

## 6. Access, demo и paywall contract

### 6.1. Access classes

- `unauthenticated`
- `demoActive`
- `fullPaid`
- `fullPerk`
- `demoExpired`
- `featureLocked`

### 6.2. Current access sources

Приоритет проверки:

1. Активный `users/{uid}.subscriptionUntil`.
2. Активный `roulette_active_perks/{uid}.freeSubscriptionUntil`.
3. Активный `roulette_active_perks/{uid}.demoAccessUntil`.
4. Истёкший demo.
5. Новый пользователь без perks получает действующий V1 default demo period: 21 день, пока бизнес-правило не изменено отдельным решением.

### 6.3. Demo active

- Показывается countdown banner.
- Banner открывает access details/payment route.
- Разрешённый V1 demo scope сохраняется до отдельной product acceptance.
- UI не обещает постоянный доступ.

### 6.4. Full access

- Countdown скрыт.
- Profile показывает plan, expiry и management action.
- Бесплатная подписка из perks визуально отличается от paid plan только там, где это важно для управления оплатой.

### 6.5. Demo expired

Premium content блокируется full-screen access state.

Всегда остаются доступны:

- `payment.*`;
- `profile.cabinet` в ограниченном режиме;
- `profile.subscription`;
- `profile.help`;
- `profile.about`;
- `profile.logoutConfirm`.

Logout не удаляет данные.

### 6.6. Feature locked

Feature lock может зависеть от:

- prerequisite;
- последовательного открытия;
- subscription;
- будущего модуля;
- отсутствующего разрешения.

Lock reason всегда объясняется. Locked control не запускает обычное action.

## 7. Confirmation matrix

| Action | Confirmation | Дополнительное правило |
|---|---|---|
| Записаться на бесплатное событие | не всегда | confirm только при обязательствах/ограничениях |
| Отменить запись на событие | обязательно | показать последствия и дедлайн |
| Начать доступный урок | нет | idempotent start |
| Завершить задание/урок | нет или lightweight | anti-duplicate reward |
| Добавить/убрать закладку | нет | reversible |
| Скрыть виджет | без hard confirm | undo toast |
| Удалить пользовательский виджет | обязательно, если теряются настройки | сохранить данные инструмента |
| Сбросить widget layout | обязательно | preview default layout |
| Сменить версию | confirm только при unsaved changes | production switch отдельно |
| Logout | обязательно | данные сохраняются |
| Reset/delete user data | двойное подтверждение | отдельный route; logout не связан |
| Выбрать платный план | confirmation screen | план, срок, сумма, способ оплаты |
| Lyova side-effect action | preview + confirmation | никакой записи до подтверждения |
| Изменить public visibility | explicit save | preview результата |

## 8. Data dependency contract

UI использует adapters. Screen components не обращаются к Firestore напрямую.

### 8.1. Existing authoritative dependencies

| Dependency | Текущий источник | Использование V2 |
|---|---|---|
| Auth identity | Telegram initData -> server auth -> Firebase custom token | весь app lifecycle |
| User account | `users/{uid}` | имя, username, subscription, points, level-related display, profile data |
| User feature data | `user_data/{uid}` | journal, positivity, tasks, finance, personal data, habits, challenge progress, quest completion, savings и существующие V1-поля |
| Cycle calendar | `cycle_data/{uid}` | schedule/cycle-related widgets и экраны |
| Demo/perks | `roulette_active_perks/{uid}` | demo, free subscription, discounts |
| News | `news/{newsId}` | Home preview, news list/detail |
| Personal schedule mirror | `events/{uid_eventId}` | существующий V1 schedule sync; не переиспользовать молча как каталог клубных событий |
| Analytics | `analytics/main/events` | route/action/access events |
| Existing Path state | действующая V1 Path/Life Map логика и её storage | Path, lessons, progress, rewards |
| Points | действующая `awardPoints()` логика | quests, habits, challenges, lessons |

### 8.2. Additive dependencies requiring separate schema review

До production write integration должны получить отдельный data/security contract:

- club event catalog;
- event registrations and attendance;
- widget layout persistence;
- Lyova threads/history/actions;
- public profile and field-level visibility;
- selected public achievements/moments;
- media widget data.

Правила:

- не выбирать collection names случайно внутри UI-задачи;
- новые collections получают Firestore Rules до production activation;
- V1 не обязана понимать новые V2-only документы;
- V2 обязана продолжать читать существующие V1 данные.

### 8.3. Widget layout logical model

До утверждения физической Firestore-схемы UI опирается на модель:

```text
layoutVersion
items[]:
  widgetId
  order
  size
  hidden
  settingsVersion
updatedAt
```

Required behavior:

- reorder;
- resize только среди разрешённых размеров;
- hide;
- restore;
- reset to default;
- optimistic UI с rollback при save error;
- никакого localStorage fallback.

## 9. Public profile visibility contract

Начальная V2-модель консервативная.

### 9.1. Audience

- Public Profile V2 initial release является member-to-member surface.
- Неавторизованный web-public profile не включается.
- Share control до отдельной privacy acceptance создаёт только member-safe link или показывает disabled state.

### 9.2. Visibility defaults

| Поле | Default | Может открыть пользователь |
|---|---|---|
| Display name | member-visible | да |
| Avatar | member-visible | да |
| Username | hidden | да, отдельно |
| City | hidden | да |
| Level/title | member-visible | да |
| Total points | hidden | да |
| Streak | hidden | да |
| Friends count | hidden | да |
| Events count | hidden | да |
| About | hidden до заполнения и публикации | да |
| Sphere names | visible | да |
| Exact sphere percentages | hidden | да, per field или all |
| Achievements | selected only | да |
| Moments/activity | selected only | да |
| Friends list | hidden | только отдельное решение |
| Social links | hidden per link | да, per link |
| Email | never public | нет |
| Phone | never public | нет |
| Subscription/payment data | never public | нет |
| Privacy/security settings | never public | нет |
| Personal journal/finance/health details | never public | нет |

### 9.3. Own profile controls

Обязательные controls:

- `Редактировать`;
- `Предпросмотр`;
- `Поделиться`, disabled до доступного member-safe route;
- visibility summary;
- save status.

### 9.4. Future module

`Образ и примерка` в initial V2:

- визуально допустим как future card;
- status `Скоро`;
- не предлагает фиктивную рабочую примерку;
- не пишет данные.

## 10. Screen contracts

## 10.1. Главная

Required blocks:

- greeting;
- clearly labeled overall Path progress;
- compact points, level, streak;
- continue Path;
- daily quest;
- nearest event;
- Lyova recommendation;
- today schedule;
- club news.

Rules:

- Home и Path используют один current continuation source;
- проценты имеют подписи;
- daily quest action изменяет progress state;
- nearest event primary action не конфликтует с card navigation;
- news items открываются отдельно;
- loading/empty/error доступны для schedule, event и news;
- notification badge отражает real state или не показывается.

## 10.2. Лёва

Required tabs:

- Чат;
- Рекомендации;
- История;
- Действия.

Required behavior:

- tabs реально переключают содержимое;
- text composer добавляет user message;
- typing/loading state;
- error/retry state;
- voice control показан disabled `Скоро`, пока runtime не готов;
- recommendations ведут в реальные app routes;
- history имеет empty state;
- side-effect action проходит preview/confirm;
- никакого заявления о сохранении, если write не подтверждён.

Current release boundary:

- AI/runtime architecture может оставаться simulated;
- интерфейс не должен изображать фактическое выполнение несделанной операции.

## 10.3. Мероприятия

Required:

- nearest event hero;
- filters;
- event list;
- attendance state;
- participants preview;
- `Мои записи`;
- event detail;
- cancellation flow.

Event states:

- upcoming available;
- registered;
- waitlist;
- full;
- online;
- offline;
- cancelled;
- completed;
- archive.

Rules:

- фильтры реально меняют выборку;
- empty result объясняется;
- register/cancel action обновляет card и detail;
- cancel требует confirmation;
- stale sample dates не используются в production fixture;
- `events/{uid_eventId}` personal schedule sync не считается автоматически event catalog schema.

## 10.4. Путь

Required:

- пять сфер;
- total progress;
- XP и level;
- current chapter;
- continue action;
- current/upcoming lessons;
- history;
- bookmarks;
- Lyova recommendation;
- sequential unlock;
- advanced Path/Life Map preservation.

Lesson states:

- completed -> review/repeat;
- available -> start/continue;
- inProgress -> continue;
- locked -> reason/prerequisite/paywall;
- failed load -> retry.

Rules:

- Home continuation и Path continuation совпадают;
- progress вычисляется, а не хранится независимыми display constants;
- anti-duplicate XP обязателен;
- locked lesson не запускается;
- active sphere set содержит пять сфер.

## 10.5. Виджеты

Initial widgets:

- Разум;
- Контакты;
- Финансы;
- Привычки;
- Здоровье;
- Мероприятия;
- Заметки;
- Медиа;
- Быстрые действия.

Edit mode:

- drag handles видимы только в edit mode;
- reorder;
- resize;
- hide;
- restore from gallery;
- save;
- cancel;
- reset default;
- unsaved changes warning.

Rules:

- internal button не должен одновременно открывать card route;
- quick actions имеют реальные action routes или disabled state;
- widget data имеет loading/empty/error;
- layout сохраняется только в Firestore после schema/security approval;
- `new_contact` открывает Contacts new-contact flow.

## 10.6. Мой кабинет

Required:

- identity;
- level/points summary;
- subscription/tariff;
- personal data;
- settings;
- notifications;
- privacy;
- security;
- language;
- achievements;
- payment history;
- club access;
- invite friend;
- gift cards;
- help;
- app information;
- version selector;
- logout;
- separate data reset.

Rules:

- placeholder email/phone не используются;
- support/about controls имеют routes;
- logout confirmation явно говорит, что данные сохраняются;
- data reset находится глубже и требует двойного confirmation;
- plan state показывает source, expiry и доступные actions.

## 10.7. Публичный профиль

Required:

- own preview;
- edit control;
- share control/state;
- visibility summary;
- identity header;
- permitted stats;
- about;
- five spheres;
- selected achievements;
- selected moments;
- selected social links;
- friends/players section только при разрешённой модели.

Rules:

- применяются defaults из раздела 9;
- private field заменяется hidden state, а не пустой ошибкой;
- own preview явно сообщает `Так профиль видят участники`;
- external public route не включается в initial V2.

## 11. Analytics contract

Используется существующий analytics path, пока отдельная analytics migration не утверждена.

Минимальные events:

- `v2_route_view`;
- `v2_tab_switch`;
- `v2_action_start`;
- `v2_action_success`;
- `v2_action_error`;
- `v2_access_state`;
- `v2_paywall_view`;
- `v2_payment_plan_select`;
- `v2_event_register`;
- `v2_event_cancel`;
- `v2_lesson_open`;
- `v2_lesson_locked_view`;
- `v2_widget_layout_save`;
- `v2_public_profile_save`;
- `v2_version_switch`.

Запрещено отправлять:

- chat text;
- journal text;
- finance details;
- phone/email;
- private profile fields;
- raw auth/initData.

## 12. Accessibility contract

- Primary text не меньше 14px, secondary text не меньше 11px, кроме компактных служебных labels.
- Touch target минимум 44x44px.
- Все icon-only controls имеют accessible label.
- Dialog имеет role/label/focus trap.
- Active/disabled/locked state определяется не только цветом.
- Контраст проверяется для gold, muted, red и purple surfaces.
- Dynamic status сообщается assistive technology.
- Reduced motion поддерживается.

## 13. Prototype acceptance scenarios

Contract-driven prototype или production slice должен пройти минимум следующие сценарии:

1. Boot -> auth success -> ready.
2. Auth error -> retry -> ready.
3. New user -> 21-day demo grant -> countdown visible.
4. Demo active -> premium route available в текущем разрешённом scope.
5. Demo expired -> blocked content, payment/help/logout доступны.
6. Paid subscription -> no countdown.
7. Home continue -> тот же current chapter на Path.
8. Daily quest -> working -> progress changed -> duplicate reward blocked.
9. Event filter -> list changes -> empty result state.
10. Event register -> registered state.
11. Event cancel -> confirm -> cancelled state.
12. Locked lesson -> reason shown, start unavailable.
13. Completed lesson -> review/repeat.
14. Bookmark -> state toggles.
15. Lyova text -> bubble -> typing -> simulated response.
16. Lyova side-effect -> preview -> confirm.
17. Widget edit -> reorder -> resize -> hide -> restore -> save.
18. Widget save failure -> rollback/error.
19. `new_contact` -> Widgets/Contacts/New Contact.
20. Public profile initial defaults hide sensitive fields.
21. Public profile edit -> preview -> save.
22. Logout -> confirm -> signed out, data retained.
23. Data reset -> separate double confirmation.
24. Payment route hides bottom nav.
25. Telegram BackButton closes modal/inner route correctly.
26. Active tab repeated tap scrolls root to top.
27. V1 remains functional after V2 read/write operations.
28. Controlled `V1 -> V2 -> V1` rollback succeeds.

## 14. Implementation packages

Production implementation выполняется в порядке:

1. shell, route registry, back stack, shared states;
2. auth/access/demo/paywall/payment shells;
3. Home;
4. Events;
5. Path + Lessons;
6. Widgets;
7. Lyova;
8. Cabinet;
9. Public Profile;
10. shared loading/empty/error/offline/confirmation components;
11. Firestore adapters;
12. analytics and accessibility;
13. V1/V2 compatibility tests;
14. controlled activation and rollback.

Каждый пакет:

- изолирован от production V1;
- имеет acceptance checklist;
- не меняет schema без отдельного review;
- не активируется через BotFather до общего checkpoint.

## 15. Отложено и не должно быть реализовано скрыто

- real Lyova AI/runtime;
- voice processing;
- external public web profiles;
- social graph mechanics;
- real `Образ и примерка`;
- final Lyova navigation art;
- club event backend schema;
- widget layout physical schema;
- new Firestore rules for V2-only collections;
- broad data migration.

Любой из этих пунктов требует отдельного решения и не добавляется как побочный эффект UI-переноса.

## 16. Definition of Done для UI Contract stage

Этап считается закрытым, когда:

- аудит сохранён в репозитории;
- единый correction list сохранён;
- этот contract сохранён и принят как implementation authority;
- production code не изменён;
- V1 active/fallback не изменены;
- следующий этап установлен как `shell + route registry + shared states`;
- checkpoint сохранён в `manclub-knowledge`.
