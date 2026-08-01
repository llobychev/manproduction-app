# Main App V2 — Profile Data and Security Contract

Status: Package 8 implementation boundary. Package 9 approval is still required for new writes.

## Existing reads

- `users/{uid}`: identity, Telegram username, subscription fields, points/level display.
- `user_data/{uid}`: existing V1 `personal` and `habits` fields.
- Telegram authenticated user: fallback only for identity/avatar when the corresponding stored field is absent.

## Write boundary

Package 8 does not create a new physical profile collection and does not rename V1 fields.
Profile editing, public visibility saving, member-safe sharing and destructive reset are adapter-gated and fail closed until Package 9 supplies an additive schema and reviewed Firestore Security Rules.

Logout signs out the Firebase session and reloads the application. It never deletes cloud data.

## Public profile

The initial surface is an authenticated member-to-member own preview. No unauthenticated public web route is enabled.

Default visible fields: display name, avatar, level/title and sphere names. Username, city, points, streak, counts, about, exact sphere percentages, friends and social links remain hidden unless explicitly published through a future approved adapter.

Email, phone, subscription/payment data, privacy/security settings, journal, finance, health and pets are never public.

## Destructive reset

The UI keeps reset separate from logout and requires two explicit confirmations. Package 8 stops before deletion and explains that the reviewed deletion contract is not connected. No client-side multi-collection delete is introduced.
