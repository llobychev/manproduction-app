import { ROOT_ROUTES, isRootRoute, resolveRoute } from './routes.js';

export class NavigationStack {
  constructor(initialRoute = 'home') {
    this.current = resolveRoute(initialRoute).id;
    this.stack = [];
    this.tabScroll = new Map();
  }

  navigate(routeId, options = {}) {
    const next = resolveRoute(routeId).id;
    const currentMeta = resolveRoute(this.current);
    const nextMeta = resolveRoute(next);

    if (next === this.current) {
      return { routeId: next, repeated: true, restoreScroll: 0 };
    }

    if (options.currentScroll != null) {
      this.tabScroll.set(currentMeta.parentTab, Math.max(0, Number(options.currentScroll) || 0));
    }

    if (options.replace) {
      this.current = next;
    } else if (isRootRoute(next) && nextMeta.parentTab !== currentMeta.parentTab) {
      this.stack = [];
      this.current = next;
    } else {
      this.stack.push(this.current);
      this.current = next;
    }

    return {
      routeId: next,
      repeated: false,
      restoreScroll: isRootRoute(next) ? (this.tabScroll.get(nextMeta.parentTab) || 0) : 0
    };
  }

  back() {
    if (this.stack.length) {
      this.current = this.stack.pop();
      return this.current;
    }

    const meta = resolveRoute(this.current);
    const target = meta.backTarget || ROOT_ROUTES[meta.parentTab];
    if (target && target !== this.current) {
      this.current = target;
      return this.current;
    }

    return null;
  }

  canGoBack() {
    const meta = resolveRoute(this.current);
    return this.stack.length > 0 || Boolean(meta.backTarget && meta.backTarget !== this.current);
  }
}

export function createTelegramBackButtonBoundary(hostWindow, onBack) {
  const backButton = hostWindow?.Telegram?.WebApp?.BackButton;
  let subscribed = false;

  return Object.freeze({
    sync(visible) {
      if (!backButton) return false;
      if (!subscribed && typeof backButton.onClick === 'function') {
        backButton.onClick(onBack);
        subscribed = true;
      }
      if (visible && typeof backButton.show === 'function') backButton.show();
      if (!visible && typeof backButton.hide === 'function') backButton.hide();
      return true;
    },
    destroy() {
      if (subscribed && typeof backButton?.offClick === 'function') backButton.offClick(onBack);
      if (typeof backButton?.hide === 'function') backButton.hide();
      subscribed = false;
    }
  });
}
