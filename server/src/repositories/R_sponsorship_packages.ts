import { Pool } from "pg";
import { ISponsorshipPackage, IR_sponsorship_packages } from "./IR_sponsorship_packages";

export class R_sponsorship_packages implements IR_sponsorship_packages {
  constructor(private db: Pool) {}

  async create(p: ISponsorshipPackage): Promise<ISponsorshipPackage> {
    const query = `INSERT INTO sponsorship_packages (tenant_id, event_id, title, description, display_rank, price_minor, currency, benefits, inventory, status, creative_requirements, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *;`;
    const values = [p.tenant_id, p.event_id, p.title, p.description, p.display_rank, p.price_minor, p.currency, p.benefits ? JSON.stringify(p.benefits) : null, p.inventory, p.status, p.creative_requirements ? JSON.stringify(p.creative_requirements) : null, p.created_by, p.updated_by];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ISponsorshipPackage | null> {
    const result = await this.db.query(`SELECT * FROM sponsorship_packages WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByEventId(eventId: string): Promise<ISponsorshipPackage[]> {
    const result = await this.db.query(`SELECT * FROM sponsorship_packages WHERE event_id = $1 ORDER BY display_rank ASC`, [eventId]);
    return result.rows;
  }

  async getAll(): Promise<ISponsorshipPackage[]> {
    const result = await this.db.query(`SELECT * FROM sponsorship_packages ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, p: Partial<ISponsorshipPackage>): Promise<ISponsorshipPackage | null> {
    const result = await this.db.query(
      `UPDATE sponsorship_packages SET title = COALESCE($1, title), description = COALESCE($2, description), status = COALESCE($3, status), inventory = COALESCE($4, inventory), updated_at = now(), updated_by = $5 WHERE id = $6 RETURNING *;`,
      [p.title, p.description, p.status, p.inventory, p.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM sponsorship_packages WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
