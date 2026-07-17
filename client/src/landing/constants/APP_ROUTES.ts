// APP_ROUTES — single source of truth for all cross-entrypoint deep-links.
// Landing page imports these helpers instead of knowing any hash format.
// If routing ever changes, only this file changes.

const HOME_PATH = '/pages/Samaagum Home.html';
const AUTH_PATH = '/pages/Samaagum Auth.html';

export const APP_ROUTES = {
  event: (id: string) =>
    `${HOME_PATH}#/event?id=${encodeURIComponent(id)}`,

  group: (id: string) =>
    `${HOME_PATH}#/group?id=${encodeURIComponent(id)}`,

  discover: (category?: string) =>
    category
      ? `${HOME_PATH}#/discover?category=${encodeURIComponent(category)}`
      : `${HOME_PATH}#/discover`,

  login:  () => `${AUTH_PATH}#login`,
  signup: () => `${AUTH_PATH}#signup`,
};

/**
 * Single consistent helper for all cross-HTML navigations from the landing page.
 * Prefer this over raw window.location.href so all cross-entry jumps are traceable.
 */
export function navigateToApp(url: string): void {
  window.location.assign(url);
}
