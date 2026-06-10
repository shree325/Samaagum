import { IBaseRepository } from './IBaseRepository';

export interface IProfileRequirement {
  requirement_id?: string;
  attribute_key: string;
  audience?: string;
  level?: number;
  revalidate_after?: string | null;
  validation_rule?: any;
  active?: boolean;
  description?: string | null;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_profileRequirements extends IBaseRepository<IProfileRequirement> {
  findByAttributeKey(attributeKey: string): Promise<IProfileRequirement | null>;
  findActive(): Promise<IProfileRequirement[]>;
}
