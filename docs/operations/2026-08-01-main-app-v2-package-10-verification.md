# Main App V2 Package 10 — Verification report

Baseline: application main `6ef498fe4b363d070ed142128e029a179aa68f8f`.

## Automated acceptance

The repository verifies JavaScript syntax and the complete V2 contract suite. Package 10 adds immutable hashes for the V1 production entry, active/fallback manifest and V1 wrapper; a strict direct-write allowlist; browser-storage and network-boundary checks; responsive safe-area/breakpoint checks; and a machine-readable separation between automated and external evidence.

Automated gates cover routes/back stack, Telegram BackButton, auth fail-closed behavior, access classes, payment no-false-success, quest reward deduplication, fail-closed feature adapters, public-profile privacy, logout/reset boundaries, empty security revision allowlist, persistence restrictions, responsive shell and V1 immutability.

## External evidence — not passed automatically

- authoritative deployed Firestore Rules source/revision: blocked;
- negative Rules authorization tests: blocked;
- real Telegram device responsive proof: pending;
- controlled paid/demo/expired accounts: pending;
- owner-approved V1 -> V2 -> V1 rollback: pending;
- explicit owner activation approval: pending.

Package 10 therefore improves verified readiness but does not authorize Package 11 activation and does not change `activeVersion`, production, Firebase data, BotFather or GitHub Actions.
