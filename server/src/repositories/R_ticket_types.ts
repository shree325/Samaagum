import { PrismaClient } from '@prisma/client';
import { ITicketType, IR_ticket_types } from "./IR_ticket_types";

export class R_ticket_types implements IR_ticket_types {
  constructor(private db: PrismaClient) {}

  private mapRowToTicketType(row: any): ITicketType {
    if (!row) return row;
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      event_id: row.event_id,
      name: row.name,
      description: row.description,
      price_minor: row.price_amount_minor !== null ? Number(row.price_amount_minor) : 0,
      currency: row.price_currency || 'INR',
      capacity: row.capacity,
      max_per_booking: row.max_per_booking,
      sale_start_at: row.sale_start,
      sale_end_at: row.sale_end,
      early_bird_price_minor: row.early_bird_price_amount_minor !== null && row.early_bird_price_amount_minor !== undefined ? Number(row.early_bird_price_amount_minor) : null,
      early_bird_ends_at: row.early_bird_ends_at,
      visibility: row.visibility,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async create(tt: ITicketType): Promise<ITicketType> {
    const query = `
      INSERT INTO ticket_types (
        tenant_id, event_id, name, description,
        price_amount_minor, price_currency, capacity, max_per_booking,
        sale_start, sale_end, early_bird_price_amount_minor, early_bird_ends_at,
        visibility
      )
      VALUES (
        $1, $2, $3, $4, $5, $6::currency_code, $7, $8, $9, $10,
        $11, $12, $13::ticket_visibility
      )
      RETURNING *;
    `;
    const values = [
      tt.tenant_id,
      tt.event_id,
      tt.name,
      tt.description || null,
      tt.price_minor || 0,
      (tt.currency || 'INR') as any,
      tt.capacity || null,
      tt.max_per_booking || null,
      tt.sale_start_at || null,
      tt.sale_end_at || null,
      tt.early_bird_price_minor || null,
      tt.early_bird_ends_at || null,
      (tt.visibility || 'public') as any,
    ];
    const result = await this.db.query(query, values);
    return this.mapRowToTicketType(result.rows[0]);
  }

  async getById(id: string): Promise<ITicketType | null> {
    const result = await this.db.query(
      `SELECT * FROM ticket_types WHERE id = $1`, [id]
    );
    return this.mapRowToTicketType(result.rows[0]) || null;
  }

  async getByEventId(eventId: string): Promise<ITicketType[]> {
    const result = await this.db.query(
      `SELECT * FROM ticket_types WHERE event_id = $1 ORDER BY created_at ASC`,
      [eventId]
    );
    return result.rows.map(row => this.mapRowToTicketType(row));
  }

  async getAll(): Promise<ITicketType[]> {
    const result = await this.db.query(
      `SELECT * FROM ticket_types ORDER BY created_at DESC`
    );
    return result.rows.map(row => this.mapRowToTicketType(row));
  }

  async update(id: string, tt: Partial<ITicketType>): Promise<ITicketType | null> {
    const result = await this.db.query(
      `
      UPDATE ticket_types
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price_amount_minor = COALESCE($3, price_amount_minor),
        capacity = COALESCE($4, capacity),
        visibility = COALESCE($5::ticket_visibility, visibility),
        updated_at = now()
      WHERE id = $6
      RETURNING *;
      `,
      [
        tt.name,
        tt.description,
        tt.price_minor,
        tt.capacity,
        tt.visibility as any,
        id,
      ]
    );
    return this.mapRowToTicketType(result.rows[0]) || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM ticket_types WHERE id = $1`, [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}