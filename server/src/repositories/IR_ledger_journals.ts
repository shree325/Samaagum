export interface ILedgerJournal {
  id?: string;
  tenant_id: string;

  journal_type: string;
  source_type: string;
  source_id: string;

  narration?: string | null;
  posted_at?: Date;

  reversal_of_journal_id?: string | null;

  status?: string;
  modification_num?: number;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_ledger_journals {
  create(journal: ILedgerJournal): Promise<ILedgerJournal>;
  getById(id: string): Promise<ILedgerJournal | null>;
  getBySource(sourceType: string, sourceId: string): Promise<ILedgerJournal[]>;
  getAll(): Promise<ILedgerJournal[]>;
  update(id: string, journal: Partial<ILedgerJournal>): Promise<ILedgerJournal | null>;
  delete(id: string): Promise<boolean>;
}