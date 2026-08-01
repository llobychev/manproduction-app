# MenClub Main App V2 — Package 4 Events

Date: 2026-08-01

Status: implemented and locally validated for the approved data boundary; production activation not performed

## Baseline

- Application main: `33ddb420b3425525d938fbb6060f537d85bf0186`
- Active version: `v1`
- Fallback version: `v1`

## Implemented

- Events root, nearest-event hero, real filters and empty-result explanations;
- event list, detail and `Мои записи` routes;
- upcoming, registered, waitlist, full, online, offline, cancelled, completed and archive vocabulary;
- participants preview limited to five normalized records;
- registration and mandatory cancellation confirmation routes;
- card navigation and nested attendance actions use separate controls, so clicks do not conflict;
- action deduplication at the interaction boundary;
- adapter-confirmed state replacement only after `confirmed: true`;
- loading, empty, error and disabled states;
- logical catalog/attendance contract and explicit Security Rules checklist.

## Honest current boundary

- `events/{uid_eventId}` remains the V1 personal schedule mirror and is not treated as a catalog.
- No physical catalog or registration collection name is invented in the UI package.
- No Firestore Rules source exists in this repository, so production reads/writes are not enabled.
- With no approved adapter, the screen displays an honest empty/disabled state.
- Register/cancel never reports success without an authoritative confirmed result.
- No dated production fixture is embedded.

## Validation

```text
node --check versions/v2/events.js
node --check versions/v2/app.js
node --test test/v2-foundation.test.mjs test/v2-access-shell.test.mjs test/v2-home.test.mjs test/v2-events.test.mjs
git diff --check
```

## Safety evidence

- V1, production entry, launcher and active manifest unchanged;
- active and fallback remain V1;
- existing collection names, document IDs and fields unchanged;
- no new physical collection or Firestore write;
- no local persistence;
- no GitHub Actions.

## Progress

- Packages 1–4: 100% for their approved current boundaries.
- Overall Main App V2 restructure: approximately 71%.

## Exact next package

Package 5 — Path and Lessons:

- preserve the advanced V1 Path / Life Map;
- connect five active spheres, chapters, lessons, history and bookmarks;
- sequential unlocking and locked reasons;
- authoritative shared continuation/progress with Home;
- preserve XP and anti-duplicate rewards;
- no production activation.
