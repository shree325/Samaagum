export interface IMediaAsset {
  row_id?: string;
  bu_id: string;

  owner_type: string;
  owner_id: string;
  file_url: string;
  mime_type?: string | null;
  file_size?: number | null;
  x_data?: Record<string, unknown> | null;

  created?: Date;
  created_by?: string | null;
  last_upd?: Date;
  last_upd_by?: string | null;
  modification_num?: number;
  conflict_id?: string;
  db_last_upd?: Date;
  db_last_upd_src?: string;
}

export interface IR_media_assets {
  create(asset: IMediaAsset): Promise<IMediaAsset>;
  getById(rowId: string): Promise<IMediaAsset | null>;
  getByOwner(ownerType: string, ownerId: string): Promise<IMediaAsset[]>;
  getAll(buId: string): Promise<IMediaAsset[]>;
  update(rowId: string, asset: Partial<IMediaAsset>): Promise<IMediaAsset | null>;
  delete(rowId: string): Promise<boolean>;
}
