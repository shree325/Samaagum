export interface ICheckinGate {
  id?: string;
  tenant_id: string;

  event_id: string;

  name: string;
  gate_code: string;
  gate_type?: string;
  location_note?: string | null;

  device_binding_id?: string | null;
  is_active?: boolean;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_checkin_gates {
  create(gate: ICheckinGate): Promise<ICheckinGate>;
  getById(id: string): Promise<ICheckinGate | null>;
  getByEventId(eventId: string): Promise<ICheckinGate[]>;
  getByGateCode(tenantId: string, eventId: string, gateCode: string): Promise<ICheckinGate | null>;
  getAll(): Promise<ICheckinGate[]>;
  update(id: string, gate: Partial<ICheckinGate>): Promise<ICheckinGate | null>;
  delete(id: string): Promise<boolean>;
}
