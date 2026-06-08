import { IBaseRepository } from './IBaseRepository';

export interface IUser {
  id?: number;
  name: string;
  email: string;
  password_hash: string;
  created_at?: Date;
}

export interface IR_users extends IBaseRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}
