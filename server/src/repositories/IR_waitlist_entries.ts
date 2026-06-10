export interface IWaitlistEntry {
  id?: string;
  tenant_id: string;

  event_id: string;
  ticket_type_id?: string | null;
  user_id?: string | null;

  position?: number | null;
  state?: string;

  hold_payment_id?: string | null;
  hold_expires_at?: Date | null;

  requested_at?: Date;
  released_at?: Date | null;

  notes?: string | null;
  modification_num?: number;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_waitlist_entries {
  create(entry: IWaitlistEntry): Promise<IWaitlistEntry>;
  getById(id: string): Promise<IWaitlistEntry | null>;
  getByEventId(eventId: string): Promise<IWaitlistEntry[]>;
  getByUserId(userId: string): Promise<IWaitlistEntry[]>;
  getAll(): Promise<IWaitlistEntry[]>;
  update(id: string, entry: Partial<IWaitlistEntry>): Promise<IWaitlistEntry | null>;
  delete(id: string): Promise<boolean>;
}