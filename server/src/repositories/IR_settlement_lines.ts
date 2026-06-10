export interface ISettlementLine {
  id?: string;
  tenant_id: string;

  settlement_id: string;

  source_type: string;
  source_id: string;
  journal_id?: string | null;

  amount_minor: number;
  currency: string;

  line_type: string;
  description?: string | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_settlement_lines {
  create(line: ISettlementLine): Promise<ISettlementLine>;
  getById(id: string): Promise<ISettlementLine | null>;
  getBySettlementId(settlementId: string): Promise<ISettlementLine[]>;
  getAll(): Promise<ISettlementLine[]>;
  delete(id: string): Promise<boolean>;
}
