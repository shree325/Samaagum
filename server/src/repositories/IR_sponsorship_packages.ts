export interface ISponsorshipPackage {
  id?: string;
  tenant_id: string;

  event_id: string;

  title: string;
  description?: string | null;
  display_rank?: number;

  price_minor: number;
  currency: string;

  benefits?: Record<string, unknown> | null;
  inventory?: number;
  status?: string;
  creative_requirements?: Record<string, unknown> | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_sponsorship_packages {
  create(pkg: ISponsorshipPackage): Promise<ISponsorshipPackage>;
  getById(id: string): Promise<ISponsorshipPackage | null>;
  getByEventId(eventId: string): Promise<ISponsorshipPackage[]>;
  getAll(): Promise<ISponsorshipPackage[]>;
  update(id: string, pkg: Partial<ISponsorshipPackage>): Promise<ISponsorshipPackage | null>;
  delete(id: string): Promise<boolean>;
}
