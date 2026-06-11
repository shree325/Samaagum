import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IForm, IR_forms } from './IR_forms';
import prisma from '../config/prisma';

export class R_forms extends PostgresBaseRepository<IForm> implements IR_forms {
  constructor() {
    super('forms', 'form_id');
  }

  async findByOwnerEntityId(ownerEntityId: string): Promise<IForm[]> {
    const query = `SELECT * FROM forms WHERE owner_entity_id = $1`;
    const { rows } = await prisma.query(query, [ownerEntityId]);
    return rows;
  }

  async findByPurpose(purpose: string): Promise<IForm[]> {
    const query = `SELECT * FROM forms WHERE purpose = $1`;
    const { rows } = await prisma.query(query, [purpose]);
    return rows;
  }
}
