import { IBaseRepository } from './IBaseRepository';

export interface IFormField {
  field_id?: string;
  form_id: string;
  field_type: string;
  label: string;
  required?: boolean;
  options?: any;
  level?: number;
  conditions?: any;
  position: number;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_formFields extends IBaseRepository<IFormField> {
  findByFormId(formId: string): Promise<IFormField[]>;
}
