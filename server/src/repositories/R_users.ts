import { Pool } from 'pg';
import { IUser, IR_users } from './IR_users';

export class R_users implements IR_users {
  constructor(private db: Pool) {}

  async create(user: IUser): Promise<IUser> {
    const query = `
      INSERT INTO users (
        tenant_id, primary_email, email_verified, state, locale,
        preferred_currency, gender, dob, phone_e164, profile_completed
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *;
    `;
    const values = [
      user.tenant_id, user.primary_email, user.email_verified ?? false,
      user.state ?? 'provisional', user.locale ?? 'en',
      user.preferred_currency, user.gender, user.dob,
      user.phone_e164, user.profile_completed ?? false,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IUser | null> {
    const result = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getByEmail(tenantId: string, email: string): Promise<IUser | null> {
    const result = await this.db.query(
      'SELECT * FROM users WHERE tenant_id = $1 AND primary_email = $2',
      [tenantId, email]
    );
    return result.rows[0] || null;
  }

  async getByTenant(tenantId: string): Promise<IUser[]> {
    const result = await this.db.query(
      'SELECT * FROM users WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return result.rows;
  }

  async update(id: string, user: Partial<IUser>): Promise<IUser | null> {
    const result = await this.db.query(
      `UPDATE users SET
        primary_email = COALESCE($1, primary_email),
        email_verified = COALESCE($2, email_verified),
        state = COALESCE($3, state),
        locale = COALESCE($4, locale),
        preferred_currency = COALESCE($5, preferred_currency),
        gender = COALESCE($6, gender),
        dob = COALESCE($7, dob),
        phone_e164 = COALESCE($8, phone_e164),
        profile_completed = COALESCE($9, profile_completed)
      WHERE id = $10
      RETURNING *;`,
      [
        user.primary_email, user.email_verified, user.state,
        user.locale, user.preferred_currency, user.gender,
        user.dob, user.phone_e164, user.profile_completed, id,
      ]
    );
    return result.rows[0] || null;
  }

  async softDelete(id: string): Promise<IUser | null> {
    const result = await this.db.query(
      `UPDATE users SET state = 'deleted', deleted_at = now() WHERE id = $1 RETURNING *;`,
      [id]
    );
    return result.rows[0] || null;
  }

  async activate(id: string): Promise<IUser | null> {
    const result = await this.db.query(
      `UPDATE users SET state = 'active', activated_at = now(), profile_completed = true WHERE id = $1 RETURNING *;`,
      [id]
    );
    return result.rows[0] || null;
  }
}
