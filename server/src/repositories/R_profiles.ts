import { PrismaClient } from '@prisma/client';
import { IProfile, IR_profiles } from './IR_profiles';

export class R_profiles implements IR_profiles {
  constructor(private db: PrismaClient) {}

  async create(profile: IProfile): Promise<IProfile> {
    const query = `
      INSERT INTO profiles (
        user_id, tenant_id, display_name, bio,
        photo_asset_id, cover_asset_id,
        preferred_location, location_lat, location_lng, template_key
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *;
    `;
    const values = [
      profile.user_id, profile.tenant_id, profile.display_name, profile.bio,
      profile.photo_asset_id, profile.cover_asset_id,
      profile.preferred_location, profile.location_lat, profile.location_lng,
      profile.template_key,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getByUserId(userId: string): Promise<IProfile | null> {
    const result = await this.db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  }

  async update(userId: string, profile: Partial<IProfile>): Promise<IProfile | null> {
    const result = await this.db.query(
      `UPDATE profiles SET
        display_name = COALESCE($1, display_name),
        bio = COALESCE($2, bio),
        photo_asset_id = COALESCE($3, photo_asset_id),
        cover_asset_id = COALESCE($4, cover_asset_id),
        preferred_location = COALESCE($5, preferred_location),
        location_lat = COALESCE($6, location_lat),
        location_lng = COALESCE($7, location_lng),
        template_key = COALESCE($8, template_key)
      WHERE user_id = $9
      RETURNING *;`,
      [
        profile.display_name, profile.bio, profile.photo_asset_id, profile.cover_asset_id,
        profile.preferred_location, profile.location_lat, profile.location_lng,
        profile.template_key, userId,
      ]
    );
    return result.rows[0] || null;
  }

  async delete(userId: string): Promise<boolean> {
    const result = await this.db.query('DELETE FROM profiles WHERE user_id = $1', [userId]);
    return (result.rowCount ?? 0) > 0;
  }
}
