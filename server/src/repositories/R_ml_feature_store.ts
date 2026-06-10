import { Pool } from "pg";
import { IMlFeatureStore, IR_ml_feature_store } from "./IR_ml_feature_store";

export class R_ml_feature_store implements IR_ml_feature_store {
  constructor(private db: Pool) {}

  async create(f: IMlFeatureStore): Promise<IMlFeatureStore> {
    const query = `
      INSERT INTO ml_feature_store (bu_id, entity_type, entity_id, feature_name, feature_value, created_by, last_upd_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      f.bu_id, f.entity_type, f.entity_id, f.feature_name, JSON.stringify(f.feature_value),
      f.created_by || null, f.last_upd_by || null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<IMlFeatureStore | null> {
    const { rows } = await this.db.query(`SELECT * FROM ml_feature_store WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByEntityAndFeature(entityType: string, entityId: string, featureName: string): Promise<IMlFeatureStore | null> {
    const { rows } = await this.db.query(
      `SELECT * FROM ml_feature_store WHERE entity_type = $1 AND entity_id = $2 AND feature_name = $3`,
      [entityType, entityId, featureName]
    );
    return rows[0] || null;
  }

  async getByEntity(entityType: string, entityId: string): Promise<IMlFeatureStore[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM ml_feature_store WHERE entity_type = $1 AND entity_id = $2 ORDER BY created DESC`,
      [entityType, entityId]
    );
    return rows;
  }

  async getAll(buId: string): Promise<IMlFeatureStore[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM ml_feature_store WHERE bu_id = $1 ORDER BY created DESC`,
      [buId]
    );
    return rows;
  }

  async update(rowId: string, f: Partial<IMlFeatureStore>): Promise<IMlFeatureStore | null> {
    const query = `
      UPDATE ml_feature_store
      SET feature_value = COALESCE($1, feature_value),
          last_upd = now(),
          last_upd_by = $2,
          modification_num = modification_num + 1
      WHERE row_id = $3
      RETURNING *;
    `;
    const values = [
      f.feature_value ? JSON.stringify(f.feature_value) : null,
      f.last_upd_by || null,
      rowId
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM ml_feature_store WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
