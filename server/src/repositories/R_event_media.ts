import { PrismaClient } from '@prisma/client';
import { IEventMedia, IR_event_media } from "./IR_event_media";

export class R_event_media implements IR_event_media {
  constructor(private db: PrismaClient) {}

  async create(m: IEventMedia): Promise<IEventMedia> {
    const query = `
      INSERT INTO event_media (
        tenant_id, event_id, asset_id, media_type, caption, alt_text,
        sort_order, visibility, is_primary, created_by, updated_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *;
    `;
    const values = [
      m.tenant_id, m.event_id, m.asset_id, m.media_type, m.caption,
      m.alt_text, m.sort_order, m.visibility, m.is_primary,
      m.created_by, m.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IEventMedia | null> {
    const result = await this.db.query(`SELECT * FROM event_media WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByEventId(eventId: string): Promise<IEventMedia[]> {
    const result = await this.db.query(
      `SELECT * FROM event_media WHERE event_id = $1 ORDER BY sort_order ASC`,
      [eventId]
    );
    return result.rows;
  }

  async getAll(): Promise<IEventMedia[]> {
    const result = await this.db.query(`SELECT * FROM event_media ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, m: Partial<IEventMedia>): Promise<IEventMedia | null> {
    const result = await this.db.query(
      `
      UPDATE event_media SET
        caption = COALESCE($1, caption), alt_text = COALESCE($2, alt_text),
        sort_order = COALESCE($3, sort_order), visibility = COALESCE($4, visibility),
        is_primary = COALESCE($5, is_primary), updated_at = now(), updated_by = $6
      WHERE id = $7 RETURNING *;
      `,
      [m.caption, m.alt_text, m.sort_order, m.visibility, m.is_primary, m.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM event_media WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
