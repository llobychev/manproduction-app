import { MAIN_APP_API_BASE, createMainAppServerApi } from './server-api.js';

export const AUTH_SERVER = MAIN_APP_API_BASE;

export const FIREBASE_CONFIG = Object.freeze({
  apiKey: 'AIzaSyD195j33cTr6labXodSH_jTeZsvs4L3U4w',
  authDomain: 'manproduction-club.firebaseapp.com',
  projectId: 'manproduction-club',
  storageBucket: 'manproduction-club.firebasestorage.app',
  messagingSenderId: '962650441642',
  appId: '1:962650441642:web:1be30d07d1ca62058c0dd3'
});

export class AuthenticationError extends Error {
  constructor(code, message, cause) {
    super(message, { cause });
    this.name = 'AuthenticationError';
    this.code = code;
  }
}

function initializeFirebaseApp(firebase) {
  if (!firebase?.initializeApp || !firebase?.auth) throw new AuthenticationError('firebase_unavailable', 'Firebase SDK недоступен');
  if (!firebase.apps?.length) firebase.initializeApp(FIREBASE_CONFIG);
}

export async function authenticateTelegram({ firebase, telegram, fetchImpl = fetch, timeoutMs = 15000 }) {
  const initData = telegram?.initData;
  if (!initData) throw new AuthenticationError('telegram_required', 'Открой приложение внутри Telegram');
  initializeFirebaseApp(firebase);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetchImpl(`${AUTH_SERVER}/auth/app`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
      signal: controller.signal
    });
  } catch (error) {
    const code = error?.name === 'AbortError' ? 'auth_timeout' : 'auth_network';
    throw new AuthenticationError(code, code === 'auth_timeout' ? 'Сервер авторизации не ответил вовремя' : 'Нет связи с сервером авторизации', error);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) throw new AuthenticationError('auth_server', `Сервер авторизации вернул ${response.status}`);
  let payload;
  try { payload = await response.json(); }
  catch (error) { throw new AuthenticationError('auth_response', 'Некорректный ответ сервера авторизации', error); }
  if (!payload?.token) throw new AuthenticationError('token_missing', 'Сервер не вернул токен доступа');

  let credential;
  try { credential = await firebase.auth().signInWithCustomToken(payload.token); }
  catch (error) { throw new AuthenticationError('firebase_sign_in', 'Не удалось подтвердить доступ Firebase', error); }

  const user = credential?.user || firebase.auth().currentUser;
  if (!user?.uid) throw new AuthenticationError('firebase_user_missing', 'Firebase не вернул пользователя');

  // The database boundary is deliberately crossed only after custom-token sign-in succeeds.
  const db = firebase.firestore();
  const storage = typeof firebase.storage === 'function' ? firebase.storage() : null;
  const serverApi=createMainAppServerApi({ firebaseUser:user, fetchImpl });
  return Object.freeze({ user, db, storage, serverApi });
}
