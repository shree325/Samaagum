import { IBaseRepository } from './IBaseRepository';

export interface IProfileRequirementStatus {
  status_id?: string;
  user_id: string;
  requirement_id: string;
  satisfied_at?: Date | null;
  last_prompted_at?: Date | null;
  status?: string;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_profileRequirementStatus extends IBaseRepository<IProfileRequirementStatus> {
  findByUserId(userId: string): Promise<IProfileRequirementStatus[]>;
  findByRequirementId(requirementId: string): Promise<IProfileRequirementStatus[]>;
}
