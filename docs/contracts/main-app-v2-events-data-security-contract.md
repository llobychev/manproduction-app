# Main App V2 — Events data and security contract

Date: 2026-08-01

Status: logical adapter contract approved for Package 4; physical Firestore schema and production writes remain disabled

## Existing boundary

The existing `events/{uid_eventId}` documents are a personal schedule mirror created by V1. They are not a club event catalog and are not reused as registrations.

This repository does not contain the authoritative Firestore Security Rules deployment source. Package 4 therefore must not select new collection names or enable a write path here.

## Logical catalog record

The read adapter may return only normalized event records with:

- stable event ID;
- title and optional summary;
- `startsAt`, optional `endsAt`, and timezone;
- format: `online` or `offline`;
- location or online label;
- lifecycle state;
- capacity and remaining seats when authoritative;
- bounded participant preview;
- cancellation deadline and registration conditions.

No stale sample dates are embedded in the production V2 source.

## Logical attendance record

For the authenticated member and one stable event ID, the adapter may expose:

- `available`;
- `registered`;
- `waitlist`;
- `full`;
- `cancelled`;
- `completed` or `archive`.

An attendance change is successful only when the authoritative adapter returns `confirmed: true` together with the resulting normalized event state. A rejected, failed, missing, or unconfirmed result leaves the UI state unchanged.

## Required Security Rules review before physical integration

Before any production write is enabled, the owning backend/rules repository must prove:

1. catalog writes are organizer/admin-only;
2. authenticated members can read only published, audience-eligible events;
3. a member can create, update, or cancel only his own attendance identity;
4. event ID and member UID come from trusted auth/path context, not mutable body fields;
5. capacity, waitlist position, counters and organizer fields cannot be forged by clients;
6. register/cancel operations are idempotent and concurrency-safe;
7. cancellation deadline and event lifecycle are enforced server-side;
8. participant preview exposes only explicitly permitted member fields;
9. analytics contain no contact details or private profile fields;
10. V1 personal schedule documents remain backward-compatible and isolated.

Until those proofs exist, `window.MENCLUB_V2_EVENT_ADAPTER` is absent, the repository reports `writes: false`, and the UI shows an honest disabled state.

## Activation gate

Physical schema naming, indexes, rules deployment, migration/backfill, admin publishing, production reads and production writes belong to Package 9 or a separately reviewed backend package. They are not authorized by this document.
