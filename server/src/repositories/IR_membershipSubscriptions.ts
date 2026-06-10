import { IBaseRepository } from './IBaseRepository';

export interface IMembershipSubscription {
  subscription_id?: string;
  tenant_id: string;
  tier_id: string;
  user_id: string;
  status?: string;
  valid_from?: Date;
  valid_to?: Date | null;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_membershipSubscriptions extends IBaseRepository<IMembershipSubscription> {
  findByUserId(userId: string): Promise<IMembershipSubscription[]>;
  findByTierId(tierId: string): Promise<IMembershipSubscription[]>;
}
