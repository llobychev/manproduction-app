# MenClub Main App V2 — Package 2 authentication and access shell

Date: 2026-08-01

Status: implemented and locally validated; production activation not performed

## Baseline

- Repository: `llobychev/manproduction-app`
- Baseline main: `bbddbf4ee21be652c6f0aea348b1be7a016c40f6`
- Package 1: merged and validated
- Active version: `v1`
- Fallback version: `v1`

## V1 contracts preserved

- auth endpoint: `https://llobychev-manproduction-networking-server-0fdf.twc1.net/auth/app`;
- request body: Telegram `initData`;
- Firebase custom-token sign-in;
- paid access: `users/{uid}.subscriptionUntil`;
- free perk: `roulette_active_perks/{uid}.freeSubscriptionUntil`;
- demo: `roulette_active_perks/{uid}.demoAccessUntil`;
- default demo duration: 21 days;
- default demo grant uses the existing field with `{ merge: true }`;
- payment plans and ruble amounts;
- payment by bank-card transfer followed by a Telegram message and receipt to the manager;
- manual access confirmation after transfer.

## Implemented

- explicit boot, authenticating, loading-core-data, ready, offline-ready, auth-error and fatal-error lifecycle;
- retry and V1 fallback on authentication failure;
- Telegram `ready()` and `expand()` boundary;
- Firebase app initialization followed by fail-closed custom-token authentication;
- Firestore and Storage initialization only after successful `signInWithCustomToken`;
- authenticated runtime context that rejects a database without a Firebase user;
- access snapshot adapter for existing users and roulette perks;
- deterministic priority: paid -> free perk -> active demo -> expired demo -> new-user default demo;
- demo countdown banner;
- expired-demo allowlist and paywall redirection;
- plan selection, transfer instructions and explicit manager-contact confirmation route;
- no simulated payment success;
- payment success route remains non-successful until a confirmed external result exists.

## Validation

Passed:

```text
node --check versions/v2/app.js
node --check versions/v2/auth.js
node --check versions/v2/access.js
node --check versions/v2/payment.js
node --check versions/v2/runtime-context.js
node --test test/v2-foundation.test.mjs test/v2-access-shell.test.mjs
git diff --check
```

Result:

```text
tests 16
pass 16
fail 0
```

The tests include explicit proof that failed or missing Telegram/Firebase authentication does not initialize Firestore.

## Safety evidence

- V1 source unchanged;
- production `index.html`, `app.html` and `versions/active.json` unchanged;
- no collection, document identity or existing field was renamed or deleted;
- the only write is the already-existing backward-compatible default-demo merge write;
- no localStorage, sessionStorage or IndexedDB was added;
- payment is never shown as successful without confirmation;
- no BotFather, production URL or Telegram production entry was changed;
- no GitHub Actions were used.

## Completion effect

- Package 1: 100%.
- Package 2: 100% implemented and validated.
- Overall Main App V2 restructure: approximately 65%.

## Exact next package

Package 3 — Home:

- greeting and authoritative progress summary;
- continue Path;
- daily quest;
- nearest event;
- Lyova recommendation;
- schedule;
- news;
- points, level and streak;
- shared loading, empty and error states;
- no new physical schema and no production activation.
