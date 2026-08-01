# Main App V2 — Data Adapter Security Gate

Date: 2026-08-01

Status: Package 11B server-owned demo/reward boundary implemented in code. New physical domain adapters remain disabled because the authoritative deployed Firestore Rules revision is still unproven.

## Audit result

A deployable-format `firestore.rules` candidate and emulator matrix now exist in `manproduction-app`. They are not evidence of the Rules actually deployed to production. Client UI code and a repository candidate cannot prove production authorization by themselves.

## Accepted adapter envelope

All V2 adapters must be supplied through one `window.MENCLUB_V2_ADAPTERS` registry entry:

- `adapter`: the domain implementation;
- `security.contractVersion`: exact supported gate version;
- `security.rulesRevision`: immutable deployed Rules or backend-policy revision;
- `security.ownerScoped: true`;
- `security.serverValidated: true`;
- `security.backwardCompatibleV1: true`;
- `security.rollbackReady: true`.

The claimed revision must also match the domain's exact compile-time allowlist entry. The production allowlist is intentionally empty until a deployed policy revision is identified and tested; a self-asserted browser value cannot approve itself. Missing, partial, stale, unapproved or unknown-domain entries are rejected and the domain remains fail closed. Legacy individual `window.MENCLUB_V2_*_ADAPTER` globals are not an activation path.

## Domain inventory

| Domain | Existing read source | Proposed additive logical state | Required enforcement before enablement |
|---|---|---|---|
| Events | V1 personal schedule mirror only | catalog + authenticated member attendance | organizer-only catalog, server-side capacity/deadline, member identity from auth |
| Path | V1 in-memory catalog, no authoritative progress | completion IDs, reward IDs, bookmarks, XP/MC | sequential unlock, atomic reward dedupe, bounded values, owner isolation |
| Widgets | fixed V2 catalog | versioned ordered layout | owner isolation, fixed IDs/sizes/count, rollback-compatible version |
| Profile | `users/{uid}`, `user_data/{uid}` | public fields + field visibility | never-public field denial, owner-only edit, member-only read |
| Lyova runtime/actions | no approved persistent runtime | confirmed reply/action envelope | consent, data minimization, side-effect confirmation, server authorization |

Physical collection names remain unselected until the Rules-owning repository and deployment revision are identified. This avoids creating a schema that cannot be enforced or rolled back safely.

## Server-owned V2 writes

V2 has no direct demo or reward-bearing Firestore writes. Package 11B moves default demo creation and daily-quest reward mutation behind an authenticated server API. The server derives uid from the verified Firebase ID token, requires the `main_app` contour, chooses quest points from server-owned definitions and transactionally deduplicates rewards. The adapter allowlist remains empty for the other domains.

## Activation blocker

Package 11B cannot declare production security complete until the server module is merged and tested in its own repository, the exact deployed Firestore Rules source/revision is identified, and every path is validated with authenticated owner, other-user, unauthenticated and malformed-field tests. V1 client writes, challenge progress and the shared member directory also require migration before the candidate Rules can be deployed.
