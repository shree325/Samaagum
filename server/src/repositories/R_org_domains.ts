import { Pool } from "pg";
import { IOrgDomain, IR_org_domains } from "./IR_org_domains";

export class R_org_domains implements IR_org_domains {
  constructor(private db: Pool) {}

  async create(d: IOrgDomain): Promise<IOrgDomain> {
    const query = `INSERT INTO org_domains (tenant_id, org_entity_id, domain_name, verification_status, is_primary, dns_record, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *;`;
    const values = [d.tenant_id, d.org_entity_id, d.domain_name, d.verification_status, d.is_primary, d.dns_record ? JSON.stringify(d.dns_record) : null, d.created_by, d.updated_by];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IOrgDomain | null> {
    const result = await this.db.query(`SELECT * FROM org_domains WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByOrgEntityId(orgEntityId: string): Promise<IOrgDomain[]> {
    const result = await this.db.query(`SELECT * FROM org_domains WHERE org_entity_id = $1`, [orgEntityId]);
    return result.rows;
  }

  async getByDomainName(domainName: string): Promise<IOrgDomain | null> {
    const result = await this.db.query(`SELECT * FROM org_domains WHERE domain_name = $1`, [domainName]);
    return result.rows[0] || null;
  }

  async getAll(): Promise<IOrgDomain[]> {
    const result = await this.db.query(`SELECT * FROM org_domains ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, d: Partial<IOrgDomain>): Promise<IOrgDomain | null> {
    const result = await this.db.query(
      `UPDATE org_domains SET verification_status = COALESCE($1, verification_status), verified_at = COALESCE($2, verified_at), is_primary = COALESCE($3, is_primary), dns_record = COALESCE($4, dns_record), updated_at = now(), updated_by = $5 WHERE id = $6 RETURNING *;`,
      [d.verification_status, d.verified_at, d.is_primary, d.dns_record ? JSON.stringify(d.dns_record) : null, d.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM org_domains WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
