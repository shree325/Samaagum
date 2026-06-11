import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IFormResponseValue, IR_formResponseValues } from './IR_formResponseValues';
import prisma from '../config/prisma';

export class R_formResponseValues extends PostgresBaseRepository<IFormResponseValue> implements IR_formResponseValues {
  constructor() {
    super('form_response_values', 'value_id');
  }

  async findByResponseId(responseId: string): Promise<IFormResponseValue[]> {
    const query = `SELECT * FROM form_response_values WHERE response_id = $1`;
    const { rows } = await prisma.query(query, [responseId]);
    return rows;
  }

  async findByFieldId(fieldId: string): Promise<IFormResponseValue[]> {
    const query = `SELECT * FROM form_response_values WHERE field_id = $1`;
    const { rows } = await prisma.query(query, [fieldId]);
    return rows;
  }
}
