# Main App V2 Package 11B — server-owned demo and rewards

Baseline application main: `3104f2f3cb3d747687ff725c322b31c03351929d`.
Baseline networking-server main: `14b7d061e329c47a604d8bf3e22639c11ecf7410`.

## Outcome

V2 no longer grants demo access or mutates reward-bearing quest state directly in Firestore. Both mutations cross one authenticated server API boundary using a Firebase ID token minted through `/auth/app`. The backend contract requires the `main_app` contour, derives the uid from the verified token and ignores any client identity.

The demo grant is transactional and idempotent. An existing paid subscription, free perk or historical demo is never replaced or extended. A first grant preserves the accepted 21-day duration.

Daily quest reward points are loaded from the server-side `daily_quests` document or the three preserved fallback quest definitions. The client sends only the quest id and desired boolean state. A first reward additionally requires a trusted server-side completion-evidence verifier; missing or negative evidence fails closed before any write. The balance source is a server-only `reward_balances/{uid}` document created by controlled migration, never legacy client-owned `user_data.habits.points`. After verification, the authoritative balance and the compatibility mirrors are updated in one Firestore transaction, and `awarded` prevents duplicate reward issuance after uncheck/recheck.

## Explicit boundaries

- This package does not deploy the server or Firestore Rules.
- V1 remains byte-identical and active.
- The V2 adapter security allowlist remains empty.
- Challenge progress remains server-owned and disabled until a trusted completion event exists.
- No production completion-evidence verifier is selected in this package, so reward activation remains blocked.
- `reward_balances` backfill is not run in this package; missing migration state fails closed.
- The member-safe directory migration remains pending.
- Emulator and exact deployed-Rules evidence remain mandatory before activation.
