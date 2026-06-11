import { PrismaClient } from '@prisma/client';
import { IWaitlistEntry, IR_waitlist_entries } from "./IR_waitlist_entries";

export class R_waitlist_entries implements IR_waitlist_entries {
  constructor(private db: PrismaClient) {}

  async create(w: IWaitlistEntry): Promise<IWaitlistEntry> {
    const query = `
      INSERT INTO waitlist_entries (
        tenant_id, event_id, ticket_type_id, user_id,
        position, state, hold_payment_id, hold_expires_at,
        notes, modification_num, created_by, updated_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *;
    `;
    const values = [
      w.tenant_id, w.event_id, w.ticket_type_id, w.user_id,
      w.position, w.state, w.hold_payment_id, w.hold_expires_at,
      w.notes, w.modification_num ?? 0, w.created_by, w.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IWaitlistEntry | null> {
    const result = await this.db.query(`SELECT * FROM waitlist_entries WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByEventId(eventId: string): Promise<IWaitlistEntry[]> {
    const result = await this.db.query(
      `SELECT * FROM waitlist_entries WHERE event_id = $1 ORDER BY position ASC`,
      [eventId]
    );
    return result.rows;
  }

  async getByUserId(userId: string): Promise<IWaitlistEntry[]> {
    const result = await this.db.query(
      `SELECT * FROM waitlist_entries WHERE user_id = $1 ORDER BY requested_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async getAll(): Promise<IWaitlistEntry[]> {
    const result = await this.db.query(`SELECT * FROM waitlist_entries ORDER BY requested_at DESC`);
    return result.rows;
  }

  async update(id: string, w: Partial<IWaitlistEntry>): Promise<IWaitlistEntry | null> {
    const result = await this.db.query(
      `
      UPDATE waitlist_entries
      SET
        state = COALESCE($1, state),
        position = COALESCE($2, position),
        released_at = COALESCE($3, released_at),
        notes = COALESCE($4, notes),
        updated_at = now(),
        updated_by = $5,
        modification_num = modification_num + 1
      WHERE id = $6
      RETURNING *;
      `,
      [w.state, w.position, w.released_at, w.notes, w.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM waitlist_entries WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}