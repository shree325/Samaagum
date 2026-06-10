import { IBaseRepository } from './IBaseRepository';

export interface IProfileLink {
  link_id?: string;
  profile_id: string;
  kind: string;
  label: string;
  value: string;
  position?: number;
  visibility?: string;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_profileLinks extends IBaseRepository<IProfileLink> {
  findByProfileId(profileId: string): Promise<IProfileLink[]>;
  findByKind(kind: string): Promise<IProfileLink[]>;
}
