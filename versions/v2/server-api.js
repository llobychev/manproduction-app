export const MAIN_APP_API_BASE = 'https://llobychev-manproduction-networking-server-0fdf.twc1.net';

export class MainAppApiError extends Error {
  constructor(code, message, status = 0, cause) {
    super(message, { cause });
    this.name = 'MainAppApiError';
    this.code = code;
    this.status = status;
  }
}

export function createMainAppServerApi({ firebaseUser, fetchImpl = fetch, baseUrl = MAIN_APP_API_BASE, timeoutMs = 15000 }) {
  if (!firebaseUser?.uid || typeof firebaseUser.getIdToken !== 'function') throw new MainAppApiError('identity_missing', 'Подтверждённый пользователь недоступен');
  const request = async (path, body = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      const token = await firebaseUser.getIdToken();
      response = await fetchImpl(`${baseUrl}${path}`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body:JSON.stringify(body),
        signal:controller.signal
      });
    } catch (error) {
      const code = error?.name === 'AbortError' ? 'api_timeout' : 'api_network';
      throw new MainAppApiError(code, code === 'api_timeout' ? 'Сервер не ответил вовремя' : 'Нет связи с сервером', 0, error);
    } finally { clearTimeout(timeout); }
    let payload;
    try { payload = await response.json(); }
    catch (error) { throw new MainAppApiError('api_response', 'Сервер вернул некорректный ответ', response.status, error); }
    if (!response.ok || payload?.ok !== true) throw new MainAppApiError('api_rejected', payload?.error || `Сервер вернул ${response.status}`, response.status);
    return payload;
  };
  return Object.freeze({
    uid:String(firebaseUser.uid),
    ensureDemo:() => request('/app/v2/access/ensure-demo'),
    setDailyQuest:(questId, done) => request(`/app/v2/quests/${encodeURIComponent(questId)}/state`, { done:Boolean(done) })
  });
}
