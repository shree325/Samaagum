export interface PlanEntitlements {
  group_max_groups: number; // -1 for unlimited
  group_allowed_visibility: string[]; // e.g. ["public", "unlisted", "restricted"]
  group_allowed_join_modes: string[]; // e.g. ["open", "invite_only", "restricted_access"]
  group_max_capacity: number; // -1 for unlimited
  group_can_restricted_access: boolean;

  event_allowed_registration_modes: string[]; // e.g. ["free", "cash", "paid"]
  event_allowed_visibility: string[]; // e.g. ["public", "unlisted", "custom"]
  event_allowed_join_modes: string[]; // e.g. ["public", "restricted", "invite"]
  event_max_participants: number; // -1 for unlimited
  event_checkin_methods: string[]; // e.g. ["scanner", "manual", "gate"]
  event_can_create_paid_tickets: boolean;
  ai_assistant_enabled: boolean;
}

export const DEFAULT_FREE_ENTITLEMENTS: PlanEntitlements = {
  group_max_groups: -1,
  group_allowed_visibility: ["unlisted"],
  group_allowed_join_modes: ["open", "invite_only"],
  group_max_capacity: 25,
  group_can_restricted_access: false,
  event_allowed_registration_modes: ["free", "cash"],
  event_allowed_visibility: ["unlisted", "custom"],
  event_allowed_join_modes: ["restricted", "invite"],
  event_max_participants: 100,
  event_checkin_methods: ["scanner", "manual", "gate"],
  event_can_create_paid_tickets: false,
  ai_assistant_enabled: false,
};
