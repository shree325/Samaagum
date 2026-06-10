export interface IOrgDomain {
  id?: string;
  tenant_id: string;

  org_entity_id: string;

  domain_name: string;
  verification_status?: string;
  verified_at?: Date | null;
  is_primary?: boolean;
  dns_record?: Record<string, unknown> | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_org_domains {
  create(domain: IOrgDomain): Promise<IOrgDomain>;
  getById(id: string): Promise<IOrgDomain | null>;
  getByOrgEntityId(orgEntityId: string): Promise<IOrgDomain[]>;
  getByDomainName(domainName: string): Promise<IOrgDomain | null>;
  getAll(): Promise<IOrgDomain[]>;
  update(id: string, domain: Partial<IOrgDomain>): Promise<IOrgDomain | null>;
  delete(id: string): Promise<boolean>;
}
