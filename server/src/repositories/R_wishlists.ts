import { Pool } from "pg";
import { IWishlist, IR_wishlists } from "./IR_wishlists";

export class R_wishlists implements IR_wishlists {
  constructor(private db: Pool) {}

  async create(w: IWishlist): Promise<IWishlist> {
    const query = `INSERT INTO wishlists (tenant_id, user_id, event_id, alert_opt_in, source, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *;`;
    const values = [w.tenant_id, w.user_id, w.event_id, w.alert_opt_in, w.source, w.created_by, w.updated_by];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IWishlist | null> {
    const result = await this.db.query(`SELECT * FROM wishlists WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByUserId(userId: string): Promise<IWishlist[]> {
    const result = await this.db.query(`SELECT * FROM wishlists WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    return result.rows;
  }

  async getByEventId(eventId: string): Promise<IWishlist[]> {
    const result = await this.db.query(`SELECT * FROM wishlists WHERE event_id = $1`, [eventId]);
    return result.rows;
  }

  async getByUserAndEvent(userId: string, eventId: string): Promise<IWishlist | null> {
    const result = await this.db.query(`SELECT * FROM wishlists WHERE user_id = $1 AND event_id = $2`, [userId, eventId]);
    return result.rows[0] || null;
  }

  async getAll(): Promise<IWishlist[]> {
    const result = await this.db.query(`SELECT * FROM wishlists ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, w: Partial<IWishlist>): Promise<IWishlist | null> {
    const result = await this.db.query(
      `UPDATE wishlists SET alert_opt_in = COALESCE($1, alert_opt_in), updated_at = now(), updated_by = $2 WHERE id = $3 RETURNING *;`,
      [w.alert_opt_in, w.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM wishlists WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
