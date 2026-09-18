# V0.1 reconstruction inventory — 2026-09-19

This inventory is the gate for the next development blocks. Classification is based on current V0.1 code and the preserved working V1 source.

| Surface | Status | Existing source / rule | Next action |
|---|---|---|---|
| Telegram/Firebase auth | REAL | Telegram initData → backend custom token → Firebase | keep |
| Access/demo | REAL | users + roulette_active_perks / server access API | keep |
| Finance widget | REAL READ / LEGACY ROUTE | user_data.finance | reconstruct full finance UI later; no new schema |
| Tasks widget | REAL READ | user_data.schedules + events | reuse |
| Calendar widget | REAL READ | user_data.schedules + events | reuse |
| Goals | REAL LEGACY DATA | user_data.goals; V1 shape {id,title,sphere,deadline,steps,createdAt} | surface in new Path without translating into fake chapter completion |
| Widget layout | REAL DEFAULT / NO PERSISTED V1 SCHEMA | V1 had no widget-layout schema | default read adapter now enabled; writes stay disabled |
| Path chapter progress | PLACEHOLDER MODEL | new V2 chapter model has no proven V1 equivalent | do not write until mapping/decision |
| Lyova chat runtime | DISABLED | no approved runtime connected | review existing backend/solutions before build |
| Lyova actions | DISABLED | no approved action runtime | same |
| Onboarding presentation | PARTIAL | V1 registration completion is existence of users/{uid} with first/registeredAt; old quiz was registration flow | preserve registration; design durable presentation marker only after deciding how to avoid replay for existing users |
| Contacts / mind / habits / events etc. widgets | PARTIAL/PLACEHOLDER | mechanics exist in V1 user_data fields and legacy UI | reconstruct one-by-one |
| Visual design | PROVISIONAL | compact V1 language | later pass |

## Confirmed V1 persistence

Profile/registration:
- `users/{uid}`
- registration creates `first,last,fullName,initials,tgUsername,name,registeredAt`

Main user payload:
- `user_data/{uid}`
- `journal`
- `positivity`
- `contacts`
- `schedules`
- `finance`
- `personal`
- `habits`
- `challengesProgress`
- `goals`
- `recurringPayments`
- `debts`
- `savings`
- `questsDone`

Other confirmed V1 collections include `events`, `news`, `leaderboard`, challenge-related collections and cycle data.

## Rule

No new persistent field is allowed merely to make a V0.1 screen work. First prove that no suitable V1 field/collection exists. New persistence requires an explicit schema/security decision.
