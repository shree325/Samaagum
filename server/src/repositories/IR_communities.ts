export interface ICommunity {
  id?: string;
  tenant_id: string;
  entity_id: string;

  name: string;
  slug: string;
  description?: string | null;
  cover_asset_id?: string | null;

  visibility?: string;
  status?: string;
  member_count?: number;

  x_data?: Record<string, unknown> | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_communities {
  create(community: ICommunity): Promise<ICommunity>;
  getById(id: string): Promise<ICommunity | null>;
  getByEntityId(entityId: string): Promise<ICommunity | null>;
  getBySlug(tenantId: string, slug: string): Promise<ICommunity | null>;
  getAll(): Promise<ICommunity[]>;
  update(id: string, community: Partial<ICommunity>): Promise<ICommunity | null>;
  delete(id: string): Promise<boolean>;
}
