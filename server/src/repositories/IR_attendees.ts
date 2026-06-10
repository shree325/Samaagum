export interface IAttendee {
  id?: string;
  tenant_id: string;

  booking_id: string;
  ticket_id?: string | null;
  user_id?: string | null;

  name: string;
  email?: string | null;
  gender?: string | null;
  phone?: string | null;
  dob?: Date | null;

  claimed_at?: Date | null;
  checkin_status?: string;

  notes?: string | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_attendees {
  create(attendee: IAttendee): Promise<IAttendee>;
  getById(id: string): Promise<IAttendee | null>;
  getByBookingId(bookingId: string): Promise<IAttendee[]>;
  getByUserId(userId: string): Promise<IAttendee[]>;
  getByEmail(email: string): Promise<IAttendee[]>;
  getAll(): Promise<IAttendee[]>;
  update(id: string, attendee: Partial<IAttendee>): Promise<IAttendee | null>;
  delete(id: string): Promise<boolean>;
}
