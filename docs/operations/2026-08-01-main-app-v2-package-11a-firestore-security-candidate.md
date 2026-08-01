# Main App V2 Package 11A — Firestore Rules candidate

Baseline application main: `559844ac1cd39431a11c6608e9c60ffdd8a4a845`.

## Outcome

The repository now contains a deployable-format, default-deny Firestore Rules candidate and an executable emulator matrix. This is the first managed Rules source in the audited application repository. It is intentionally **not** described as the source currently deployed to production.

The candidate preserves the audited V1 collection identities while enforcing owner document identity, cross-user denial, immutable privileged subscription/access fields, server-owned entitlement and reward state, admin permission checks, admin self-escalation denial, analytics identity binding and a final default deny. It does not authorize any new V2-only collection.

## Known compatibility blockers requiring backend migration

The audit found unsafe historical client behavior that a production Rules deployment must not preserve:

- V1 reads the entire `users` collection to build a membership badge, while secure Rules allow a member to read only his own private profile. A separate member-safe directory is required.
- V1 and the current V2 access shell can grant `demoAccessUntil` from the browser. Entitlements must be written by a verified backend.
- V1 mirrors arbitrary leaderboard and challenge progress from browser-owned state. Reward-bearing progress must be validated and written transactionally by a backend.
- V1 stores personal habit state and reward totals together in `user_data.habits`; V2 daily quests also mutate reward fields there. Personal inputs and server-owned reward balances require separate validated paths.

The candidate intentionally denies these unsafe writes. Deploying it before the backend migrations would break those V1 behaviors, so this package is evidence and a security target, not activation authorization.

## Evidence included

- `firestore.rules` and `firebase.json`;
- Firestore Emulator configuration isolated to project `manproduction-club-rules-test`;
- owner, other-user, unauthenticated, admin-permission, malformed-field, team-captain, analytics and unknown-collection tests;
- static verification that the V1 surface is covered and unreviewed V2 state remains absent;
- Package 10 verification remains fail-closed: the adapter revision allowlist is empty and external activation gates are blocked.

## Mandatory external recovery before deployment

1. Export or otherwise identify the Rules text actually deployed to Firebase project `manproduction-club`.
2. Record its immutable hash/revision and compare it line-by-line with this candidate.
3. Implement backend-owned demo entitlement, reward/leaderboard/challenge progress and member-safe directory paths.
4. Audit server/Admin SDK and Admin Mini App behavior, especially `admin_users`, subscription, demo, news, challenge, task and promo mutations.
5. Run the negative matrix against the exact deployment candidate in the emulator.
6. Perform a controlled Rules deploy with a saved rollback source and revision.
7. Repeat owner/other/unauthenticated/malformed tests against the deployed revision without touching real user records.

Until all seven items are proven, `APPROVED_SECURITY_REVISIONS` remains empty, V2 feature adapters remain disabled, `activeVersion` and `fallbackVersion` remain `v1`, and production data, BotFather and Firebase deployment are untouched.
