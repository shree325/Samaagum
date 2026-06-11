import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IMembershipTier, IR_membershipTiers } from './IR_membershipTiers';
import prisma from '../config/prisma';

export class R_membershipTiers extends PostgresBaseRepository<IMembershipTier> implements IR_membershipTiers {
  constructor() {
    super('membership_tiers', 'tier_id');
  }

  async findByEntityId(entityId: string): Promise<IMembershipTier[]> {
    const query = `SELECT * FROM membership_tiers WHERE entity_id = $1`;
    const { rows } = await prisma.query(query, [entityId]);
    return rows;
  }
}
