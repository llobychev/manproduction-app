# Main App auth endpoint migration

Status: ready for production rollout; backend `/auth/app` is deployed on Timeweb.

## Implemented code change

In `index.html`, inside `firebaseAuth`, the legacy endpoint:

```js
xhr.open('POST', AUTH_SERVER + '/auth', true);
```

was replaced with:

```js
xhr.open('POST', AUTH_SERVER + '/auth/app', true);
```

## Required behavior after the change

1. Telegram `initData` is accepted only by the main bot contour.
2. The response contains a Firebase Custom Token.
3. `firebase.auth().signInWithCustomToken(...)` completes successfully.
4. `firebase.auth().currentUser.uid` equals the Telegram user ID.
5. Firestore is initialized only after successful authentication.

## Follow-up hardening

The current client continues after authentication errors. Before strict Firestore Rules are enabled, the app should fail closed in production Telegram mode instead of opening Firestore after a failed token exchange.

## Rollout order

1. Backend with `/auth/app` deployed while keeping legacy `/auth`. ✅
2. Main App endpoint changed to `/auth/app`. ✅
3. Merge this client migration.
4. Verify app launch, profile load, personal data, events and analytics.
5. Keep legacy `/auth` until both Main App and Admin App are migrated.
