import { IBaseRepository } from './IBaseRepository';

export interface IFormResponseValue {
  value_id?: string;
  response_id: string;
  field_id: string;
  value: any;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_formResponseValues extends IBaseRepository<IFormResponseValue> {
  findByResponseId(responseId: string): Promise<IFormResponseValue[]>;
  findByFieldId(fieldId: string): Promise<IFormResponseValue[]>;
}
