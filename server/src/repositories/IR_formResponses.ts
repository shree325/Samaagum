import { IBaseRepository } from './IBaseRepository';

export interface IFormResponse {
  response_id?: string;
  form_id: string;
  respondent_user_id?: string | null;
  context_refs?: any;
  submitted_at?: Date;
  ip_address?: string | null;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_formResponses extends IBaseRepository<IFormResponse> {
  findByFormId(formId: string): Promise<IFormResponse[]>;
  findByRespondentUserId(respondentUserId: string): Promise<IFormResponse[]>;
}
