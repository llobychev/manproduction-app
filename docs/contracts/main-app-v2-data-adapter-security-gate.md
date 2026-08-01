# Main App V2 — Data Adapter Security Gate

Date: 2026-08-01

Status: Package 9 client gate implemented. New physical write adapters remain disabled because the authoritative Firestore Rules source/revision is not available in the audited repositories.

## Audit result

No deployable `firestore.rules` or equivalent authoritative Rules source was found in `manproduction-app`, `manproduction-networking-server`, or `manproduction-admin`. Client UI code cannot prove authorization by itself.

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

## Existing V1-compatible client writes

V2 currently reuses two pre-existing logical write paths: default demo merge in `roulette_active_perks/{uid}` and transactional daily-quest state in `user_data/{uid}`. Package 9 does not rename or duplicate them. Their current deployment Rules still require external evidence before controlled V2 activation.

## Activation blocker

Package 9 cannot declare production security complete until the owner provides or identifies the deployed Firestore Rules source and revision, then validates every path with authenticated owner, other-user, unauthenticated and malformed-field tests.
