import { IBaseRepository } from './IBaseRepository';

export interface ITenant {
  tenant_id?: string;
  slug: string;
  name: string;
  status?: string;
  default_currency?: string;
  default_locale?: string;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_tenants extends IBaseRepository<ITenant> {
  findBySlug(slug: string): Promise<ITenant | null>;
}
