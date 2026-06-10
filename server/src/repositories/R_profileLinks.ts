import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IProfileLink, IR_profileLinks } from './IR_profileLinks';
import pool from '../config/database';

export class R_profileLinks extends PostgresBaseRepository<IProfileLink> implements IR_profileLinks {
  constructor() {
    super('profile_links', 'link_id');
  }

  async findByProfileId(profileId: string): Promise<IProfileLink[]> {
    const query = `SELECT * FROM profile_links WHERE profile_id = $1 ORDER BY position ASC`;
    const { rows } = await pool.query(query, [profileId]);
    return rows;
  }

  async findByKind(kind: string): Promise<IProfileLink[]> {
    const query = `SELECT * FROM profile_links WHERE kind = $1`;
    const { rows } = await pool.query(query, [kind]);
    return rows;
  }
}
