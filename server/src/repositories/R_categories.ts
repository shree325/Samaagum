import { PostgresBaseRepository } from './PostgresBaseRepository';
import { ICategory, IR_categories } from './IR_categories';
import pool from '../config/database';

export class R_categories extends PostgresBaseRepository<ICategory> implements IR_categories {
  constructor() {
    super('categories', 'category_id');
  }

  async findBySlug(slug: string): Promise<ICategory | null> {
    const query = `SELECT * FROM categories WHERE slug = $1`;
    const { rows } = await pool.query(query, [slug]);
    return rows[0] || null;
  }

  async findByParentId(parentId: string): Promise<ICategory[]> {
    const query = `SELECT * FROM categories WHERE parent_id = $1`;
    const { rows } = await pool.query(query, [parentId]);
    return rows;
  }
}
