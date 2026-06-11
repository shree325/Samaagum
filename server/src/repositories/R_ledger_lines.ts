import { PrismaClient } from '@prisma/client';
import { ILedgerLine, IR_ledger_lines } from "./IR_ledger_lines";

export class R_ledger_lines implements IR_ledger_lines {
  constructor(private db: PrismaClient) {}

  async create(l: ILedgerLine): Promise<ILedgerLine> {
    const query = `
      INSERT INTO ledger_lines (
        tenant_id, journal_id, account_id, line_no,
        debit_minor, credit_minor, currency, memo,
        created_by, updated_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *;
    `;
    const values = [
      l.tenant_id, l.journal_id, l.account_id, l.line_no,
      l.debit_minor, l.credit_minor, l.currency, l.memo,
      l.created_by, l.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ILedgerLine | null> {
    const result = await this.db.query(`SELECT * FROM ledger_lines WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByJournalId(journalId: string): Promise<ILedgerLine[]> {
    const result = await this.db.query(
      `SELECT * FROM ledger_lines WHERE journal_id = $1 ORDER BY line_no ASC`,
      [journalId]
    );
    return result.rows;
  }

  async getByAccountId(accountId: string): Promise<ILedgerLine[]> {
    const result = await this.db.query(
      `SELECT * FROM ledger_lines WHERE account_id = $1 ORDER BY created_at DESC`,
      [accountId]
    );
    return result.rows;
  }

  async getAll(): Promise<ILedgerLine[]> {
    const result = await this.db.query(`SELECT * FROM ledger_lines ORDER BY created_at DESC`);
    return result.rows;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM ledger_lines WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}