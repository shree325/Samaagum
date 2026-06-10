import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IMediaAsset, IR_mediaAssets } from './IR_mediaAssets';
import pool from '../config/database';

export class R_mediaAssets extends PostgresBaseRepository<IMediaAsset> implements IR_mediaAssets {
  constructor() {
    super('media_assets', 'asset_id');
  }

  async findByOwnerEntityId(ownerEntityId: string): Promise<IMediaAsset[]> {
    const query = `SELECT * FROM media_assets WHERE owner_entity_id = $1`;
    const { rows } = await pool.query(query, [ownerEntityId]);
    return rows;
  }

  async findByStorageKey(storageKey: string): Promise<IMediaAsset | null> {
    const query = `SELECT * FROM media_assets WHERE storage_key = $1`;
    const { rows } = await pool.query(query, [storageKey]);
    return rows[0] || null;
  }
}
