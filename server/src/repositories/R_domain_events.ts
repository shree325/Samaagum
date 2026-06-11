import { PrismaClient } from '@prisma/client';
import { IDomainEvent, IR_domain_events } from "./IR_domain_events";

export class R_domain_events implements IR_domain_events {
  constructor(private db: PrismaClient) {}

  async create(e: IDomainEvent): Promise<IDomainEvent> {
    const query = `
      INSERT INTO domain_events (bu_id, aggregate_type, aggregate_id, event_type, payload, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      e.bu_id, e.aggregate_type, e.aggregate_id, e.event_type,
      JSON.stringify(e.payload), e.created_by || null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<IDomainEvent | null> {
    const { rows } = await this.db.query(`SELECT * FROM domain_events WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByAggregate(aggregateType: string, aggregateId: string): Promise<IDomainEvent[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM domain_events WHERE aggregate_type = $1 AND aggregate_id = $2 ORDER BY occurred_at DESC`,
      [aggregateType, aggregateId]
    );
    return rows;
  }

  async getAll(buId: string): Promise<IDomainEvent[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM domain_events WHERE bu_id = $1 ORDER BY occurred_at DESC`,
      [buId]
    );
    return rows;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM domain_events WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
