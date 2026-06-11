import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IFormField, IR_formFields } from './IR_formFields';
import prisma from '../config/prisma';

export class R_formFields extends PostgresBaseRepository<IFormField> implements IR_formFields {
  constructor() {
    super('form_fields', 'field_id');
  }

  async findByFormId(formId: string): Promise<IFormField[]> {
    const query = `SELECT * FROM form_fields WHERE form_id = $1 ORDER BY position ASC`;
    const { rows } = await prisma.query(query, [formId]);
    return rows;
  }
}
