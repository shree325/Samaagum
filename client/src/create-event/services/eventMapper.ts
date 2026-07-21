// @ts-nocheck
// ─── Event Mapper (Service Layer) ─────────────────────────────────────────────
// Converts between API response shapes and local form state, and vice versa.
// Components and hooks should NEVER build API payloads directly — use these.

import type { EventDraft, TicketTierDraft } from '../types';

// ─── API → Form State ─────────────────────────────────────────────────────────

/**
 * Maps a raw API event object (as returned by GET /api/events/:id) to the
 * initialisation values needed by useEventForm.
 */
export function apiEventToFormState(apiEvent: any): Partial<EventDraft> {
  if (!apiEvent) return {};

  const startsAt = apiEvent.starts_at ? new Date(apiEvent.starts_at) : null;
  const endsAt   = apiEvent.ends_at   ? new Date(apiEvent.ends_at)   : null;

  const padTwo = (n: number) => String(n).padStart(2, '0');
  const toDate = (d: Date | null) =>
    d ? `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())}` : '';
  const toTime = (d: Date | null) =>
    d ? `${padTwo(d.getHours())}:${padTwo(d.getMinutes())}` : '';

  const meta = apiEvent.venue_raw?.meta ?? apiEvent.venue?.meta ?? {};

  return {
    title:        apiEvent.title ?? '',
    slug:         meta.slug ?? '',
    cover:        apiEvent.cover ?? meta.cover ?? '',
    description:  apiEvent.description ?? '',
    instructions: meta.instructions ?? '',

    startDate: toDate(startsAt),
    startTime: toTime(startsAt),
    endDate:   toDate(endsAt),
    endTime:   toTime(endsAt),
    timezone:  apiEvent.venue_timezone ?? 'UTC +05:30 India',

    visibility:   apiEvent.venue_raw?.visibility ?? apiEvent.venue?.visibility ?? 'unlisted',
    joinMode:     apiEvent.join_mode ?? 'restricted',
    selectedAccess: meta.selectedAccess ?? {
      restricted: { communities: [], subCommunities: [], groups: [] },
    },

    locType:          apiEvent.location_type === 'online' ? 'online' : 'offline',
    venue:            apiEvent.location_type === 'online'
                        ? apiEvent.online_link
                        : (apiEvent.venue_raw ?? apiEvent.venue ?? null),
    offlineEntryType: apiEvent.settings?.offline_entry_type ?? 'walk-in',

    type:                apiEvent.cash_enabled ? 'cash'
                        : (apiEvent.registration_mode === 'paid' ? 'paid' : 'free'),
    tickets:            (apiEvent.ticket_types ?? []).map(normaliseApiTicket),
    paymentInstructions: apiEvent.payment_instructions ?? '',
    paymentHoldHours:   String(apiEvent.payment_hold_hours ?? '48'),
    allowImageProof:    apiEvent.settings?.allow_image_proof ?? false,

    capacityEnabled: !!apiEvent.capacity_total,
    capacity:        apiEvent.capacity_total ? String(apiEvent.capacity_total) : '',
    waitlist:        apiEvent.waitlist ?? false,

    enableRegForm: meta.enableRegForm ?? false,
    formFields:    meta.formFields ?? [],

    hostEntityId: apiEvent.hosted_by_entity_id ?? 'standalone',
    calendar:     'Main Calendar',
  };
}

/** Normalises a raw ticket_type from the API to TicketTierDraft shape. */
function normaliseApiTicket(t: any): TicketTierDraft {
  return {
    id:              t.id ?? t.ticket_type_id ?? `t-${Math.random().toString(36).substr(2, 9)}`,
    name:            t.name ?? '',
    description:     t.description ?? '',
    capacity:        t.capacity !== undefined ? (t.capacity === null ? null : Number(t.capacity)) : null,
    price_minor:     t.price_minor !== undefined ? Number(t.price_minor) : 0,
    price_currency:  t.price_currency ?? 'INR',
    max_per_booking: t.max_per_booking !== undefined ? (t.max_per_booking === null ? null : Number(t.max_per_booking)) : null,
    sale_start:      t.sale_start ?? null,
    sale_end:        t.sale_end   ?? null,
    visibility:      t.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
  };
}

// ─── Form State → API Payload ─────────────────────────────────────────────────

export interface FormStateToPayloadInput {
  hostEntityId:    string;
  title:           string;
  description:     string;
  cover:           string;          // already-uploaded URL
  status:          'published' | 'draft';
  startDate:       string;
  startTime:       string;
  endDate:         string;
  endTime:         string;
  timezone:        string;
  locType:         string;
  venue:           any;
  visibility:      string;
  slug:            string;
  tags:            string[];
  cat:             string;
  instructions:    string;
  joinEligibility: string;
  selectedAccess:  any;
  enableRegForm:   boolean;
  formFields:      any[];
  enableSponsors:  boolean;
  selectedSponsorIds: string[];
  sponsorVisibility:  string;
  type:                  string;
  tickets:               TicketTierDraft[];
  paymentInstructions:   string;
  paymentHoldHours:      string;
  registrationStatus:    string;
  regStartDate:          string;
  regStartTime:          string;
  regEndDate:            string;
  regEndTime:            string;
  approval:              boolean;
  capacityEnabled:       boolean;
  capacity:              string;
  waitlist:              boolean;
  allowImageProof:       boolean;
  offlineEntryType:      string;
  existingSettings?:     any;
  existingMeta?:         any;
}

/**
 * Converts the form state snapshot into the API payload for POST /api/events
 * or PUT /api/events/:id.
 */
export function formStateToApiPayload(s: FormStateToPayloadInput): Record<string, any> {
  const starts_at = s.startDate && s.startTime
    ? new Date(`${s.startDate}T${s.startTime}`).toISOString()
    : s.startDate ? new Date(`${s.startDate}T00:00`).toISOString() : null;

  const ends_at = s.endDate && s.endTime
    ? new Date(`${s.endDate}T${s.endTime}`).toISOString()
    : s.endDate ? new Date(`${s.endDate}T23:59`).toISOString() : null;

  return {
    host_entity_id: s.hostEntityId,
    title:          s.title.trim(),
    description:    s.description,
    cover:          s.cover,
    status:         s.status,
    starts_at,
    ends_at,
    venue_timezone:    s.timezone,
    location_type:     s.locType === 'online' ? 'online' : 'venue',
    venue: {
      name:       s.locType === 'online' ? null : (typeof s.venue === 'string' ? s.venue : s.venue?.address),
      address:    s.locType === 'online' ? null : (typeof s.venue === 'string' ? s.venue : s.venue?.address),
      visibility: s.visibility,
      meta: {
        ...(s.existingMeta ?? {}),
        cover:           s.cover,
        slug:            s.slug,
        tags:            s.tags,
        category:        s.cat,
        instructions:    s.instructions,
        joinEligibility: s.joinEligibility,
        selectedAccess:  s.selectedAccess,
        enableRegForm:   s.enableRegForm,
        formFields:      s.formFields,
        enableSponsors:  s.enableSponsors,
        selectedSponsorIds: s.selectedSponsorIds,
      },
    },
    online_link:        s.locType === 'online' ? (typeof s.venue === 'string' ? s.venue : null) : null,
    registration_mode:  (s.type === 'paid' || s.type === 'cash') ? 'paid' : 'free_rsvp',
    cash_enabled:       s.type === 'cash',
    payment_instructions: s.type === 'cash' ? s.paymentInstructions : null,
    payment_hold_hours:   s.type === 'cash' ? (parseInt(s.paymentHoldHours) || 48) : null,
    registration_status:  s.registrationStatus,
    registration_opens_at: s.registrationStatus === 'SCHEDULED' && s.regStartDate && s.regStartTime
      ? new Date(`${s.regStartDate}T${s.regStartTime}`).toISOString() : null,
    registration_closes_at: s.registrationStatus === 'SCHEDULED' && s.regEndDate && s.regEndTime
      ? new Date(`${s.regEndDate}T${s.regEndTime}`).toISOString() : null,
    approval_required: s.approval,
    capacity_total:    s.capacityEnabled && s.capacity ? parseInt(s.capacity) : null,
    waitlist:          s.waitlist,
    settings: {
      ...(s.existingSettings ?? {}),
      allow_image_proof:   s.allowImageProof,
      offline_entry_type:  s.offlineEntryType,
    },
    tickets: (s.type === 'paid' || s.type === 'cash')
      ? s.tickets.map((t: any, i: number) => ({
          id:           t.id,
          name:         t.name || t.n || 'General Admission',
          description:  t.description || '',
          capacity:     t.capacity !== undefined ? t.capacity : (t.cap ? parseInt(t.cap) : null),
          price_minor:  t.price_minor !== undefined ? t.price_minor : (t.price ? Math.round(parseFloat(t.price) * 100) : 0),
          price_currency: t.price_currency || 'INR',
          max_per_booking: t.max_per_booking,
          sale_start:   t.sale_start,
          sale_end:     t.sale_end,
          visibility:   t.visibility || 'public',
          sort_order:   i,
        }))
      : [{
          name:         'Free Admission',
          price_minor:  0,
          capacity:     s.capacityEnabled && s.capacity ? parseInt(s.capacity) : null,
          sort_order:   0,
        }],
  };
}
