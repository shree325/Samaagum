import { Pool } from "pg";
import { ILedgerAccount, IR_ledger_accounts } from "./IR_ledger_accounts";

export class R_ledger_accounts implements IR_ledger_accounts {
  constructor(private db: Pool) {}

  async create(a: ILedgerAccount): Promise<ILedgerAccount> {
    const query = `
      INSERT INTO ledger_accounts (
        tenant_id, account_key, name, account_type, normal_balance,
        owner_entity_id, parent_account_id, is_active,
        created_by, updated_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *;
    `;
    const values = [
      a.tenant_id, a.account_key, a.name, a.account_type, a.normal_balance,
      a.owner_entity_id, a.parent_account_id, a.is_active,
      a.created_by, a.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ILedgerAccount | null> {
    const result = await this.db.query(`SELECT * FROM ledger_accounts WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByKey(tenantId: string, key: string): Promise<ILedgerAccount | null> {
    const result = await this.db.query(
      `SELECT * FROM ledger_accounts WHERE tenant_id = $1 AND account_key = $2`,
      [tenantId, key]
    );
    return result.rows[0] || null;
  }

  async getByType(accountType: string): Promise<ILedgerAccount[]> {
    const result = await this.db.query(
      `SELECT * FROM ledger_accounts WHERE account_type = $1`, [accountType]
    );
    return result.rows;
  }

  async getAll(): Promise<ILedgerAccount[]> {
    const result = await this.db.query(`SELECT * FROM ledger_accounts ORDER BY account_key ASC`);
    return result.rows;
  }

  async update(id: string, a: Partial<ILedgerAccount>): Promise<ILedgerAccount | null> {
    const result = await this.db.query(
      `
      UPDATE ledger_accounts
      SET
        name = COALESCE($1, name),
        is_active = COALESCE($2, is_active),
        updated_at = now(),
        updated_by = $3
      WHERE id = $4
      RETURNING *;
      `,
      [a.name, a.is_active, a.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM ledger_accounts WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}