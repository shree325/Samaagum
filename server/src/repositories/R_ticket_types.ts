import { PrismaClient } from '@prisma/client';
import { ITicketType, IR_ticket_types } from "./IR_ticket_types";

export class R_ticket_types implements IR_ticket_types {
  constructor(private db: PrismaClient) {}

  async create(tt: ITicketType): Promise<ITicketType> {
    const query = `
      INSERT INTO ticket_types (
        tenant_id, event_id, name, description,
        price_minor, currency, capacity, quantity_sold, max_per_booking,
        sale_start_at, sale_end_at, early_bird_price_minor, early_bird_ends_at,
        visibility, sort_order, is_active, status,
        membership_tier_id, modification_num, created_by, updated_by
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
      )
      RETURNING *;
    `;
    const values = [
      tt.tenant_id, tt.event_id, tt.name, tt.description,
      tt.price_minor, tt.currency, tt.capacity, tt.quantity_sold,
      tt.max_per_booking, tt.sale_start_at, tt.sale_end_at,
      tt.early_bird_price_minor, tt.early_bird_ends_at,
      tt.visibility, tt.sort_order, tt.is_active, tt.status,
      tt.membership_tier_id, tt.modification_num ?? 0,
      tt.created_by, tt.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ITicketType | null> {
    const result = await this.db.query(
      `SELECT * FROM ticket_types WHERE id = $1`, [id]
    );
    return result.rows[0] || null;
  }

  async getByEventId(eventId: string): Promise<ITicketType[]> {
    const result = await this.db.query(
      `SELECT * FROM ticket_types WHERE event_id = $1 ORDER BY sort_order ASC`,
      [eventId]
    );
    return result.rows;
  }

  async getAll(): Promise<ITicketType[]> {
    const result = await this.db.query(
      `SELECT * FROM ticket_types ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async update(id: string, tt: Partial<ITicketType>): Promise<ITicketType | null> {
    const result = await this.db.query(
      `
      UPDATE ticket_types
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price_minor = COALESCE($3, price_minor),
        capacity = COALESCE($4, capacity),
        is_active = COALESCE($5, is_active),
        status = COALESCE($6, status),
        sort_order = COALESCE($7, sort_order),
        updated_at = now(),
        updated_by = $8,
        modification_num = modification_num + 1
      WHERE id = $9
      RETURNING *;
      `,
      [
        tt.name, tt.description, tt.price_minor, tt.capacity,
        tt.is_active, tt.status, tt.sort_order, tt.updated_by, id,
      ]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM ticket_types WHERE id = $1`, [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}