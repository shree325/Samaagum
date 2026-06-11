import { PrismaClient } from '@prisma/client';
import { ISponsor, IR_sponsors } from "./IR_sponsors";

export class R_sponsors implements IR_sponsors {
  constructor(private db: PrismaClient) {}

  async create(s: ISponsor): Promise<ISponsor> {
    const query = `
      INSERT INTO sponsors (bu_id, name, logo_url, website_url, contact_email, x_data, created_by, last_upd_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      s.bu_id, s.name, s.logo_url || null, s.website_url || null, s.contact_email || null,
      s.x_data ? JSON.stringify(s.x_data) : null, s.created_by || null, s.last_upd_by || null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<ISponsor | null> {
    const { rows } = await this.db.query(`SELECT * FROM sponsors WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getAll(buId: string): Promise<ISponsor[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM sponsors WHERE bu_id = $1 ORDER BY name ASC`,
      [buId]
    );
    return rows;
  }

  async update(rowId: string, s: Partial<ISponsor>): Promise<ISponsor | null> {
    const query = `
      UPDATE sponsors
      SET name = COALESCE($1, name),
          logo_url = COALESCE($2, logo_url),
          website_url = COALESCE($3, website_url),
          contact_email = COALESCE($4, contact_email),
          x_data = COALESCE($5, x_data),
          last_upd = now(),
          last_upd_by = $6,
          modification_num = modification_num + 1
      WHERE row_id = $7
      RETURNING *;
    `;
    const values = [
      s.name || null,
      s.logo_url || null,
      s.website_url || null,
      s.contact_email || null,
      s.x_data ? JSON.stringify(s.x_data) : null,
      s.last_upd_by || null,
      rowId
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM sponsors WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
