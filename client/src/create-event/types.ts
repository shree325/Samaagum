// @ts-nocheck
// ─── Shared Domain Types ─────────────────────────────────────────────────────
// All event-creation related types are centralised here so components and hooks
// can import them without creating circular dependencies.

export interface TicketTierDraft {
  id?: string;
  name: string;
  description: string;
  capacity: number | null;
  price_minor: number;
  price_currency: string;
  max_per_booking: number | null;
  sale_start?: string | null;
  sale_end?: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
}

export interface QuestionDraft {
  id: string;
  type: 'text' | 'paragraph' | 'options' | 'social' | 'company';
  question: string;
  required: boolean;
  options?: string[];
  platform?: string;
}

export interface LocationDraft {
  type?: string;
  address?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  url?: string;
  provider?: string;
  meta?: Record<string, any>;
}

export interface EventDraft {
  // Identity
  title: string;
  slug: string;
  cover: string;
  description: string;
  instructions: string;

  // Scheduling
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timezone: string;

  // Visibility & access
  visibility: string;
  joinMode: string;
  selectedAccess: {
    restricted: {
      communities: string[];
      subCommunities: string[];
      groups: string[];
    };
  };

  // Location
  locType: string;
  venue: LocationDraft | null;
  offlineEntryType: string;

  // Tickets
  type: string;           // 'free' | 'cash' | 'paid'
  tickets: TicketTierDraft[];
  paymentInstructions: string;
  paymentHoldHours: string;
  allowImageProof: boolean;

  // Capacity
  capacityEnabled: boolean;
  capacity: string;
  waitlist: boolean;

  // Questionnaire
  enableRegForm: boolean;
  formFields: QuestionDraft[];

  // Host
  hostEntityId: string;
  calendar: string;
}
