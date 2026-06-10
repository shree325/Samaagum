import { IBaseRepository } from './IBaseRepository';

export interface ISubscription {
  subscription_id?: string;
  plan_id: string;
  owner_entity_id: string;
  sub_name: string;
  sub_description: any;
  valid_from?: Date;
  valid_to?: Date | null;
  state?: string;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_subscriptions extends IBaseRepository<ISubscription> {
  findByOwnerEntityId(ownerEntityId: string): Promise<ISubscription[]>;
  findByPlanId(planId: string): Promise<ISubscription[]>;
  findByState(state: string): Promise<ISubscription[]>;
}
