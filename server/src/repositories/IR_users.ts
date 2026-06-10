import { IBaseRepository } from './IBaseRepository';

export interface IUser {
  user_id?: string;
  primary_email: string;
  password_hash?: string | null;
  locale?: string | null;
  preferred_language?: string | null;
  state?: 'pending' | 'active' | 'suspended' | 'deleted';
  phone_number?: string | null;
  activated_at?: Date | null;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_users extends IBaseRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}
