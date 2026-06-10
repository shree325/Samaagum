import { IBaseRepository } from './IBaseRepository';

export interface IAuthIdentity {
  identity_id?: string;
  user_id: string;
  provider: string;
  provider_uid: string;
  provider_email?: string | null;
  password_hash?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_authIdentities extends IBaseRepository<IAuthIdentity> {
  findByUserId(userId: string): Promise<IAuthIdentity[]>;
  findByProvider(provider: string, providerUid: string): Promise<IAuthIdentity | null>;
}
