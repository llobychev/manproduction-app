# MenClub Main App V2 — Package 7 Lyova

Date: 2026-08-01

Status: implemented and validated for the no-runtime boundary; production activation not performed

Baseline main: `6ee2b2df215dc7529ca6e26578298c38c8adf229`. Active/fallback remain V1.

Implemented: real Chat/Recommendations/History/Actions tabs; local composer state; loading/error/retry states; disabled voice `Скоро`; recommendations to real routes; honest empty history; side-effect preview and confirmation; confirmed runtime requirement for replies/actions.

Without an approved runtime, a user message is marked unsaved, no assistant reply is invented, history remains empty and actions report that nothing was executed. No chat text is written or sent to analytics.

Validation: JavaScript syntax, diff check and 39/39 tests passed. No physical dialog schema, local persistence, production change or GitHub Actions.

Progress: Packages 1–7 complete within approved boundaries; overall restructure approximately 82%.

Next: Package 8 — Cabinet and Public Profile.
