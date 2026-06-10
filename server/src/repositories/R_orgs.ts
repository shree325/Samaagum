import { Pool } from "pg";
import { IOrg, IR_orgs } from "./IR_orgs";

export class R_orgs implements IR_orgs {
  constructor(private db: Pool) {}

  async create(o: IOrg): Promise<IOrg> {
    const query = `INSERT INTO orgs (tenant_id, entity_id, legal_name, display_name, branding, support_email, support_phone, status, owner_entity_id, x_data, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *;`;
    const values = [o.tenant_id, o.entity_id, o.legal_name, o.display_name, o.branding ? JSON.stringify(o.branding) : null, o.support_email, o.support_phone, o.status, o.owner_entity_id, o.x_data ? JSON.stringify(o.x_data) : null, o.created_by, o.updated_by];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IOrg | null> {
    const result = await this.db.query(`SELECT * FROM orgs WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByEntityId(entityId: string): Promise<IOrg | null> {
    const result = await this.db.query(`SELECT * FROM orgs WHERE entity_id = $1`, [entityId]);
    return result.rows[0] || null;
  }

  async getAll(): Promise<IOrg[]> {
    const result = await this.db.query(`SELECT * FROM orgs ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, o: Partial<IOrg>): Promise<IOrg | null> {
    const result = await this.db.query(
      `UPDATE orgs SET display_name = COALESCE($1, display_name), branding = COALESCE($2, branding), support_email = COALESCE($3, support_email), support_phone = COALESCE($4, support_phone), status = COALESCE($5, status), updated_at = now(), updated_by = $6 WHERE id = $7 RETURNING *;`,
      [o.display_name, o.branding ? JSON.stringify(o.branding) : null, o.support_email, o.support_phone, o.status, o.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM orgs WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
