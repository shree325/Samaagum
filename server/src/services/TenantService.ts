import pool from '../config/database';
import { R_tenants } from '../repositories/R_tenants';
import { ITenant } from '../repositories/IR_tenants';

export class TenantService {
  private tenantRepo: R_tenants;

  constructor() {
    this.tenantRepo = new R_tenants(pool);
  }

  async create(tenant: Partial<ITenant>): Promise<ITenant> {
    if (!tenant.slug || !tenant.name) {
      throw new Error('slug and name are required');
    }
    const existing = await this.tenantRepo.getBySlug(tenant.slug);
    if (existing) throw new Error('Tenant with this slug already exists');
    return this.tenantRepo.create(tenant as ITenant);
  }

  async getById(id: string): Promise<ITenant | null> {
    return this.tenantRepo.getById(id);
  }

  async getBySlug(slug: string): Promise<ITenant | null> {
    return this.tenantRepo.getBySlug(slug);
  }

  async getAll(): Promise<ITenant[]> {
    return this.tenantRepo.getAll();
  }

  async update(id: string, updates: Partial<ITenant>): Promise<ITenant | null> {
    return this.tenantRepo.update(id, updates);
  }
}
