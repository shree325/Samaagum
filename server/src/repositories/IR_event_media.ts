export interface IEventMedia {
  id?: string;
  tenant_id: string;

  event_id: string;
  asset_id: string;

  media_type?: string;
  caption?: string | null;
  alt_text?: string | null;

  sort_order?: number;
  visibility?: string;
  is_primary?: boolean;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_event_media {
  create(media: IEventMedia): Promise<IEventMedia>;
  getById(id: string): Promise<IEventMedia | null>;
  getByEventId(eventId: string): Promise<IEventMedia[]>;
  getAll(): Promise<IEventMedia[]>;
  update(id: string, media: Partial<IEventMedia>): Promise<IEventMedia | null>;
  delete(id: string): Promise<boolean>;
}
