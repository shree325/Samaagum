import { IBaseRepository } from './IBaseRepository';

export interface IProfile {
  user_id: string;
  tenant_id: string;
  display_name: string;
  bio?: string | null;
  preferred_location?: string | null;
  photo_asset_id?: string | null;
  cover_asset_id?: string | null;
  template_key?: string | null;
  website?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_profiles extends IBaseRepository<IProfile> {
  findByDisplayName(displayName: string): Promise<IProfile[]>;
}
