export interface ITenant {
  id?: string;
  slug: string;
  name: string;
  status?: string;
  default_currency?: string;
  default_locale?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_tenants {
  create(tenant: ITenant): Promise<ITenant>;
  getById(id: string): Promise<ITenant | null>;
  getBySlug(slug: string): Promise<ITenant | null>;
  getAll(): Promise<ITenant[]>;
  update(id: string, tenant: Partial<ITenant>): Promise<ITenant | null>;
}
