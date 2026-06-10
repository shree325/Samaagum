import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IProfileRequirement, IR_profileRequirements } from './IR_profileRequirements';
import pool from '../config/database';

export class R_profileRequirements extends PostgresBaseRepository<IProfileRequirement> implements IR_profileRequirements {
  constructor() {
    super('profile_requirements', 'requirement_id');
  }

  async findByAttributeKey(attributeKey: string): Promise<IProfileRequirement | null> {
    const query = `SELECT * FROM profile_requirements WHERE attribute_key = $1`;
    const { rows } = await pool.query(query, [attributeKey]);
    return rows[0] || null;
  }

  async findActive(): Promise<IProfileRequirement[]> {
    const query = `SELECT * FROM profile_requirements WHERE active = TRUE`;
    const { rows } = await pool.query(query);
    return rows;
  }
}
