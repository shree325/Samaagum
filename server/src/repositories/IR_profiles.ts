export interface IProfile {
  user_id: string;
  tenant_id: string;
  display_name?: string | null;
  bio?: string | null;
  photo_asset_id?: string | null;
  cover_asset_id?: string | null;
  preferred_location?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  template_key?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_profiles {
  create(profile: IProfile): Promise<IProfile>;
  getByUserId(userId: string): Promise<IProfile | null>;
  update(userId: string, profile: Partial<IProfile>): Promise<IProfile | null>;
  delete(userId: string): Promise<boolean>;
}
