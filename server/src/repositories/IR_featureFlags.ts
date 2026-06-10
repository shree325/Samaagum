import { IBaseRepository } from './IBaseRepository';

export interface IFeatureFlag {
  flag_key: string;
  scope_entity_id: string;
  value?: any;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_featureFlags extends IBaseRepository<IFeatureFlag> {
  findByFlagKey(flagKey: string): Promise<IFeatureFlag[]>;
  findByScopeEntityId(scopeEntityId: string): Promise<IFeatureFlag[]>;
}
