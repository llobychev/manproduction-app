export const CONTENT_STATE_COPY = Object.freeze({
  loading: ['Загружаем', 'Получаем актуальные данные…'],
  empty: ['Пока пусто', 'Здесь появятся данные, когда они будут доступны.'],
  error: ['Не удалось загрузить', 'Проверь соединение и попробуй ещё раз.'],
  stale: ['Данные могут быть неактуальны', 'Показываем последнюю подтверждённую версию.'],
  locked: ['Раздел закрыт', 'Сначала выполни условие доступа.'],
  paywalled: ['Нужен доступ', 'Посмотри доступные варианты подписки.'],
  disabled: ['Скоро', 'Функция пока недоступна и ничего не изменяет.'],
  offline: ['Нет соединения', 'Сохранение недоступно до восстановления связи.']
});

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

export function renderContentState(state, options = {}) {
  const copy = CONTENT_STATE_COPY[state] || CONTENT_STATE_COPY.error;
  const title = escapeHtml(options.title || copy[0]);
  const message = escapeHtml(options.message || copy[1]);
  const action = options.actionLabel
    ? `<button class="primary-button" type="button" data-state-action>${escapeHtml(options.actionLabel)}</button>`
    : '';
  const busy = state === 'loading' ? '<span class="spinner" aria-hidden="true"></span>' : '';
  return `<section class="state-card state-${escapeHtml(state)}" data-content-state="${escapeHtml(state)}">${busy}<h2>${title}</h2><p>${message}</p>${action}</section>`;
}

export class ActionController {
  constructor(executor) {
    this.executor = executor;
    this.state = 'idle';
    this.pending = null;
  }

  async run(payload) {
    if (this.state === 'working') return this.pending;
    this.state = 'working';
    this.pending = Promise.resolve()
      .then(() => this.executor(payload))
      .then(result => {
        this.state = 'succeeded';
        return result;
      })
      .catch(error => {
        this.state = 'failed';
        throw error;
      })
      .finally(() => { this.pending = null; });
    return this.pending;
  }
}

export function createConfirmationDialog({ title, body, primaryLabel, secondaryLabel = 'Отмена', destructive = false, critical = false }) {
  const dialog = document.createElement('div');
  dialog.className = 'modal-overlay';
  dialog.dataset.critical = String(Boolean(critical));
  dialog.innerHTML = `<section class="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="confirmation-title"><h2 id="confirmation-title">${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p><div class="dialog-actions"><button class="secondary-button" type="button" data-dialog-cancel>${escapeHtml(secondaryLabel)}</button><button class="primary-button${destructive ? ' destructive' : ''}" type="button" data-dialog-confirm>${escapeHtml(primaryLabel)}</button></div></section>`;
  return dialog;
}

export function trapDialogFocus(dialog) {
  const controls = [...dialog.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')];
  if (!controls.length) return () => {};
  const first = controls[0];
  const last = controls[controls.length - 1];
  const handler = event => {
    if (event.key !== 'Tab') return;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  dialog.addEventListener('keydown', handler);
  first.focus();
  return () => dialog.removeEventListener('keydown', handler);
}
