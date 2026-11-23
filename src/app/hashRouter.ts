import { useSyncExternalStore } from 'react';

/**
 * Hash router của app. Khác `wouter/use-hash-location`: query (`?from=today&task=...`) nằm TRONG hash
 * (`#/play/v1?from=today`), không ghi vào `location.search`. Nhờ vậy cờ của lần mở này không dính sang
 * các màn khác (F5), và route `/play/:gameId` luôn khớp đúng tên game.
 */

export interface AppNavigateOptions {
  replace?: boolean;
  state?: unknown;
}

const subscribe = (callback: () => void) => {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
};

const hashBody = () => window.location.hash.replace(/^#?\/?/, '');
const snapshotPath = () => '/' + hashBody().split('?')[0];
const snapshotSearch = () => {
  const body = hashBody();
  const q = body.indexOf('?');
  return q === -1 ? '' : body.slice(q + 1);
};

export function appNavigate(to: string, { replace = false, state = null }: AppNavigateOptions = {}): void {
  const oldURL = window.location.href;
  const url = new URL(oldURL);
  url.hash = '/' + to.replace(/^#?\/?/, '');
  const newURL = url.href;
  window.history[replace ? 'replaceState' : 'pushState'](state, '', newURL);
  window.dispatchEvent(new HashChangeEvent('hashchange', { oldURL, newURL }));
}

export function useAppHashLocation(): [string, typeof appNavigate] {
  const path = useSyncExternalStore(subscribe, snapshotPath, () => '/');
  return [path, appNavigate];
}
useAppHashLocation.hrefs = (href: string) => '#' + href;

export function useAppHashSearch(): string {
  return useSyncExternalStore(subscribe, snapshotSearch, () => '');
}
