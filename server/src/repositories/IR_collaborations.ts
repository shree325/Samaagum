export interface ICollaboration {
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

export interface IR_collaborations {
  create(collab: ICollaboration): Promise<ICollaboration>;
  getById(id: string): Promise<ICollaboration | null>;
  getByEntityId(entityId: string): Promise<ICollaboration | null>;
  getBySlug(tenantId: string, slug: string): Promise<ICollaboration | null>;
  getAll(): Promise<ICollaboration[]>;
  update(id: string, collab: Partial<ICollaboration>): Promise<ICollaboration | null>;
  delete(id: string): Promise<boolean>;
}
