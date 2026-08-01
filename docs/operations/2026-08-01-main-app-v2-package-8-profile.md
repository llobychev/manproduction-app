# Main App V2 Package 8 — Cabinet and Public Profile

Implemented from the exact Package 7 merged main.

## Included

- cabinet identity, level/points and access summary;
- all contracted account/settings/club/support routes;
- subscription source and expiry without placeholder personal contacts;
- authenticated own public-profile preview with conservative visibility defaults;
- public edit/preview/save flow that remains fail closed until schema/rules approval;
- member-share disabled until a safe member route exists;
- logout confirmation that retains data;
- separate double-confirm data reset boundary;
- `Образ и примерка` marked `Скоро`.

## Safety

- reads reuse `users/{uid}` and `user_data/{uid}`;
- no new Firestore collection or physical profile write was introduced;
- email, phone, payment, privacy, security, journal, finance, health and pets never enter public preview;
- V1 remains active and fallback;
- production activation and GitHub Actions remain untouched.
