# Main App auth endpoint migration

Status: draft; production code is unchanged.

## Required code change

In `index.html`, inside `firebaseAuth`, replace:

```js
xhr.open('POST', AUTH_SERVER + '/auth', true);
```

with:

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

1. Deploy backend with `/auth/app` while keeping legacy `/auth`.
2. Smoke-test `/auth/app`.
3. Merge this client endpoint migration.
4. Verify app launch, profile load, personal data, events and analytics.
5. Keep legacy `/auth` until both clients are migrated.
