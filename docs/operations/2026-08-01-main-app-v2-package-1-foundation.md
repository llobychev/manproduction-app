# MenClub Main App V2 — Package 1 foundation

Date: 2026-08-01

Status: implemented and locally validated; production activation not performed

## Baseline

- Repository: `llobychev/manproduction-app`
- Baseline main: `57deda3a98bfefb5783bbc1327ea33409c65744d`
- Active version: `v1`
- Fallback version: `v1`
- Frozen contract: `docs/contracts/main-app-v2-ui-contract.md`

## Implemented

- isolated V2 shell at `versions/v2/index.html`;
- complete route registry with 65 routes and mandatory metadata;
- six root tabs and parent-tab mapping;
- session-only navigation stack and root-tab scroll restoration;
- repeated active-tab tap returns the root screen to the top;
- Telegram BackButton integration boundary without requiring the SDK outside Telegram;
- `new_contact -> widgets.contactNew` deep-link mapping;
- bottom-nav hiding for payment and critical confirmation routes;
- shared lifecycle, content and action state registries;
- shared loading, empty, error, stale, offline, locked, paywalled and disabled rendering;
- confirmation dialog with critical close policy, focus trap and focus restoration;
- action controller that deduplicates taps while an action is working;
- safe placeholder surfaces that do not claim unimplemented business actions succeeded.

## Files

- `versions/v2/index.html`
- `versions/v2/styles.css`
- `versions/v2/routes.js`
- `versions/v2/navigation.js`
- `versions/v2/state-components.js`
- `versions/v2/app.js`
- `test/v2-foundation.test.mjs`

## Validation

Passed:

```text
node --check versions/v2/app.js
node --check versions/v2/routes.js
node --check versions/v2/navigation.js
node --check versions/v2/state-components.js
node --test test/v2-foundation.test.mjs
git diff --check
```

Test result:

```text
tests 8
pass 8
fail 0
```

The tests confirm route metadata, root mapping, payment/critical navigation behavior, system-state registries, back-stack behavior, optional Telegram BackButton support, escaped shared-state output, write-tap deduplication and absence of persistence/auth/activation code.

## Safety evidence

- `index.html` production entry unchanged;
- `app.html` launcher unchanged;
- `versions/active.json` unchanged;
- `versions/v1/index.html` unchanged;
- no Firebase SDK or Firestore API was added to Package 1;
- no localStorage, sessionStorage or IndexedDB was added;
- no business write or schema change was added;
- no BotFather, production URL or Telegram production entry was changed;
- no GitHub Actions were used.

## Completion effect

- Package 1: 100% implemented and validated.
- Production V2 implementation: foundation slice complete; screen/data packages remain.
- Overall Main App V2 restructure: approximately 62%.

## Exact next package

Package 2 — authentication and access shell:

- boot/auth lifecycle;
- preserve the existing custom-token flow;
- initialize `fbDb` only after successful authentication;
- paid, free-perk, active-demo, expired-demo and feature-lock states;
- countdown banner;
- payment route shell and payment-by-transfer preservation;
- no production activation.
