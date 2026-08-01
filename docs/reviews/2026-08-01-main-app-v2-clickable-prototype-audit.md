# MenClub Main App V2 — полный аудит кликабельного прототипа

Дата: 2026-08-01

Статус: аудит завершён; визуальное направление подтверждено; функциональная заморозка прототипа требует обязательных правок из этого документа.

## Проверенная база

- `main`: `86a7df82203c1740e7c1dc4bb37b1258ddd5033b`
- утверждённый прототип: `prototype-v2-approved.html`
- V1 source commit: `abbab1139e4eeeea40f977ab4e34753ee0ace103`
- контрольный документ: `docs/operations/2026-08-01-main-app-v2-approved-prototype-handoff.md`
- активная версия: V1
- fallback: V1

Аудит выполнен по фактической HTML/JS-реализации прототипа и по действующей V1-логике, которую V2 обязана сохранить.

## Итоговый вердикт

Прототип достаточен как утверждённый визуальный каркас, но недостаточен как функциональная спецификация для прямого переноса в production.

Подтверждено:

- шесть главных разделов расположены в утверждённом порядке;
- Лёва визуально выделен;
- глобальная композиция экранов соответствует принятому направлению;
- Главная, Лёва, Мероприятия, Путь, Виджеты и Профиль представлены в одном кликабельном файле;
- прототип не подключает Firebase, Telegram SDK, Firestore или пользовательские данные;
- localStorage в прототипе не используется.

Не подтверждено до исправления:

- реальная смена состояний после действий;
- маршрутизация внутренних экранов и системная кнопка «Назад»;
- demo/paywall/countdown;
- loading, empty, error, offline и locked states;
- подтверждения опасных действий;
- приватность публичного профиля;
- реальное редактирование виджетов;
- сохранение существующей V1-логики через явные UI-контракты.

## Критические находки P0

### P0-01. Нет системной модели маршрутов

Функция `go(tab)` только переключает шесть DOM-секций. Внутренние поверхности открываются общей bottom-sheet без route identity.

Риски:

- Telegram BackButton невозможно связать с историей переходов;
- deep links нельзя адресовать стабильно;
- внутренний экран нельзя восстановить после перезапуска;
- невозможно гарантировать правильный активный parent tab;
- payment и critical confirmation surfaces нельзя отделить от обычной навигации.

Обязательная правка:

- ввести route registry и parent-tab mapping;
- определить back behavior для каждого route;
- закрепить маршруты в `UI Contract V2`.

### P0-02. Нет auth/demo/paywall состояний

В прототипе отсутствуют:

- boot/auth loading;
- auth error и retry;
- demo banner;
- countdown;
- active paid/free subscription state;
- expired demo overlay;
- payment route;
- доступные исключения из блокировки: оплата, помощь, кабинет, выход.

Это противоречит обязательному сохранению действующей V1-модели доступа.

### P0-03. Действия не меняют состояние

Большинство кнопок вызывают `toast()` или общую `openSheet()`. Кнопки в bottom-sheet также только показывают toast и закрывают sheet.

Не симулируются:

- запись на событие;
- отмена записи;
- выполнение квеста;
- закладка урока;
- отправка сообщения Лёве;
- изменение виджета;
- изменение профиля;
- добавление виджета.

Обязательная правка:

- для каждого action определить before/working/success/error state;
- исключить двойное выполнение;
- показывать фактическое изменение локального prototype state.

### P0-04. Опасные действия выполняются без подтверждения

Кнопка `Отменить` в блоке «Мои записи» сразу показывает `Запись отменена`.

В прототипе нет отдельных подтверждений для:

- отмены участия;
- сброса расположения виджетов;
- выхода;
- удаления или сброса данных;
- side-effect действий Лёвы;
- подтверждения выбранного плана оплаты.

Обязательная правка:

- реализовать confirmation matrix из `UI Contract V2`;
- destructive action не может быть обычной toast-кнопкой.

### P0-05. Locked lesson остаётся кликабельным

Урок «Питание без героизма» визуально отмечен замком, но весь `list-item` вызывает `lesson(...)`, после чего предлагается `Начать урок`.

Обязательная правка:

- locked route открывает причину блокировки, prerequisite или paywall;
- locked item не предлагает start action;
- completed item предлагает review/repeat, а не первый старт.

### P0-06. События имеют конфликт кликов и не отражают attendance state

Hero-карточка целиком кликабельна. Внутри неё находится кнопка `Я иду`, но отдельного обработчика у кнопки нет. Срабатывает карточка события.

Аналогичные риски есть у вложенных кнопок внутри кликабельных карточек.

Обязательная правка:

- разделить card navigation и primary action;
- остановить event bubbling;
- добавить states: available, registered, waitlist, full, cancelled, completed;
- после записи кнопка меняется на `Вы записаны` или `Отменить запись`.

### P0-07. Виджетный редактор заявляет функции, которых нет

Режим редактирования только добавляет CSS-класс `edit` и открывает sheet. Реальных операций нет.

Не работают:

- drag/reorder;
- resize;
- hide/remove;
- add/restore;
- save/cancel/reset;
- unsaved changes state.

Также отсутствует утверждённый модуль `Медиа`.

Обязательная правка:

- добавить `Медиа`;
- сделать полный prototype-state editor;
- drag handle показывать только в edit mode;
- после `Готово` порядок и размеры должны оставаться изменёнными до перезагрузки прототипа;
- production persistence позднее выполняется только через Firestore.

### P0-08. Публичный профиль не имеет privacy contract

Прототип показывает баллы, серию, друзей, события, описание, проценты сфер, достижения, моменты и список друзей без выбора видимости.

Нет:

- edit/share controls, хотя они утверждены;
- member-only режима;
- public preview;
- field-level visibility;
- own profile vs another member profile;
- private/hidden states.

Модуль `Образ и примерка` выглядит рабочим, хотя он отложен.

Обязательная правка:

- применить conservative visibility defaults из `UI Contract V2`;
- `Образ и примерка` маркировать `Скоро` и не имитировать работающую функцию;
- внешний публичный share не включать до отдельной privacy acceptance.

### P0-09. Отсутствуют общие системные состояния

Для production-контракта не представлены:

- skeleton/loading;
- empty;
- recoverable error;
- offline/stale;
- saving;
- success;
- disabled;
- locked;
- paywalled;
- unauthenticated.

Обязательная правка:

- общие states должны быть едиными компонентами, а не отдельными решениями каждого экрана.

### P0-10. Сохранение V1-логики не отражено в интерфейсе

V1 содержит рабочие зависимости, которые не видны в прототипе:

- Firebase custom-token auth;
- `users/{uid}`;
- `user_data/{uid}`;
- `cycle_data/{uid}`;
- `roulette_active_perks/{uid}`;
- `news`;
- personal schedule sync в `events`;
- points и `awardPoints()`;
- demo/subscription/payment flow;
- `new_contact` deep link;
- advanced Path/Life Map.

Обязательная правка:

- закрепить adapters и data ownership в `UI Contract V2`;
- прототип не должен заставлять разработчика придумывать новый data model во время UI-переноса.

## Существенные находки P1

### P1-01. Метрики Главной неоднозначны

В одной карточке одновременно показаны `58%`, `32% день`, уровень, баллы и серия без явной подписи главного процента.

Правка:

- каждый процент имеет label и source;
- общий прогресс Пути не смешивается с прогрессом дня.

### P1-02. Контекст «Продолжить Путь» расходится между экранами

Главная указывает `Голова · Глава 3`, а экран Пути показывает основной текущий блок `Тело · Глава 2`.

Правка:

- current continuation entity едина для Home и Path;
- source of truth один.

### P1-03. Математика прогресса Пути расходится

Показано `54%` и `36 из 70 уроков`, что не равно 54%.

Правка:

- процент рассчитывается из фактических значений;
- ручные независимые цифры запрещены.

### P1-04. Tabs в Лёве и Пути не переключают контент

`Рекомендации`, `История`, `Действия`, `Все сферы`, `История`, `Закладки` показывают только toast.

Правка:

- tabs меняют active state и содержимое;
- каждый tab имеет empty/loading/error состояние.

### P1-05. Нет voice input placeholder

Утверждённый экран Лёвы должен содержать placeholder голосового ввода. В текущем chatbar есть только text input и send.

Правка:

- добавить disabled voice control с ясным статусом `Скоро`, пока runtime не реализован.

### P1-06. Сообщение Лёве не добавляется в диалог

`sendChat()` открывает bottom-sheet вместо добавления user bubble и simulated assistant response.

Правка:

- append user bubble;
- typing state;
- response/error state;
- side-effect action только после preview/confirmation.

### P1-07. Event filters не фильтруют список

Активный chip меняется, но список остаётся прежним.

Правка:

- фильтр должен изменять visible cards и показывать empty state.

### P1-08. Кнопки без обработчиков

Примеры:

- `Подробнее` в «Мои записи»;
- `Поддержка и помощь`;
- `О приложении`;
- быстрые действия внутри виджета;
- notification button на Widgets;
- `Мой клуб`.

Правка:

- любой визуально активный control обязан иметь определённый route/action;
- иначе control маркируется disabled/coming soon.

### P1-09. Нет выхода и отдельного destructive reset

Профиль не показывает действующий безопасный паттерн:

- logout с подтверждением;
- destructive data reset как отдельное действие;
- logout не удаляет данные.

### P1-10. Нет public profile edit/share controls

Они входят в утверждённую структуру, но отсутствуют.

### P1-11. Bottom navigation не умеет скрываться

Требование скрывать nav на payment и critical confirmation surfaces не реализовано.

### P1-12. Нет Telegram BackButton и browser history

Escape закрывает sheet на desktop, но мобильная системная навигация не определена.

## Качество и доступность P2

- нижние подписи имеют размер 7px, часть вторичного текста 8–10px;
- touch targets часто 38px вместо рекомендуемого минимума 44px;
- нет `aria-label`, dialog semantics и focus management;
- sheet не возвращает фокус инициатору;
- текст с `\n` передаётся через `textContent`, но paragraph не имеет `white-space: pre-line`;
- `.filterChip()` снимает active со всех `.chip` глобально, что создаст конфликт при появлении chips на других экранах;
- dev-link `V1 / V2` расположен поверх shell и должен быть development-only;
- placeholder email и phone не должны попадать в реальную сборку;
- emoji допустимы как временное prototype art, но не являются финальным asset contract;
- safe-area top и keyboard behavior должны проверяться внутри Telegram.

## Единый список обязательных правок перед freeze прототипа

Порядок выполнения:

1. Ввести route registry и back stack.
2. Ввести общие app/content/action states.
3. Добавить auth/demo/paywall/payment representations.
4. Реализовать stateful action simulation.
5. Добавить confirmation matrix.
6. Исправить event bubbling и attendance states.
7. Исправить lesson completed/available/locked behavior.
8. Реализовать полный widget editor и добавить `Медиа`.
9. Реализовать tabs Лёвы и Пути.
10. Добавить voice placeholder, typing и error state Лёвы.
11. Синхронизировать Home и Path continuation/progress values.
12. Добавить public-profile edit/preview/privacy states.
13. Перевести будущий модуль `Образ и примерка` в disabled `Скоро`.
14. Добавить logout и отдельный destructive reset route.
15. Привязать все controls к action, route или disabled state.
16. Добавить loading/empty/error/offline для news, events, path, widgets, Lyova и profile.
17. Добавить Telegram BackButton contract.
18. Добавить accessibility labels, focus management и минимальные touch targets.
19. Скрывать bottom nav на payment и critical confirmations.
20. Зафиксировать `new_contact -> Widgets / Contacts / New Contact`.
21. Зафиксировать V1 data adapters без переименования существующих полей и коллекций.
22. Провести повторный clickable acceptance по сценариям из `UI Contract V2`.

## Решение по дальнейшей работе

Код production V2 можно начинать только по замороженному `docs/contracts/main-app-v2-ui-contract.md`.

Сам файл `prototype-v2-approved.html` остаётся visual baseline. Он не считается production specification до внесения перечисленных правок или до появления отдельного contract-driven prototype, который закрывает те же acceptance criteria.
