import { Pool } from "pg";
import { IOutboundWebhooks, IR_outbound_webhooks } from "./IR_outbound_webhooks";

export class R_outbound_webhooks implements IR_outbound_webhooks {
  constructor(private db: Pool) {}

  async create(data: IOutboundWebhooks): Promise<IOutboundWebhooks> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const query = `INSERT INTO outbound_webhooks (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(row_id: string): Promise<IOutboundWebhooks | null> {
    const { rows } = await this.db.query('SELECT * FROM outbound_webhooks WHERE row_id = $1', [row_id]);
    return rows[0] || null;
  }

  async getAll(): Promise<IOutboundWebhooks[]> {
    const { rows } = await this.db.query('SELECT * FROM outbound_webhooks');
    return rows;
  }

  async update(row_id: string, data: Partial<IOutboundWebhooks>): Promise<IOutboundWebhooks | null> {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = Object.values(data);
    const query = `UPDATE outbound_webhooks SET ${setClause} WHERE row_id = $1 RETURNING *`;
    const { rows } = await this.db.query(query, [row_id, ...values]);
    return rows[0] || null;
  }

  async delete(row_id: string): Promise<boolean> {
    const { rowCount } = await this.db.query('DELETE FROM outbound_webhooks WHERE row_id = $1', [row_id]);
    return (rowCount ?? 0) > 0;
  }
}
