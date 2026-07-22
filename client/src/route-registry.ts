// Route Registry — declarative per-route access control.
// Adding a new protected or public route is a one-line change here.

export type AccessLevel = 'guest' | 'authenticated' | 'organizer' | 'admin';

export type PendingActionType =
  | 'join-event'
  | 'join-group'
  | 'bookmark'
  | 'create'
  | 'rsvp';

export interface RouteMeta {
  access: AccessLevel;
}

export interface PendingNavigation {
  view: string;
  /** Only store identifiers, never full objects — keeps storage small and avoids stale data. */
  param?: { id?: string; [key: string]: string | undefined };
}

export interface PendingAction {
  type: PendingActionType;
  eventId?: string;
  groupId?: string;
}

export const ROUTE_REGISTRY: Record<string, RouteMeta> = {
  // ─── Guest-accessible ────────────────────────────────────────
  discover:           { access: 'guest' },
  event:              { access: 'guest' },
  'event-join':       { access: 'guest' },
  group:              { access: 'guest' },
  invite:             { access: 'guest' },
  'event-invite':     { access: 'guest' },
  claim:              { access: 'guest' },
  'public-profile':   { access: 'guest' },

  // ─── Authenticated ───────────────────────────────────────────
  home:               { access: 'authenticated' },
  groups:             { access: 'authenticated' },
  events:             { access: 'authenticated' },
  tickets:            { access: 'authenticated' },
  messages:           { access: 'authenticated' },
  notifications:      { access: 'authenticated' },
  profile:            { access: 'authenticated' },
  settings:           { access: 'authenticated' },
  'create-event':     { access: 'authenticated' },
  'create-group':     { access: 'authenticated' },
  'edit-event':       { access: 'authenticated' },
  'edit-group':       { access: 'authenticated' },
  upgrade:            { access: 'authenticated' },
  checkout:           { access: 'authenticated' },
  'checkout-success': { access: 'authenticated' },
  waitlist:           { access: 'authenticated' },
  ticket:             { access: 'authenticated' },

  // ─── Organizer ───────────────────────────────────────────────
  'event-dashboard':  { access: 'organizer' },
  'group-dashboard':  { access: 'organizer' },
  scan:               { access: 'organizer' },
  'scan-event':       { access: 'organizer' },
};

/**
 * Returns true if the current client user may access this route.
 * Server enforces granular role checks; client just gates the page render.
 */
export function canAccess(routeKey: string, token: string | null): boolean {
  const meta = ROUTE_REGISTRY[routeKey] ?? { access: 'authenticated' };

  switch (meta.access) {
    case 'guest':
      return true;

    case 'authenticated':
    case 'organizer':
    case 'admin':
      // Organizer/admin granularity enforced server-side.
      // Client only checks that the user is logged in.
      return !!token;

    default:
      return !!token;
  }
}
