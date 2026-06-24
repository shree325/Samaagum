import { PostgresBaseRepository } from './PostgresBaseRepository';
import { ITag, IR_tags } from './IR_tags';
import prisma from '../config/prisma';

export class R_tags extends PostgresBaseRepository<ITag> implements IR_tags {
  constructor() {
    super('tags', 'id');
  }

  async findBySlug(slug: string): Promise<ITag | null> {
    const rows = await prisma.$queryRawUnsafe<ITag[]>(
      'SELECT * FROM tags WHERE slug = $1 LIMIT 1',
      slug
    );

    return rows[0] || null;
  }

  async findByCategory(categoryId: string): Promise<ITag[]> {
    return await prisma.$queryRawUnsafe<ITag[]>(
      'SELECT * FROM tags WHERE category_id = $1',
      categoryId
    );
  }
}