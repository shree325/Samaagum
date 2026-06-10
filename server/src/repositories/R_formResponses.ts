import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IFormResponse, IR_formResponses } from './IR_formResponses';
import pool from '../config/database';

export class R_formResponses extends PostgresBaseRepository<IFormResponse> implements IR_formResponses {
  constructor() {
    super('form_responses', 'response_id');
  }

  async findByFormId(formId: string): Promise<IFormResponse[]> {
    const query = `SELECT * FROM form_responses WHERE form_id = $1`;
    const { rows } = await pool.query(query, [formId]);
    return rows;
  }

  async findByRespondentUserId(respondentUserId: string): Promise<IFormResponse[]> {
    const query = `SELECT * FROM form_responses WHERE respondent_user_id = $1`;
    const { rows } = await pool.query(query, [respondentUserId]);
    return rows;
  }
}
