import { Pool } from "pg";
import { IMediaAsset, IR_media_assets } from "./IR_media_assets";

export class R_media_assets implements IR_media_assets {
  constructor(private db: Pool) {}

  async create(a: IMediaAsset): Promise<IMediaAsset> {
    const query = `
      INSERT INTO media_assets (bu_id, owner_type, owner_id, file_url, mime_type, file_size, x_data, created_by, last_upd_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [
      a.bu_id, a.owner_type, a.owner_id, a.file_url, a.mime_type || null,
      a.file_size === undefined ? null : a.file_size, a.x_data ? JSON.stringify(a.x_data) : null,
      a.created_by || null, a.last_upd_by || null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<IMediaAsset | null> {
    const { rows } = await this.db.query(`SELECT * FROM media_assets WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByOwner(ownerType: string, ownerId: string): Promise<IMediaAsset[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM media_assets WHERE owner_type = $1 AND owner_id = $2 ORDER BY created DESC`,
      [ownerType, ownerId]
    );
    return rows;
  }

  async getAll(buId: string): Promise<IMediaAsset[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM media_assets WHERE bu_id = $1 ORDER BY created DESC`,
      [buId]
    );
    return rows;
  }

  async update(rowId: string, a: Partial<IMediaAsset>): Promise<IMediaAsset | null> {
    const query = `
      UPDATE media_assets
      SET file_url = COALESCE($1, file_url),
          mime_type = COALESCE($2, mime_type),
          file_size = COALESCE($3, file_size),
          x_data = COALESCE($4, x_data),
          last_upd = now(),
          last_upd_by = $5,
          modification_num = modification_num + 1
      WHERE row_id = $6
      RETURNING *;
    `;
    const values = [
      a.file_url || null,
      a.mime_type || null,
      a.file_size === undefined ? null : a.file_size,
      a.x_data ? JSON.stringify(a.x_data) : null,
      a.last_upd_by || null,
      rowId
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM media_assets WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
