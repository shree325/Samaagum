import { IBaseRepository } from './IBaseRepository';

export interface IUserConsent {
  consent_id?: string;
  user_id: string;
  consent_type: string;
  version: string;
  granted_at?: Date;
  revoked_at?: Date | null;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_userConsents extends IBaseRepository<IUserConsent> {
  findByUserId(userId: string): Promise<IUserConsent[]>;
  findByConsentType(consentType: string): Promise<IUserConsent[]>;
}
