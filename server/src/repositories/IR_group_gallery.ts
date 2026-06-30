export interface IGroupGallery {
  id: string;
  tenant_id: string;
  group_id: string;
  uploader_user_id: string;
  url: string;
  type: string;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_group_gallery {
  create(data: Partial<IGroupGallery>): Promise<IGroupGallery>;
  getById(id: string): Promise<IGroupGallery | null>;
  delete(id: string): Promise<boolean>;
  findMany(filter?: object): Promise<IGroupGallery[]>;
}
