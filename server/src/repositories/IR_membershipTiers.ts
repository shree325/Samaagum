import { IBaseRepository } from './IBaseRepository';

export interface IMembershipTier {
  tier_id?: string;
  tenant_id: string;
  entity_id: string;
  name: string;
  description?: any;
  is_free?: boolean;
  price?: number;
  currency?: string;
  billing_cycle?: string;
  entitlements?: any;
  status?: string;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_membershipTiers extends IBaseRepository<IMembershipTier> {
  findByEntityId(entityId: string): Promise<IMembershipTier[]>;
}
