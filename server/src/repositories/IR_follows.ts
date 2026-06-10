export interface IFollow {
  id?: string;
  tenant_id: string;

  user_id: string;
  entity_id: string;

  follow_state?: string;
  muted?: boolean;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_follows {
  create(follow: IFollow): Promise<IFollow>;
  getById(id: string): Promise<IFollow | null>;
  getByUserId(userId: string): Promise<IFollow[]>;
  getByEntityId(entityId: string): Promise<IFollow[]>;
  getByUserAndEntity(userId: string, entityId: string): Promise<IFollow | null>;
  getAll(): Promise<IFollow[]>;
  update(id: string, follow: Partial<IFollow>): Promise<IFollow | null>;
  delete(id: string): Promise<boolean>;
}
