import { IBaseRepository } from './IBaseRepository';

export interface IGallery {
  gallery_id?: string;
  tenant_id: string;
  owner_entity_id: string;
  name: string;
  description?: any;
  visibility?: string;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_galleries extends IBaseRepository<IGallery> {
  findByOwnerEntityId(ownerEntityId: string): Promise<IGallery[]>;
}
