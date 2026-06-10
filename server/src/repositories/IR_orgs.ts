export interface IOrg {
  id?: string;
  tenant_id: string;
  entity_id: string;

  legal_name: string;
  display_name: string;
  branding?: Record<string, unknown> | null;

  support_email?: string | null;
  support_phone?: string | null;

  status?: string;
  owner_entity_id?: string | null;

  x_data?: Record<string, unknown> | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_orgs {
  create(org: IOrg): Promise<IOrg>;
  getById(id: string): Promise<IOrg | null>;
  getByEntityId(entityId: string): Promise<IOrg | null>;
  getAll(): Promise<IOrg[]>;
  update(id: string, org: Partial<IOrg>): Promise<IOrg | null>;
  delete(id: string): Promise<boolean>;
}
