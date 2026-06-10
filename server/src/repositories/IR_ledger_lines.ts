export interface ILedgerLine {
  id?: string;
  tenant_id: string;

  journal_id: string;
  account_id: string;

  line_no: number;

  debit_minor?: number;
  credit_minor?: number;
  currency: string;

  memo?: string | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_ledger_lines {
  create(line: ILedgerLine): Promise<ILedgerLine>;
  getById(id: string): Promise<ILedgerLine | null>;
  getByJournalId(journalId: string): Promise<ILedgerLine[]>;
  getByAccountId(accountId: string): Promise<ILedgerLine[]>;
  getAll(): Promise<ILedgerLine[]>;
  delete(id: string): Promise<boolean>;
}