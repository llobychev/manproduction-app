# MenClub V0.1 — live production checkpoint

Date: 2026-09-19
Status: LIVE CHECKPOINT / CONTINUE FROM HERE

## Live acceptance
V0.1 now opens successfully inside the real Telegram Mini App `@games_lis_bot`.
Confirmed live shell: **Лёва / Путь / Виджеты**.
Current visual treatment is only a temporary working state, not the final approved visual design.

## Production launch chain
```text
@ games_lis_bot (ManClub in Siberia)
Menu «Открыть клуб»
→ https://t.me/games_lis_bot/ManProduction
→ Direct Link ManProduction
→ https://llobychev.github.io/manproduction-app/index.html
→ ./versions/v2/index.html
```

GitHub Pages:
- repo: `llobychev/manproduction-app` (currently PUBLIC)
- source: Deploy from a branch
- branch/folder: `main / (root)`
- HTTPS enforced; no custom domain
- workflow: dynamic `pages build and deployment`
- successful cache-bust deploy commit: `b1f7e80f76bac40448cc4223a29b93be53128ab9`
- successful Pages run: `35366464307`

Release chain:
- PR #28 merge: `547276758a55fb29cd61269753fc43ab3efb7c5e`
- production launcher: `aabbc15bc9cbd21a2c59eadddb9ddcbe81580c72`
- active manifest V2: `f533bd8462a1ce6f730794afc472b3c716152911`
- compact visual correction: `0e64b26f3adec1ef639d101e3dbfb9920bc8395d`
- demo/loading correction: `cdd513fd7fc4a878fca76a75899ad346fd53d5ca`
- asset cache-bust: `b1f7e80f76bac40448cc4223a29b93be53128ab9`

Rollback: `versions/v1/index.html`; `versions/active.json.fallbackVersion=v1`.

## What is connected
V0.1 is not a blank standalone prototype. It already uses existing Telegram/Firebase bootstrap and existing-data adapters:
- Telegram `initData` → server auth → Firebase custom token.
- Auth endpoint: `https://llobychev-manproduction-networking-server-0fdf.twc1.net/auth/app`.
- Firestore remains authoritative persistence.
- access reads `users/{uid}` + `roulette_active_perks/{uid}`.
- existing V1 sources include `user_data/{uid}`, schedules/events and finance.
- Finance widget → existing `user_data.finance`.
- Tasks/Calendar → existing `user_data.schedules + events`.
- Existing goals are preserved/reused; no parallel goal schema.

## Not fully connected / intentionally incomplete
Do not call V0.1 feature-complete.
- Lyova AI runtime is not connected; it fails closed without an approved runtime.
- Lyova history/actions persistence and side effects are incomplete.
- Widget layout persistence has no approved production write adapter/schema; default layout works, writes fail closed.
- Path preserves legacy mechanics/data, but the new Path catalog/progress write flow is not fully production-integrated.
- Several widget catalog entries remain navigation/product placeholders pending reconstruction of existing mechanics.
- Five-card onboarding exists as forced preview, but durable first-login wiring must reuse existing V1 registration/questionnaire completion state; do not invent browser persistence or a new Firestore field.
- Visual design is provisional and will be revisited later.

## Reconstruction rule
This is reconstruction of the working MenClub app, not a greenfield rewrite.
For each next block: find V1 mechanic/data → reuse fields/IDs/business logic → move/reframe into Лёва/Путь/Виджеты → keep legacy hidden until verified → avoid parallel schemas → live-test in Telegram.

## Immediate continuation
1. Inventory V0.1 screen-by-screen: real / partially wired / placeholder.
2. Finish real data wiring for the three V0.1 surfaces without schema duplication.
3. Wire durable onboarding from existing registration completion source.
4. Review existing solutions/runtime before connecting Lyova.
5. Finish widget layout persistence only after reuse/schema+Rules decision.
6. Live Telegram acceptance.
7. Separate later visual redesign pass.

## Repository privacy
`llobychev/manproduction-app` is PUBLIC while production is served from its GitHub Pages. Do not switch to Private blindly. First verify private-Pages support for the account or move public static deployment elsewhere.
