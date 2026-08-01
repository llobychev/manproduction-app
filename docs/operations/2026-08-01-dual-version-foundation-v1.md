# MenClub Main App — dual-version foundation v1

Date: 2026-08-01  
Repository: `llobychev/manproduction-app`  
Source main: `d180273bf8fc21a306d1dd00e03ea08b577c5426`

## Objective

Keep the current production application permanently available while building the new six-tab application independently and allowing explicit V1/V2 switching at any construction stage.

## Version model

### V1 Stable

- Entry: `versions/v1/index.html`
- Source commit: `abbab1139e4eeeea40f977ab4e34753ee0ace103`
- Role: immutable pre-restructure application
- Rollback branch: `safety/main-app-pre-restructure-2026-08-01`

### V2 Development

- Entry: `versions/v2/index.html`
- Current target: `prototype-alexey.html`
- Role: independently evolving six-tab application

### Launcher

- Entry: `app.html`
- Manifest: `versions/active.json`
- Default active version: `v1`
- Explicit override: `app.html?version=v1` or `app.html?version=v2`
- Failure fallback: `v1`

## Safety boundary

- Root production `index.html` remains unchanged.
- No Firestore schema changes.
- No user data migration.
- No Telegram BotFather URL change.
- No GitHub Actions.
- V1 and V2 can be opened directly without changing the active manifest.

## Future activation procedure

1. Complete and verify V2 independently.
2. Point Telegram Mini App to `app.html` only after a controlled acceptance test.
3. Change `versions/active.json.activeVersion` from `v1` to `v2` to activate globally.
4. Restore `v1` in the manifest for immediate rollback.
5. The launcher must always retain hard fallback to V1.

## Direct browser entries

- Version selector: `/versions.html`
- Launcher default: `/app.html`
- Force V1: `/app.html?version=v1`
- Force V2: `/app.html?version=v2`
- Direct V1: `/versions/v1/index.html`
- Direct V2: `/versions/v2/index.html`
