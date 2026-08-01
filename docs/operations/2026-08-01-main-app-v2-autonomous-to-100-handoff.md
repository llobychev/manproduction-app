# MenClub Main App V2 — autonomous completion to 100% handoff

Date: 2026-08-01

Status: audit and UI Contract V2 completed; production implementation pending; next sessions authorized to continue autonomously through completion

## Exact repository state at handoff

- Repository: `llobychev/manproduction-app`
- Main: `1a9311d597b3ce7ba39de528f8e0c645f0d3cb09`
- Active version: `v1`
- Fallback version: `v1`
- V1 source commit: `abbab1139e4eeeea40f977ab4e34753ee0ace103`
- Approved prototype: `prototype-v2-approved.html`
- Production V2 implementation: 0%
- Overall Main App V2 restructure: approximately 58–60%

## Canonical source documents

Read these before implementation:

1. `docs/operations/2026-08-01-main-app-v2-approved-prototype-handoff.md`
2. `docs/reviews/2026-08-01-main-app-v2-clickable-prototype-audit.md`
3. `docs/contracts/main-app-v2-ui-contract.md`
4. `docs/operations/2026-08-01-main-app-v2-audit-ui-contract-handoff.md`
5. this handoff

The frozen `UI Contract V2` is authoritative when prototype simulation and production behavior differ.

## Autonomous continuation mandate

In the next chat:

1. verify exact current `main` in both `llobychev/manproduction-app` and `llobychev/manclub-knowledge`;
2. read the canonical documents above and the matching knowledge status;
3. start production package 1 immediately;
4. continue package by package without requesting routine confirmations;
5. create focused branches, validate, open PRs, merge verified changes, and update both application and knowledge checkpoints after every material package;
6. continue autonomously until the Main App V2 program reaches the defined 100% completion state.

Do not stop merely because a package is large. Split it into bounded implementation blocks and continue.

Ask or stop only when one of these conditions is real:

- a secret, credential, account access or manual external action is required;
- an irreversible production activation requires owner approval;
- evidence shows a safety invariant would be violated;
- a product decision is genuinely absent from the frozen contract and cannot be safely deferred;
- a platform or policy limitation prevents execution.

## Required completion sequence

### Package 1 — foundation

- isolated V2 shell;
- route registry;
- route metadata and parent-tab mapping;
- navigation and back stack;
- Telegram BackButton integration boundary;
- shared loading, empty, error, stale, offline, locked, paywalled and disabled states;
- shared confirmation/action-state components;
- no business writes and no production activation.

### Package 2 — authentication and access shell

- boot/auth lifecycle;
- current custom-token flow;
- `fbDb` only after successful authentication;
- paid, free-perk, active-demo, expired-demo and feature-lock states;
- countdown banner;
- payment route shell and payment-by-transfer preservation.

### Package 3 — Home

- greeting and authoritative progress summary;
- continue Path;
- daily quest;
- nearest event;
- Lyova recommendation;
- schedule;
- news;
- points, level and streak;
- consistent loading, empty and error states.

### Package 4 — Events

- list, filters, detail and `Мои записи`;
- attendance states;
- registration and cancellation confirmations;
- no simulated success without confirmed state change;
- additive data contract and rules review before introducing new physical schemas.

### Package 5 — Path and Lessons

- preserve existing advanced Path / Life Map;
- integrate lessons under Path;
- five active spheres;
- sphere, chapter, lesson, history, bookmarks and locked-reason routes;
- sequential unlocking;
- XP and anti-duplicate rewards;
- authoritative shared progress with Home.

### Package 6 — Widgets

- approved vertical layout direction;
- all approved modules including `Медиа`;
- real reorder, resize, hide, restore and reset behavior;
- Firestore-only layout persistence;
- `new_contact -> widgets.contactNew` deep link;
- preserve existing Contacts, Finance, Habits and related V1 functionality.

### Package 7 — Lyova

- chat, recommendations, history, actions and settings routes;
- voice placeholder marked `Скоро` until runtime exists;
- explicit confirmation before side-effect actions;
- no unsupported claim that a real AI action was completed;
- separate runtime/data contract before persistent dialog history.

### Package 8 — Cabinet and Public Profile

- account, subscription, payments, settings, privacy, security, language, achievements, help and version management;
- logout separate from destructive reset;
- public profile initially member-to-member only;
- conservative visibility defaults from UI Contract V2;
- sensitive personal, financial, health, journal, payment and security data never public;
- `Образ и примерка` remains `Скоро` until separately implemented.

### Package 9 — data adapters and security

- connect existing Firestore/auth/business logic without renaming or deleting existing fields or identities;
- add only backward-compatible fields;
- define and review additive schemas for V2-only features;
- review Firestore Security Rules for every new write path;
- preserve V1 compatibility with the shared model.

### Package 10 — verification

- functional route and state tests;
- JavaScript validation;
- responsive Telegram Mini App testing;
- auth/demo/paywall/payment checks;
- data migration and backward-compatibility checks;
- locked/reward/idempotency tests;
- privacy and destructive-action tests;
- V1 and V2 parallel verification.

### Package 11 — controlled activation

- explicit owner-approved activation gate;
- verified V1 -> V2 switch;
- health and functional acceptance;
- verified V2 -> V1 rollback;
- only then update active version and Telegram production entry if required;
- no GitHub Actions.

### Package 12 — completion and documentation

- close all accepted P0/P1 corrections;
- document any deliberately deferred future modules separately;
- update application handoff and knowledge status;
- record exact production and rollback state;
- declare 100% only when implementation, integration, security, compatibility and controlled activation acceptance are all complete.

## Non-negotiable invariants

- V1 remains available and operational until controlled activation is accepted.
- Production `index.html`, active version and BotFather URL are not changed during ordinary implementation packages.
- Firestore is the only persistence layer; no localStorage/sessionStorage/IndexedDB for user or layout data.
- Firebase custom-token authentication remains unchanged.
- `fbDb` is initialized only after `signInWithCustomToken` succeeds.
- Existing collections, document IDs and fields are not renamed or deleted during UI migration.
- Demo, countdown, subscription, payment-by-transfer, points, `awardPoints()`, anti-duplicate rewards and `new_contact` behavior are preserved.
- Existing advanced Path / Life Map is preserved.
- Logout never deletes data.
- No GitHub Actions.

## Exact next action

Begin package 1:

**isolated V2 shell + route registry + back stack + shared state components**

Continue autonomously from that point through the completion sequence above, creating evidence-backed checkpoints in both repositories.
