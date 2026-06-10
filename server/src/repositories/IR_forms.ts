import { IBaseRepository } from './IBaseRepository';

export interface IForm {
  form_id?: string;
  owner_entity_id: string;
  purpose: string;
  status?: string;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_forms extends IBaseRepository<IForm> {
  findByOwnerEntityId(ownerEntityId: string): Promise<IForm[]>;
  findByPurpose(purpose: string): Promise<IForm[]>;
}
