# Main App V2 — Path progress contract

Date: 2026-08-01

Status: logical contract approved for Package 5; physical persistence and production writes remain disabled

## Evidence from V1

V1 contains an advanced in-memory Life Map with five active spheres, fourteen routes and eight chapters per route. Its `mcPathState` is initialized in JavaScript and is not loaded from or saved to Firestore. Completion adds XP/MC only in memory. The older Lessons screen also renders the first two lessons as completed from a static index rule rather than authoritative user progress.

Package 5 therefore preserves the advanced catalog and interaction model but does not migrate fabricated or session-only completion into persistent state.

## Logical progress model

- `completedChapterIds[]`;
- `rewardedChapterIds[]`;
- `bookmarks[]`;
- `xp`;
- `mc`;
- `updatedAt`.

The model is additive and does not rename existing V1 fields. Physical collection/document/field placement is deferred to Package 9 and the repository that owns Firestore Security Rules.

## Required behavior

- five spheres remain Body, Money, People, Head and Meaning;
- all fourteen V1 routes and eight chapters per route remain addressable;
- chapter one of each route is initially available;
- chapter N unlocks only after chapter N-1 is authoritatively completed;
- Home and Path use the same continuation and total progress model;
- history derives only from confirmed completion IDs;
- bookmarks derive only from confirmed bookmark IDs;
- completion and reward are idempotent for the chapter identity;
- client state changes only after an adapter returns `confirmed: true` and the resulting progress contains the chapter;
- failed/unconfirmed writes leave the displayed progress unchanged.

## Security requirements before persistence

The eventual backend/rules implementation must prove authenticated ownership, allowed chapter IDs, server-side sequential unlock, atomic completion/reward deduplication, bounded numeric increments, immutable reward identities, field-level validation, and isolation from other members' progress.

Until those proofs exist, `window.MENCLUB_V2_PATH_ADAPTER` is absent and the V2 Path is explicitly read-only.
