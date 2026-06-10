import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IFeatureFlag, IR_featureFlags } from './IR_featureFlags';
import pool from '../config/database';

export class R_featureFlags extends PostgresBaseRepository<IFeatureFlag> implements IR_featureFlags {
  constructor() {
    super('feature_flags', 'flag_key');
  }

  async findByFlagKey(flagKey: string): Promise<IFeatureFlag[]> {
    const query = `SELECT * FROM feature_flags WHERE flag_key = $1`;
    const { rows } = await pool.query(query, [flagKey]);
    return rows;
  }

  async findByScopeEntityId(scopeEntityId: string): Promise<IFeatureFlag[]> {
    const query = `SELECT * FROM feature_flags WHERE scope_entity_id = $1`;
    const { rows } = await pool.query(query, [scopeEntityId]);
    return rows;
  }
}
