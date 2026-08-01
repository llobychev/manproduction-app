# MenClub Main App V2 — approved clickable prototype handoff

Date: 2026-08-01
Status: prototype approved; production implementation not started

## Exact repository state

- Repository: `llobychev/manproduction-app`
- Main at checkpoint start: `0d1576e2d687886f28826a9e03553d420cd9d409`
- V1 source commit: `abbab1139e4eeeea40f977ab4e34753ee0ace103`
- V1 safety branch: `safety/main-app-pre-restructure-2026-08-01`
- Active version: `v1`
- Fallback version: `v1`
- V2 entry: `versions/v2/index.html`
- Approved prototype: `prototype-v2-approved.html`

## Dual-version model

V1 Stable and V2 Development must coexist throughout implementation.

- `index.html` remains the current production application until explicit V2 activation.
- `versions/v1/index.html` provides a permanent entry to the stable pre-restructure version.
- `versions/v2/index.html` provides a permanent entry to the new development version.
- `app.html` reads `versions/active.json` and supports forced `?version=v1` or `?version=v2` entry.
- Any launcher failure must fall back to V1.
- Do not change BotFather / Telegram Mini App production URL before controlled activation.

## Approved global shell

Persistent bottom navigation has six sections in this order:

1. Главная
2. Лёва
3. Мероприятия
4. Путь
5. Виджеты
6. Профиль

Approved behavior:

- Лёва is visually emphasized with a larger round action in the bottom navigation.
- Final Lyova button art is deferred; temporary neutral art is acceptable during implementation.
- Header is sticky.
- Home uses brand/logo and notifications.
- Inner screens use back navigation and contextual actions.
- Bottom navigation is hidden on payment and critical confirmation surfaces.
- Repeated tap on the active tab returns its screen to the top.
- Inner routes keep the correct primary parent tab active.

## Approved screens

### Главная

Approved structure:

- greeting and overall progress;
- continue Path;
- daily quest;
- nearest event;
- Lyova recommendation;
- today's schedule;
- club news;
- compact points, level and streak indicators.

### Лёва ИИ

Approved starting structure:

- greeting block with Lyova;
- quick scenarios;
- chat;
- voice input placeholder;
- recommendations;
- dialog history;
- quick navigation to app modules;
- Lyova settings.

The real AI/runtime architecture remains a later implementation layer. The current prototype is interface and behavior simulation only.

### Мероприятия

Approved structure:

- nearest event hero;
- filters;
- event list;
- participants and attendance state;
- separate `Мои записи` section;
- cancel attendance;
- event detail transition.

### Путь

Lessons are integrated into Path and are no longer a separate bottom tab.

Approved structure:

- five life spheres: Тело, Деньги, Люди, Голова, Смысл;
- total progress, XP and level;
- current chapter and continue action;
- current and upcoming lessons;
- history and bookmarks;
- Lyova recommendations;
- sequential content unlocking and XP rewards.

Preserve the existing advanced Path / Life Map logic rather than replacing it wholesale.

### Виджеты

The approved visual reference is the first vertical phone-layout widgets mockup shown after the user said `погнали` for the Widgets screen. Later alternative widget images are rejected and must not be used.

Approved modules initially include:

- Разум;
- Контакты;
- Финансы;
- Привычки;
- Здоровье;
- Мероприятия;
- Заметки;
- Медиа;
- Быстрые действия.

Approved behavior:

- editing mode;
- drag/reorder;
- resize;
- hide/remove;
- add/restore widgets;
- persist layout later through Firestore, never localStorage.

### Профиль

The Profile contains two top-level modes:

1. `Мой кабинет`
2. `Публичный профиль`

`Мой кабинет` approved structure:

- user identity and level;
- subscription/tariff management;
- personal data;
- settings, notifications, privacy, security and language;
- achievements and XP;
- payment history;
- club access;
- invite friend;
- gift cards;
- support/help;
- app information;
- version selector.

`Публичный профиль` approved starting structure:

- social player page;
- profile header and share/edit controls;
- points, streak, friends and events;
- about section;
- five spheres;
- `Образ и примерка` future module;
- achievements;
- activity moments;
- friends/players.

Exact public-profile privacy and social mechanics are deferred for later design.

## Approved prototype behavior

`prototype-v2-approved.html` is a unified clickable prototype with:

- all six tabs;
- highlighted Lyova entry;
- Home cross-navigation;
- mock Lyova chat and quick actions;
- event filters, cards and attendance actions;
- Path spheres, chapters, lessons and progress;
- widget editing simulation;
- cabinet/public profile switching;
- modal and toast interface feedback.

Prototype boundaries:

- no Firebase SDK;
- no Telegram SDK;
- no Firestore reads/writes;
- no localStorage;
- no user data;
- no GitHub Actions.

## Safety invariants for implementation

- Preserve Firebase custom-token authentication flow.
- `fbDb` must be initialized only after `signInWithCustomToken` succeeds.
- Firestore remains the only persistence layer; localStorage is prohibited.
- Do not rename or delete existing collections, document IDs or fields during UI migration.
- Add new data fields in a backward-compatible way.
- Preserve demo access, paywall, countdown, subscriptions and payment-by-transfer flow.
- Preserve points / `awardPoints()` and anti-duplicate rewards.
- Preserve `new_contact` deeplink behavior.
- Preserve all existing production routes until their V2 replacement is tested.
- Logout and destructive data reset must remain separate actions.
- V1 must continue working against the shared data model.
- Every production change must be tested with V1 -> V2 -> V1 rollback.
- No GitHub Actions.

## Current completion

- Visual concept: approximately 95%
- Approved unified clickable prototype: approximately 85–90%
- Dual-version foundation: 100%
- Production V2 implementation: 0%
- Real data integration: 0%
- Final security enforcement and migration tests: 0%
- Overall restructure: approximately 50–55%

## Next stage

Proceed in this order:

1. Run a complete functional audit of `prototype-v2-approved.html`.
2. Produce one consolidated list of final prototype corrections.
3. Freeze `UI Contract V2` covering routes, states, data dependencies, access/paywall rules, confirmations and public-profile visibility.
4. Implement V2 in isolated packages:
   - shell and routing;
   - Home;
   - Events;
   - Path + Lessons;
   - Widgets;
   - Lyova;
   - Cabinet + Public Profile;
   - shared loading, empty, error and paywall states.
5. Connect existing Firestore/auth/business logic without schema breakage.
6. Test V1 and V2 in parallel.
7. Activate V2 only through a controlled version switch with verified rollback.

## Resume instruction

In the next chat, start by verifying current `main` in both `llobychev/manproduction-app` and `llobychev/manclub-knowledge`, then continue from: **full clickable V2 audit -> consolidated corrections -> UI Contract V2**.
