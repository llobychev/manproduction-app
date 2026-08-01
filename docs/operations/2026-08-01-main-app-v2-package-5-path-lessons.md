# MenClub Main App V2 — Package 5 Path and Lessons

Date: 2026-08-01

Status: implemented and locally validated for the approved data boundary; production activation not performed

## Baseline

- Application main: `4d171a02c761105f1e6a9b55d79af6555f0cbfc0`
- Active version: `v1`
- Fallback version: `v1`

## Implemented

- preserved five-sphere advanced Life Map;
- preserved fourteen V1 routes and eight chapters per route;
- Path root with total progress, XP, sphere progress and shared continuation;
- sphere, route/chapter, lesson, locked-reason, history and bookmarks screens;
- sequential unlocking with explicit reason;
- Home uses the same Path continuation and progress source;
- logical completion/bookmark adapter;
- confirmed-state requirement and repeated-completion deduplication;
- read-only/disabled states when persistence is unavailable.

## Evidence-backed boundary

- V1 `mcPathState` is in-memory only and is never loaded/saved through Firestore.
- V1 chapter XP/MC is session-only.
- the old Lessons screen marks the first two items complete by index, not user data.
- Package 5 does not convert those simulated states into persistent history.
- no new physical schema or Firestore write was introduced.
- detailed lesson content remains behind a separate content adapter; the full route/chapter topology is preserved now.

## Validation

```text
node --check versions/v2/path.js
node --check versions/v2/app.js
node --test test/v2-foundation.test.mjs test/v2-access-shell.test.mjs test/v2-home.test.mjs test/v2-events.test.mjs test/v2-path.test.mjs
git diff --check
```

## Safety

- V1 and production entry unchanged;
- active/fallback remain V1;
- no migration from static or session-only completion;
- no unconfirmed XP or bookmark success;
- no local persistence;
- no GitHub Actions.

## Progress

- Packages 1–5: 100% within their approved current-data boundaries.
- Overall Main App V2 restructure: approximately 75%.

## Exact next package

Package 6 — Widgets: approved vertical layout, Media, real reorder/resize/hide/restore/reset behavior, Firestore-only persistence boundary, and `new_contact` continuation without production activation.
