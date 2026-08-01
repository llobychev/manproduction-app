# Main Mini App — current-to-target screen and route map v1

Date: 2026-08-01  
Repository: `llobychev/manproduction-app`  
Source main: `6fb11176814e29e1ff28eea48ee3bc4d87309c60`  
Issue: #5  
Status: Phase 2 complete; production implementation not started

## Objective

Map the current `index.html` screen graph into the approved prototype hierarchy without changing Firestore schemas, route identities, subscription logic, points logic or deep-link semantics.

## Target persistent navigation

Only these five destinations remain visible in the bottom navigation:

| Target tab | Existing screen ID | Role |
|---|---|---|
| Главная | `s-home` | daily state, progress, quests, schedule, quick tools, news |
| Мероприятия | `s-events` | online and offline club activity |
| Путь | `s-path` | central product journey and Life Map |
| Уроки | `s-lessons` | learning library and five spheres |
| Профиль | `s-profile` | account, subscription, settings and complete tool directory |

`Путь` remains the central highlighted button.

## Complete screen disposition

### Global and onboarding contour

These are outside the persistent application navigation and remain unchanged during the first implementation batch.

| Current element | Target | Action | Notes |
|---|---|---|---|
| `splash` | global | keep | boot state |
| onboarding welcome/quiz/result/form screens | global onboarding | keep | do not combine with application tabs |
| `demo-banner` | global | keep | must remain above all tabs |
| `expired-overlay` | global | keep | must remain able to open `payment` |
| Lyova FAB | global | keep | persistent assistant entry |

### Главная family

| Current screen | Target parent | Action | Route rule |
|---|---|---|---|
| `s-home` | Главная | keep and recompose | remains `home` |
| `s-quests-full` | Главная | keep nested | back to `home` |
| `s-news` | Главная / topbar | keep nested | remains `news` |
| `s-news-detail` | Новости | keep nested | back to `news` |
| `s-chat` | topbar / future community | keep hidden or paused | remains `chat`; no new bottom tab |
| `s-leaderboard` | Главная progress or Профиль | keep nested | parent nav resolves to `home` or `profile`; choose one canonical parent in implementation |

Recommended home composition order:

1. user progress summary;
2. current Path action;
3. quest of the day;
4. nearest schedule/event;
5. quick tools: Разум, Контакты, Финансы;
6. news preview.

### Мероприятия family

| Current screen | Target parent | Action | Route rule |
|---|---|---|---|
| `s-events` | Мероприятия | replace stub composition | remains `events` |

The current screen is a placeholder. Implementation may replace its internal markup without migration risk because no established event UI hierarchy exists there. Existing personal event data and IDs must remain unchanged.

### Путь family

| Current screen or view | Target parent | Action | Route rule |
|---|---|---|---|
| `s-path` | Путь | keep and refine | remains `path` |
| `mcpath-core` internal view | Путь | keep | shown by `mcPathShowCore()` |
| `mcpath-character` internal view | Путь | keep | not a separate bottom route |

The existing Life Map implementation is already more advanced than the isolated prototype. Production work should preserve its behavior and adjust composition around it rather than replacing it wholesale.

### Уроки family

| Current screen | Target parent | Action | Route rule |
|---|---|---|---|
| `s-lessons` | Уроки | keep and recompose | remains `lessons` |
| `s-lesson-detail` | Уроки | keep nested | parent nav `lessons` |
| `s-sport-hub` | Уроки → Тело | keep nested | parent nav `lessons` |
| `s-sport-category` | Спорт | keep nested | parent nav `lessons` |
| `s-sport-video` | Спорт | keep nested | parent nav `lessons` |
| `s-pets` | Уроки → Тело | keep nested | parent nav `lessons` |
| `s-pets-detail` | Питомцы | keep nested | parent nav `lessons` |
| `s-nutrition` | Уроки → Тело | keep nested | parent nav `lessons` |
| `s-languages` | Уроки | keep nested | parent nav `lessons` |
| `s-lang-detail` | Языки | keep nested | parent nav `lessons` |
| `s-hookah` | Уроки | archive candidate / hidden | stub; do not delete logic during first pass |
| `s-alcohol` | Уроки | archive candidate / hidden | stub; do not delete logic during first pass |
| `s-rel-hub` | Уроки → Люди | keep nested | parent nav `lessons` |
| `s-rel-stub` | Отношения | keep nested | parent nav `lessons` |
| `s-rel-meet` | Отношения | keep nested | parent nav `lessons` |
| `s-rel-meet-online` | Знакомства | keep nested | parent nav `lessons` |
| `s-rel-meet-live` | Знакомства | keep nested | parent nav `lessons` |
| `s-rel-dates` | Отношения | keep nested | parent nav `lessons` |

Required content correction during implementation:

- `s-lessons` currently displays `6 сфер жизни`.
- The accepted MenClub model contains five spheres.
- Change the visible subtitle to `5 сфер жизни`; do not infer a data migration from this text fix.

### Разум / self family

The visible bottom tab is removed. All route and screen IDs remain valid.

| Current screen | Target parent | Action | Route rule |
|---|---|---|---|
| `s-self` | Главная → Инструменты; also Профиль directory | move entry point | route remains `self`; active parent nav `home` |
| `s-habits` | Разум | keep nested | parent nav `home` |
| `s-challenges` | Разум | keep nested | parent nav `home` |
| `s-goals` | Разум | keep nested | parent nav `home` |
| `s-team-hub` | Челленджи | keep nested | parent nav `home` |
| `s-team-detail` | Челленджи | keep nested | parent nav `home` |
| `s-flow` | Разум | keep hidden/stub | parent nav `home` |
| `s-intention` | Разум | keep hidden/stub | parent nav `home` |
| `s-mindset` | Разум | keep nested | parent nav `home` |
| `s-mindset-beliefs` | Мышление | keep nested | parent nav `home` |
| `s-myreality` | Разум | keep hidden/stub | parent nav `home` |
| `s-morning` | Разум | keep nested | parent nav `home` |
| `s-positivity` | Разум | keep nested | parent nav `home` |
| `s-challenge-leaderboard` | Челленджи | keep nested | parent nav `home` |

### Контакты / networking family

The visible bottom tab is removed. The route remains mandatory because Telegram deep links depend on it.

| Current screen | Target parent | Action | Route rule |
|---|---|---|---|
| `s-net` | Главная → Инструменты; also Профиль directory | move entry point | route remains `net`; active parent nav `home` |
| `s-cycle-calendar` | Контакты | keep nested | back remains `net`; active parent nav `home` |

Critical invariant:

`new_contact` must still produce:

`deeplink resolved → application ready → s-net active → contact modal open`.

The removal of `nav-net` must not break this flow.

### Финансы family

The visible bottom tab is removed. The route and current data logic remain.

| Current screen | Target parent | Action | Route rule |
|---|---|---|---|
| `s-fin` | Главная → Инструменты; also Профиль directory | move entry point | route remains `fin`; active parent nav `home` |

The existing `switchTab('fin')` lifecycle call to `renderFinance()` must continue to execute.

### Профиль and access family

| Current screen | Target parent | Action | Route rule |
|---|---|---|---|
| `s-profile` | Профиль | keep and recompose | remains `profile` |
| `s-profile-subscription` | Профиль | keep nested | back to `profile` |
| `s-personal-data` | Профиль | keep nested | back to `profile` |
| `s-help` | Профиль | keep nested | back to `profile` |
| `s-payment` | Профиль / global paywall | keep protected hidden route | remains `payment`; parent nav `profile` |

Recommended profile composition:

1. identity and progress;
2. tariff/subscription;
3. personal data;
4. achievements/rating;
5. complete tool directory;
6. help and legal information;
7. logout.

## Navigation dependency audit

The current code cannot safely remove `nav-self`, `nav-net` and `nav-fin` without adaptation.

### Current safe behavior

`switchTab(tab)` already tolerates a missing direct nav element because it checks:

```js
var navEl = document.getElementById('nav-' + tab);
if (navEl) navEl.classList.add('active');
```

However, this leaves no parent tab active for nested routes.

### Current unsafe hard dependencies

The following functions directly dereference old nav nodes and will throw if the nodes are removed:

- `openSelfTool()` → `document.getElementById('nav-self').classList.add('active')`
- `openScreen()` → direct `nav-lessons` activation
- `openSportHub()` and related lesson helpers → direct `nav-lessons` activation
- `openRelHub()` / `openRelScreen()` → direct `nav-lessons` activation

`nav-lessons` remains, so lesson helpers are safe. `nav-self` does not remain and must be refactored before removing that element.

## Required route-parent resolver

Introduce one centralized mapping instead of changing dozens of handlers independently.

Recommended contract:

```js
var PRIMARY_NAV_PARENT = {
  home: 'home',
  events: 'events',
  path: 'path',
  lessons: 'lessons',
  profile: 'profile',

  'quests-full': 'home',
  news: 'home',
  'news-detail': 'home',
  chat: 'home',
  leaderboard: 'home',

  self: 'home',
  habits: 'home',
  challenges: 'home',
  goals: 'home',
  'team-hub': 'home',
  'team-detail': 'home',
  flow: 'home',
  intention: 'home',
  mindset: 'home',
  'mindset-beliefs': 'home',
  myreality: 'home',
  morning: 'home',
  positivity: 'home',
  'challenge-leaderboard': 'home',

  net: 'home',
  'cycle-calendar': 'home',
  fin: 'home',

  'lesson-detail': 'lessons',
  'sport-hub': 'lessons',
  'sport-category': 'lessons',
  'sport-video': 'lessons',
  pets: 'lessons',
  'pets-detail': 'lessons',
  nutrition: 'lessons',
  languages: 'lessons',
  'lang-detail': 'lessons',
  hookah: 'lessons',
  alcohol: 'lessons',
  'rel-hub': 'lessons',
  'rel-stub': 'lessons',
  'rel-meet': 'lessons',
  'rel-meet-online': 'lessons',
  'rel-meet-live': 'lessons',
  'rel-dates': 'lessons',

  'profile-subscription': 'profile',
  'personal-data': 'profile',
  help: 'profile',
  payment: 'profile'
};
```

Create one helper:

```js
function activatePrimaryNavFor(route) {
  document.querySelectorAll('.nav-item').forEach(function (node) {
    node.classList.remove('active');
  });
  var parent = PRIMARY_NAV_PARENT[route] || route;
  var nav = document.getElementById('nav-' + parent);
  if (nav) nav.classList.add('active');
}
```

Then replace direct nav activation in `switchTab()` and `openSelfTool()` with this helper.

## Access and security gates affected by navigation

The route-parent resolver is visual only. It must not become the only access control.

The later implementation must verify:

- demo users cannot open restricted nested tools merely through direct route calls;
- expired users are redirected to the existing expired/payment flow;
- hidden routes remain protected even when no nav item exists;
- `payment` remains accessible from the global expired overlay;
- personal-data writes remain scoped to the authenticated user;
- points are not awarded by newly duplicated card handlers;
- challenge and team mutations retain their existing identity and are later moved behind server-side authorization.

## Implementation batches

### Batch A — navigation infrastructure

- add `PRIMARY_NAV_PARENT`;
- add `activatePrimaryNavFor()`;
- make `switchTab()` validate that the target screen exists;
- refactor `openSelfTool()` to use parent resolution;
- keep all current screen IDs;
- do not rearrange DOM yet.

Acceptance:

- every current route still opens;
- nested screens activate the correct parent tab;
- `new_contact` still opens Contacts and its modal;
- no data logic changes.

### Batch B — bottom navigation shell

- replace eight visible items with five;
- keep `nav-home`, `nav-events`, `nav-path`, `nav-lessons`, `nav-profile`;
- remove visible `nav-self`, `nav-net`, `nav-fin` only after Batch A passes;
- preserve `payment` as a non-visible route without relying on a nav node;
- enlarge labels to a readable mobile size;
- keep Path centered and emphasized.

Acceptance:

- five items fit without horizontal compression;
- all old routes remain reachable through nested entry points;
- no console error from missing nav elements.

### Batch C — home composition

- add quick-tool entry cards for `self`, `net`, `fin`;
- preserve current functions and IDs;
- keep quest, schedule, progress and news actions;
- do not duplicate point-award listeners.

### Batch D — profile directory

- add complete tool directory;
- keep subscription, personal data, help and logout;
- do not move sensitive mutations into new client handlers.

### Batch E — events and lessons cleanup

- replace events placeholder with approved composition;
- correct `6 сфер жизни` to `5 сфер жизни`;
- keep all current lesson subroutes;
- hide archive-candidate stubs rather than deleting them.

### Batch F — full regression and security completion

- demo / paid / expired account tests;
- onboarding and restored-user tests;
- `new_contact` Telegram deeplink test;
- points and anti-duplicate checks;
- finance rendering;
- profile and payment rendering;
- detailed Firestore Rules;
- backend migration of privileged writes;
- negative authorization tests.

## Phase 2 result

- Current screens are mapped to target parents.
- No screen or Firestore identity requires deletion for the new construction.
- The primary implementation blocker is a navigation dependency, not a data migration.
- Production restructuring can proceed in small reversible batches.
