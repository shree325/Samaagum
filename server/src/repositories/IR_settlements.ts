export interface ISettlement {
  id?: string;
  tenant_id: string;

  owner_entity_id: string;

  period_start: Date;
  period_end: Date;

  gross_minor?: number;
  fees_minor?: number;
  refunds_minor?: number;
  net_minor?: number;
  currency: string;

  status?: string;
  reconciled_at?: Date | null;
  payout_reference?: string | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_settlements {
  create(settlement: ISettlement): Promise<ISettlement>;
  getById(id: string): Promise<ISettlement | null>;
  getByOwnerEntityId(ownerEntityId: string): Promise<ISettlement[]>;
  getByStatus(status: string): Promise<ISettlement[]>;
  getAll(): Promise<ISettlement[]>;
  update(id: string, settlement: Partial<ISettlement>): Promise<ISettlement | null>;
  delete(id: string): Promise<boolean>;
}
