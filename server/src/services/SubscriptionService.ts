import pool from '../config/database';
import { R_subscriptions } from '../repositories/R_subscriptions';
import { R_plans } from '../repositories/R_plans';

export class SubscriptionService {
  private subRepo: R_subscriptions;
  private planRepo: R_plans;

  constructor() {
    this.subRepo = new R_subscriptions(pool);
    this.planRepo = new R_plans(pool);
  }

  async subscribe(data: { tenant_id: string; plan_id: string; owner_entity_id: string; valid_from?: Date; valid_to?: Date }) {
    return this.subRepo.create({ ...data, state: 'active' });
  }

  async cancel(id: string) {
    return this.subRepo.update(id, { state: 'cancelled' });
  }

  async getByEntity(entityId: string) {
    return this.subRepo.findAll({ owner_entity_id: entityId });
  }

  async getPlans() {
    return this.planRepo.findAll();
  }

  async createPlan(data: { key: string; plan_type: string; entitlements?: any }) {
    return this.planRepo.create(data);
  }
}
