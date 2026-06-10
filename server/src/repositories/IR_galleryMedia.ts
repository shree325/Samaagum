import { IBaseRepository } from './IBaseRepository';

export interface IGalleryMedia {
  media_id?: string;
  tenant_id: string;
  gallery_id: string;
  asset_id: string;
  visibility?: string;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_galleryMedia extends IBaseRepository<IGalleryMedia> {
  findByGalleryId(galleryId: string): Promise<IGalleryMedia[]>;
  findByAssetId(assetId: string): Promise<IGalleryMedia[]>;
}
