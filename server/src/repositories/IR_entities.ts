export interface IEntity {
  id?: string;
  tenant_id: string;
  entity_type: string;
  parent_entity_id?: string | null;
  user_id?: string | null;
  status?: string;
  visibility?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_entities {
  create(entity: IEntity): Promise<IEntity>;
  getById(id: string): Promise<IEntity | null>;
  getByTenant(tenantId: string): Promise<IEntity[]>;
  getByParent(parentEntityId: string): Promise<IEntity[]>;
  getByType(tenantId: string, entityType: string): Promise<IEntity[]>;
  update(id: string, entity: Partial<IEntity>): Promise<IEntity | null>;
  delete(id: string): Promise<boolean>;
  getOwnerUserId(entityId: string): Promise<string | null>;
  getParentEntityId(entityId: string): Promise<string | null>;
  getVisibility(entityId: string): Promise<string | null>;
  getUserEntity(userId: string): Promise<IEntity | null>;
}


