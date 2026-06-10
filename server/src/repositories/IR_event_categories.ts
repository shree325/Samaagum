export interface IEventCategory {
  id?: string;
  tenant_id: string;

  name: string;
  description?: string | null;
  icon_url?: string | null;

  status?: string;
  display_order?: number;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_event_categories {
  create(category: IEventCategory): Promise<IEventCategory>;
  getById(id: string): Promise<IEventCategory | null>;
  getAll(): Promise<IEventCategory[]>;
  update(id: string, category: Partial<IEventCategory>): Promise<IEventCategory | null>;
  delete(id: string): Promise<boolean>;
}