# Main App V2 — Widget layout contract

Date: 2026-08-01

Status: logical editor contract approved; physical Firestore persistence remains disabled

## Catalog

The fixed initial catalog contains: Mind, Contacts, Finance, Habits, Health, Events, Notes, Media and Quick Actions. Unknown widget identities and unsupported sizes are discarded by normalization.

## Logical layout

- `layoutVersion`;
- ordered `items[]` with `widgetId`, `order`, `size`, `hidden`, `settingsVersion`;
- `updatedAt` supplied by the eventual authoritative backend.

The editor keeps separate saved and draft states. Reorder, resize, hide, restore and reset change only the draft. Cancel restores saved state. Navigation away from a dirty editor requires confirmation.

## Persistence gate

No localStorage, sessionStorage or IndexedDB is allowed. A save is successful only after the approved adapter returns `confirmed: true` and the normalized authoritative layout. Until a Firestore schema and Security Rules are reviewed, `window.MENCLUB_V2_WIDGET_ADAPTER` is absent and Save is disabled.

The eventual rules must enforce authenticated ownership, fixed catalog IDs, allowed sizes, bounded item count, layout version, field validation and isolation from other users.

## Route preservation

Existing V1 tool behavior is not deleted. V2 tool routes are adapter boundaries for later compatibility wiring. The mandatory deep link remains `new_contact -> widgets.contactNew`.
