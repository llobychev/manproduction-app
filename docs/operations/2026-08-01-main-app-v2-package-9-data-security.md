# Main App V2 Package 9 — Data adapters and security

Implemented client-side security gate from application main `a40cc297f2244ce73196e3a19733523fd71c0d5b`.

## Completed

- full V2 read/write surface inventory;
- centralized adapter registry for Events, Path, Widgets, Profile and Lyova;
- immutable proof envelope with Rules/backend revision, ownership, server validation, V1 compatibility and rollback requirements;
- rejection of missing, partial, stale and legacy individual adapter injection;
- explicit documentation of the two preserved V1-compatible client write paths;
- logical additive schemas and per-domain server/rules requirements.

## Still blocked

No authoritative deployable Firestore Rules source was found in the audited repositories. Therefore no new physical V2 collection, write adapter, member-share route or destructive reset is enabled. Controlled activation cannot claim security acceptance until the deployed Rules source/revision is identified and tested.

V1 remains active and fallback. Production, Firebase data, BotFather and GitHub Actions are untouched.
