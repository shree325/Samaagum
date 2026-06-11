import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IMediaAsset, IR_media_assets } from './IR_media_assets';
import pool from '../config/database';

export class R_media_assets extends PostgresBaseRepository<IMediaAsset> implements IR_media_assets {
  constructor() {
    super('media_assets', 'asset_id');
  }

  async findByOwnerEntity(ownerEntityId: string): Promise<IMediaAsset[]> {
    const { rows } = await pool.query(
      `SELECT * FROM media_assets WHERE owner_entity_id = $1 ORDER BY created_at DESC`,
      [ownerEntityId]
    );
    return rows;
  }

  async findByStorageKey(storageKey: string): Promise<IMediaAsset | null> {
    const { rows } = await pool.query(
      `SELECT * FROM media_assets WHERE storage_key = $1`,
      [storageKey]
    );
    return rows[0] || null;
  }

  async findByTenant(tenantId: string): Promise<IMediaAsset[]> {
    const { rows } = await pool.query(
      `SELECT * FROM media_assets WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    return rows;
  }
}
