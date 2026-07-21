// @ts-nocheck
import { COVERS } from '../../home-data';

export const COVER_SWATCHES = Object.entries(COVERS).map(([k, v]) => ({ k, v }));

export const DEFAULT_FREE_ENTITLEMENTS = {
  group_max_groups: -1,
  group_allowed_visibility: ['unlisted'],
  group_allowed_join_modes: ['open', 'invite_only'],
  group_max_capacity: 25,
  group_can_restricted_access: false,
  event_allowed_registration_modes: ['free', 'cash'],
  event_allowed_visibility: ['unlisted', 'custom'],
  event_allowed_join_modes: ['restricted', 'invite'],
  event_max_participants: 100,
  event_checkin_methods: ['scanner', 'manual', 'gate'],
  event_can_create_paid_tickets: false,
  ai_assistant_enabled: false
};
