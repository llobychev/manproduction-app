# New contact deeplink — demo access production investigation

Date: 2026-07-20
Status: unresolved

## Actual production result

The Telegram button **«Добавить контакт →»** opens the Main Mini App normally but does not open the new-contact modal.

The result was reproduced by Alexey on a demo-access account after PR #3 and PR #4 were merged.

## Already implemented

- Resolve `new_contact` from Telegram `start_param`.
- Resolve `new_contact` from URL `startapp`.
- Resolve `new_contact` from URL `tgWebAppStartParam`.
- Execute `handleStartParam()` after `launchApp()` in the saved-user boot path.

## Primary hypothesis

The demo-access boot contour does not pass through the same saved-user branch, so the handler is never executed at the point where the main UI is ready.

## Required implementation rule

Deep-link intent processing must be centralized and idempotent. It must execute after the app reaches a ready state regardless of:

- demo access;
- paid access;
- first-run onboarding;
- restored local/Firestore state;
- asynchronous authentication timing.

## Acceptance criterion

A real Telegram test must produce:

`button tap → app opens → Network tab active → new-contact modal visible`.

Code presence, merged PRs, and syntax checks are not sufficient without this end-to-end outcome.
