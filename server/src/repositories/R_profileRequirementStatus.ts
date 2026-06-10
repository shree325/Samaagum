import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IProfileRequirementStatus, IR_profileRequirementStatus } from './IR_profileRequirementStatus';
import pool from '../config/database';

export class R_profileRequirementStatus extends PostgresBaseRepository<IProfileRequirementStatus> implements IR_profileRequirementStatus {
  constructor() {
    super('profile_requirement_status', 'status_id');
  }

  async findByUserId(userId: string): Promise<IProfileRequirementStatus[]> {
    const query = `SELECT * FROM profile_requirement_status WHERE user_id = $1`;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  async findByRequirementId(requirementId: string): Promise<IProfileRequirementStatus[]> {
    const query = `SELECT * FROM profile_requirement_status WHERE requirement_id = $1`;
    const { rows } = await pool.query(query, [requirementId]);
    return rows;
  }
}
