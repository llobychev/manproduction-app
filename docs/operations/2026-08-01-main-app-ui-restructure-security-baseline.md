# Main Mini App UI restructure — security baseline

Date: 2026-08-01  
Repository: `llobychev/manproduction-app`  
Baseline branch: `main`  
Baseline commit: `abbab1139e4eeeea40f977ab4e34753ee0ace103`  
Issue: #5  
Status: prototype preparation; production UI unchanged

## Purpose

Record the security and data-integrity boundary before changing screen placement, navigation hierarchy or widget composition in the Main MenClub Mini App.

This checkpoint deliberately separates two concerns:

1. **Information architecture and visual composition** — can be prototyped independently.
2. **Authentication, subscriptions, points and persistence** — must not be rewritten as part of a visual rearrangement.

## Verified current construction

The production application is implemented as one large `index.html` containing HTML, CSS, navigation, Firebase access and product logic.

The persistent bottom navigation currently exposes eight visible destinations:

1. `home` — Главная
2. `events` — Мероприятия
3. `path` — Путь
4. `lessons` — Уроки
5. `self` — Разум
6. `net` — Контакты
7. `fin` — Финансы
8. `profile` — Профиль

A hidden ninth navigation destination exists for `payment`.

The navigation labels are configured at `7px`, which is a direct symptom of excessive top-level density on a mobile viewport.

## Target construction for prototype v1

The prototype reduces persistent navigation to five product-level destinations:

1. **Главная**
2. **Мероприятия**
3. **Путь** — central and visually emphasized
4. **Уроки**
5. **Профиль**

No existing product module is deleted during this phase.

The following current top-level modules become nested tools:

| Current module | Target location | Status |
|---|---|---|
| Разум / `self` | Главная → Инструменты; also available from Профиль | move, preserve route |
| Контакты / `net` | Главная → Инструменты | move, preserve route and deeplink |
| Финансы / `fin` | Главная → Инструменты | move, preserve route |
| Новости / `news` | top-bar action and Главная feed | preserve |
| Chat / `chat` | top-bar action | preserve |
| Payment / `payment` | Профиль → Тариф и подписка; paywall action | preserve hidden route |
| Лёва | persistent floating assistant action | preserve |

## Security invariants

The following invariants are mandatory during implementation.

### Authentication

- Telegram identity and Firebase authentication must complete before Firestore-dependent application loading.
- Firestore must not be initialized or used as an unauthenticated fallback.
- UI restructuring must not create a separate unguarded boot path.
- First-run, restored-user, demo and paid flows must converge on one ready-state contract.

### Demo and subscription access

- Moving a widget must not bypass its demo/paywall condition.
- Hidden UI is not an authorization mechanism.
- The expired overlay and payment route must remain reachable from every restricted flow.
- Paid, demo and expired states must be regression-tested independently.

### Points and progression

- Existing point-award functions and anti-duplicate checks are not to be copied into new click handlers.
- A moved card must call the existing action, not create a second award path.
- Leaderboard synchronization is data logic and must remain separate from visual placement.

### Deep links

- `new_contact` must continue to resolve to the Contacts tool and open the contact modal after application readiness.
- The new hierarchy may change visible navigation, but must not change the semantic destination.
- Deep-link intent processing must remain centralized and idempotent.

### Data identity

- Existing Firestore collection names and document IDs remain unchanged in the UI restructuring phase.
- Existing user-owned documents must not be migrated merely to support a new screen arrangement.
- No destructive cleanup function may be attached to logout, navigation or layout reset.

## Direct Firestore surface observed in current application

The current single-file client contains direct reads and writes for multiple domains. These calls are not being changed in the prototype, but they define the later security-enforcement scope.

Observed data surfaces include:

- `users/{uid}` — main user data and profile state
- `user_data/{uid}` — journals and personal data
- `cycle_data/{uid}` — cycle calendar information
- `events/{uid_eventId}` — personal event synchronization
- `news` — application news feed, read-only in the Main App
- `leaderboard/{uid}` — shared points mirror
- `challenge_progress/{challengeId_uid}` — user challenge progress
- `challenges/{challengeId}/teams/{teamId}` — team creation and deletion
- `challenges/{challengeId}/teams/{teamId}/members/{uid}` — membership and captain actions
- `daily_quests` — active quest catalog
- `analytics/main/events` — client analytics events

### High-risk mutations for later backend migration

These are not part of the prototype patch, but should be prioritized after the final screen construction is accepted:

1. leaderboard point synchronization;
2. challenge team creation, member removal and team deletion;
3. subscription and payment-confirmation mutations;
4. any privileged profile or access state;
5. shared event and analytics writes requiring validation;
6. destructive account/data operations.

## Prototype isolation rules

The prototype must:

- live in a separate file;
- contain no Firebase SDK;
- contain no Telegram SDK;
- make no network requests;
- use no production collections;
- use no `localStorage` persistence;
- not modify `index.html`;
- demonstrate navigation and widget hierarchy only.

## Implementation guardrails after approval

When the approved prototype is transferred to production:

1. create a route and widget mapping before editing;
2. move existing DOM blocks where practical rather than rewriting logic;
3. keep existing element IDs required by JavaScript;
4. preserve existing action function names;
5. avoid duplicate event listeners;
6. validate that each `switchTab()` target still exists;
7. test all hidden and deeplink routes;
8. extract scripts and run a JavaScript syntax check;
9. verify demo, paid and expired accounts in Telegram;
10. test that logout does not delete Firestore data.

## Acceptance criteria for this checkpoint

- [x] Exact baseline commit recorded.
- [x] Current navigation inventory recorded.
- [x] Target five-item information architecture recorded.
- [x] Security invariants recorded.
- [x] Direct Firestore surface recorded at domain level.
- [x] Production `index.html` remains unchanged.
- [ ] Standalone clickable prototype added.
- [ ] Draft pull request opened.
- [ ] Prototype reviewed before production implementation.
