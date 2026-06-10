export interface ICheckin {
  id?: string;
  tenant_id: string;

  ticket_id: string;
  staff_user_id?: string | null;
  gate_id?: string | null;

  method?: string;
  occurred_at?: Date;
  status?: string;

  duplicate_of_checkin_id?: string | null;
  source_device_id?: string | null;

  notes?: string | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_checkins {
  create(checkin: ICheckin): Promise<ICheckin>;
  getById(id: string): Promise<ICheckin | null>;
  getByTicketId(ticketId: string): Promise<ICheckin[]>;
  getByGateId(gateId: string): Promise<ICheckin[]>;
  getByStaffUserId(staffUserId: string): Promise<ICheckin[]>;
  getAll(): Promise<ICheckin[]>;
  delete(id: string): Promise<boolean>;
}