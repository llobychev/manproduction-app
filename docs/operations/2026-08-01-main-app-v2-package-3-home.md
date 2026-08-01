# MenClub Main App V2 — Package 3 Home

Date: 2026-08-01

Status: implemented and locally validated; production activation not performed

## Baseline

- Application main: `26789b246d8cfbfc86c3805e03c9a6182a081958`
- Active version: `v1`
- Fallback version: `v1`

## Implemented

- authenticated greeting from the existing user document or Telegram identity;
- points from the existing `user_data.habits.points` source with user-field fallback;
- level only when an authoritative existing field is present;
- habit streak calculated from existing `doneDates`;
- daily quests from existing `daily_quests`, with the existing V1 defaults as fallback;
- current-day quest state from existing `user_data.questsDone`;
- transactional quest toggle that preserves other `user_data` fields;
- anti-duplicate reward: removing and re-adding the same completion does not award points twice;
- personal schedule from existing `user_data.schedules` and the existing per-user `events` mirror;
- duplicate schedule mirrors removed in the adapter;
- news preview/list/detail from existing `news` documents;
- loading, empty and error states for Home and its data blocks;
- navigation to Path, quests, schedule and news.

## Deliberately honest states

- Path progress is not invented because V1 `mcPathState` is not persisted in Firestore; Home points to Path and states that the authoritative adapter arrives in Package 5.
- Nearest club event is empty because the personal `events` mirror is not silently reclassified as a club event catalog; the catalog requires the Package 4 schema/security contract.
- Lyova recommendation is disabled because no confirmed Path/AI recommendation source is connected yet.
- Level is shown as unavailable when no authoritative existing field exists; no display-only formula is invented.

## Validation

```text
node --check versions/v2/home.js
node --check versions/v2/app.js
node --test test/v2-foundation.test.mjs test/v2-access-shell.test.mjs test/v2-home.test.mjs
git diff --check
```

Result:

```text
tests 20
pass 20
fail 0
```

## Safety evidence

- V1, production entry, launcher and active manifest unchanged;
- active and fallback manifest assertions remain covered by tests;
- no new physical collection or document schema;
- no existing field renamed or deleted;
- quest write merges only existing `questsDone` and `habits` fields;
- transaction prevents duplicate reward under repeated completion;
- no local persistence;
- no GitHub Actions.

## Progress

- Package 1: 100%.
- Package 2: 100%.
- Package 3: 100% for the approved current data boundary.
- Overall Main App V2 restructure: approximately 68%.

## Exact next package

Package 4 — Events:

- list, filters, detail and `Мои записи`;
- attendance states;
- registration and cancellation confirmations;
- no simulated success;
- explicit additive catalog/registration schema and Security Rules review before any new production write;
- no production activation.
