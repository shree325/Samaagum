export interface ILedgerAccount {
  id?: string;
  tenant_id: string;

  account_key: string;
  name: string;
  account_type: string;
  normal_balance?: string;

  owner_entity_id?: string | null;
  parent_account_id?: string | null;

  is_active?: boolean;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_ledger_accounts {
  create(account: ILedgerAccount): Promise<ILedgerAccount>;
  getById(id: string): Promise<ILedgerAccount | null>;
  getByKey(tenantId: string, key: string): Promise<ILedgerAccount | null>;
  getByType(accountType: string): Promise<ILedgerAccount[]>;
  getAll(): Promise<ILedgerAccount[]>;
  update(id: string, account: Partial<ILedgerAccount>): Promise<ILedgerAccount | null>;
  delete(id: string): Promise<boolean>;
}