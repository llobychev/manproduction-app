# MenClub Main App V2 — audit and UI Contract handoff

Date: 2026-08-01
Status: clickable prototype audit completed; correction list consolidated; UI Contract V2 frozen; production implementation not started

## Exact starting state

- Repository: `llobychev/manproduction-app`
- Starting main: `86a7df82203c1740e7c1dc4bb37b1258ddd5033b`
- Approved prototype: `prototype-v2-approved.html`
- V1 source commit: `abbab1139e4eeeea40f977ab4e34753ee0ace103`
- Active version: `v1`
- Fallback version: `v1`

## New canonical documents

- `docs/reviews/2026-08-01-main-app-v2-clickable-prototype-audit.md`
- `docs/contracts/main-app-v2-ui-contract.md`

## Audit result

The approved prototype remains the visual baseline, but the audit found that it is not sufficient as a production behavior specification.

Major gaps fixed at contract level:

- no route registry or back-stack model;
- no auth/demo/paywall/payment representation;
- actions mostly produce toast without changing state;
- event cancellation has no confirmation;
- locked lessons remain clickable as normal lessons;
- event card and nested action clicks conflict;
- widget editor does not reorder, resize, hide or restore widgets;
- approved `Медиа` widget is missing;
- public-profile privacy is undefined;
- shared loading, empty, error, offline, locked and saving states are absent;
- Lyova and Path tabs do not switch content;
- voice placeholder is absent;
- Home and Path continuation/progress data are inconsistent;
- several visible controls have no action;
- logout and destructive data reset are not represented separately.

## Frozen decisions

### Global navigation

Bottom navigation remains:

1. Главная
2. Лёва
3. Мероприятия
4. Путь
5. Виджеты
6. Профиль

Lyova remains emphasized. Inner routes retain the correct parent tab. Payment and destructive confirmation surfaces hide bottom navigation. Telegram BackButton follows the same route stack as the in-app back action.

### Route model

A route registry is mandatory before screen implementation. It covers:

- Home inner routes;
- Lyova tabs and threads;
- Events list, mine, detail and confirmation routes;
- Path sphere/chapter/lesson/history/bookmark routes;
- Widgets edit/gallery/tool routes;
- Cabinet, settings, subscription, help, logout and data-reset routes;
- Public Profile preview/edit routes;
- payment states.

Required deep-link mapping:

`new_contact -> Widgets -> Contacts -> New Contact`

### Access model

Preserve current V1 rules:

- active paid subscription -> full access;
- active free subscription perk -> full access;
- active demo -> app with countdown;
- new user without perks -> current default 21-day demo;
- expired demo -> blocked premium content while payment, help, limited cabinet and logout remain available.

### Data model boundary

Existing authoritative dependencies remain unchanged:

- `users/{uid}`;
- `user_data/{uid}`;
- `cycle_data/{uid}`;
- `roulette_active_perks/{uid}`;
- `news/{newsId}`;
- existing personal schedule mirror in `events/{uid_eventId}`;
- existing Path/Life Map storage;
- existing points and `awardPoints()` logic;
- existing analytics path.

New physical schemas for club events, registrations, widget layouts, Lyova history and public profiles are not invented inside UI implementation. They require separate schema/security review and must be additive.

### Public Profile privacy

Initial V2 public profile is member-to-member, not open web.

Defaults are conservative:

- name/avatar/level may be member-visible;
- city, username, points, streak, counts, exact sphere percentages, moments, friends and social links are hidden until explicit user publication;
- email, phone, subscription, payments, security, finance, health and journal data are never public;
- external public sharing remains disabled until separate privacy acceptance;
- `Образ и примерка` is `Скоро`, not a simulated working module.

### Confirmation rules

Mandatory confirmations include:

- event cancellation;
- widget layout reset;
- logout;
- destructive user-data reset;
- payment plan confirmation;
- Lyova side-effect actions;
- public visibility save.

Logout must not delete data. Destructive reset remains a separate double-confirmed route.

## Implementation order

1. shell;
2. route registry and back stack;
3. shared loading/empty/error/offline/confirmation states;
4. auth/access/demo/paywall/payment shells;
5. Home;
6. Events;
7. Path + Lessons;
8. Widgets;
9. Lyova;
10. Cabinet + Public Profile;
11. Firestore adapters;
12. V1/V2 compatibility testing;
13. controlled activation and rollback.

## Safety state after this stage

- production `index.html` unchanged;
- `versions/active.json` unchanged;
- active version remains `v1`;
- fallback remains `v1`;
- BotFather URL unchanged;
- Firebase/Auth/Firestore runtime unchanged;
- no schema changes;
- no user data touched;
- no GitHub Actions.

## Completion

- Full clickable prototype audit: 100%
- Consolidated correction list: 100%
- UI Contract V2: 100%
- Production V2 implementation: 0%
- Real data integration: 0%
- V1/V2 compatibility acceptance: 0%
- Controlled activation: 0%

Overall Main App V2 restructure after this checkpoint: approximately 58–60%.

## Exact next stage

Start production V2 package 1:

**isolated V2 shell + route registry + back stack + shared state components**

Do not connect business writes or activate V2 in production during package 1.
