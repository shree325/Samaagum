import { IBaseRepository } from './IBaseRepository';

export interface IMediaAsset {
  asset_id?: string;
  tenant_id: string;
  owner_entity_id: string;
  storage_key: string;
  mime: string;
  visibility?: string;
  file_name?: string | null;
  size_bytes?: number | null;
  file_data?: Buffer | null;
  metadata?: any;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_mediaAssets extends IBaseRepository<IMediaAsset> {
  findByOwnerEntityId(ownerEntityId: string): Promise<IMediaAsset[]>;
  findByStorageKey(storageKey: string): Promise<IMediaAsset | null>;
}
