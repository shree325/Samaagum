
export interface IUser {
  id?: string;
  tenant_id: string;
  primary_email?: string | null;
  email_verified?: boolean;
  state?: string;
  locale?: string;
  preferred_currency?: string | null;
  gender?: string | null;
  dob?: string | null;
  phone_e164?: string | null;
  profile_completed?: boolean;
  activated_at?: Date | null;
  deleted_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_users {
  create(user: IUser): Promise<IUser>;
  getById(id: string): Promise<IUser | null>;
  getByEmail(tenantId: string, email: string): Promise<IUser | null>;
  getByTenant(tenantId: string): Promise<IUser[]>;
  update(id: string, user: Partial<IUser>): Promise<IUser | null>;
  softDelete(id: string): Promise<IUser | null>;
  activate(id: string): Promise<IUser | null>;
}
