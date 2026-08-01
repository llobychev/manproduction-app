const context = {
  lifecycle: 'booting',
  firebaseUser: null,
  fbDb: null,
  fbStorage: null,
  access: null
};

export function getRuntimeContext() {
  return Object.freeze({ ...context });
}

export function setLifecycle(lifecycle) {
  context.lifecycle = lifecycle;
}

export function setAuthenticatedRuntime({ user, db, storage }) {
  if (!user || !db) throw new Error('Authenticated Firebase user and Firestore are required');
  context.firebaseUser = user;
  context.fbDb = db;
  context.fbStorage = storage || null;
}

export function setAccessContext(access) {
  context.access = access;
}

export function resetRuntimeContext() {
  context.lifecycle = 'booting';
  context.firebaseUser = null;
  context.fbDb = null;
  context.fbStorage = null;
  context.access = null;
}
