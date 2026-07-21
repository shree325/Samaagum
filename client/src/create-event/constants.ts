// @ts-nocheck
// ─── Constants ───────────────────────────────────────────────────────────────
// All static data used across the create-event module lives here.

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const TIMEZONES = [
  { value: 'UTC +05:30 India',       label: 'GMT+05:30', city: 'Asia/Kolkata' },
  { value: 'UTC +00:00 London',      label: 'GMT+00:00', city: 'Europe/London' },
  { value: 'UTC -05:00 New York',    label: 'GMT-05:00', city: 'America/New_York' },
  { value: 'UTC +08:00 Singapore',   label: 'GMT+08:00', city: 'Asia/Singapore' },
  { value: 'UTC +09:00 Tokyo',       label: 'GMT+09:00', city: 'Asia/Tokyo' },
  { value: 'UTC -08:00 Los Angeles', label: 'GMT-08:00', city: 'America/Los_Angeles' },
];

export const RECENT_LOCATIONS: any[] = [];

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
  ai_assistant_enabled: false,
};

/**
 * Default access tree — seed data used when the API hasn't loaded groups yet.
 * The live CreateEventForm replaces ACCESS_TREE with data from /api/groups.
 */
export let ACCESS_TREE: any[] = [
  {
    id: 'comm-samaagum',
    name: 'Samaagum Hub',
    type: 'community',
    children: [
      {
        id: 'sub-developers',
        name: 'Samaagum Developers',
        type: 'subcommunity',
        children: [
          { id: 'grp-founders-coll',    name: 'BLR Founders Collective', type: 'group' },
          { id: 'grp-sunrise-runners',  name: 'Sunrise Runners',          type: 'group' },
        ],
      },
    ],
  },
  {
    id: 'comm-sgsits',
    name: 'SGSITS',
    type: 'community',
    children: [
      {
        id: 'sub-cse',
        name: 'CSE',
        type: 'subcommunity',
        children: [
          { id: 'grp-hackathon',  name: 'Hackathon Team',        type: 'group' },
          { id: 'grp-coding',     name: 'Coding Club',           type: 'group' },
          { id: 'grp-placement',  name: 'Placement Preparation', type: 'group' },
        ],
      },
      {
        id: 'sub-it',
        name: 'IT',
        type: 'subcommunity',
        children: [
          { id: 'grp-startup', name: 'Startup Founders', type: 'group' },
          { id: 'grp-design',  name: 'Design Team',      type: 'group' },
        ],
      },
      {
        id: 'sub-ece',
        name: 'ECE',
        type: 'subcommunity',
        children: [],
      },
    ],
  },
  {
    id: 'comm-manit',
    name: 'MANIT',
    type: 'community',
    children: [
      {
        id: 'sub-cse-manit',
        name: 'CSE',
        type: 'subcommunity',
        children: [
          { id: 'grp-hackathon-manit', name: 'Hackathon Team', type: 'group' },
        ],
      },
    ],
  },
  {
    id: 'comm-iitb',
    name: 'IIT Bangalore',
    type: 'community',
    children: [
      {
        id: 'sub-tech-club',
        name: 'Indiranagar Tech Club',
        type: 'subcommunity',
        children: [
          { id: 'grp-design-guild-blr', name: 'Design Guild Bangalore', type: 'group' },
        ],
      },
      {
        id: 'sub-design-guild',
        name: 'Design Guild Hub',
        type: 'subcommunity',
        children: [],
      },
    ],
  },
];
