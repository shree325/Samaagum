export interface ISubCommunity {
  id?: string;
  tenant_id: string;
  entity_id: string;
  community_entity_id: string;

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

export interface IR_sub_communities {
  create(sub: ISubCommunity): Promise<ISubCommunity>;
  getById(id: string): Promise<ISubCommunity | null>;
  getByCommunityEntityId(communityEntityId: string): Promise<ISubCommunity[]>;
  getBySlug(tenantId: string, slug: string): Promise<ISubCommunity | null>;
  getAll(): Promise<ISubCommunity[]>;
  update(id: string, sub: Partial<ISubCommunity>): Promise<ISubCommunity | null>;
  delete(id: string): Promise<boolean>;
}
