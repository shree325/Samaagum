export interface IEntityPage {
  id?: string;
  tenant_id: string;

  owner_entity_id: string;

  page_type?: string;
  slug: string;
  title: string;
  content_blocks?: Record<string, unknown>[] | null;

  listed?: boolean;
  status?: string;
  published_at?: Date | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_entity_pages {
  create(page: IEntityPage): Promise<IEntityPage>;
  getById(id: string): Promise<IEntityPage | null>;
  getByOwnerEntityId(ownerEntityId: string): Promise<IEntityPage[]>;
  getBySlug(ownerEntityId: string, slug: string): Promise<IEntityPage | null>;
  getAll(): Promise<IEntityPage[]>;
  update(id: string, page: Partial<IEntityPage>): Promise<IEntityPage | null>;
  delete(id: string): Promise<boolean>;
}
