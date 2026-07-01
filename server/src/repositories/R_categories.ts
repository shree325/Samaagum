import { PostgresBaseRepository } from './PostgresBaseRepository';
import { ICategory, IR_categories } from './IR_categories';
import prisma from '../config/prisma';

export class R_categories extends PostgresBaseRepository<ICategory> implements IR_categories {
  constructor() {
    super('categories', 'id');
  }

  async findBySlug(slug: string): Promise<ICategory | null> {
    return await prisma.categories.findFirst({
      where: { slug }
    }) as ICategory | null;
  }

  async findByParentId(parentId: string): Promise<ICategory[]> {
    return await prisma.categories.findMany({
      where: { parent_id: parentId }
    }) as ICategory[];
  }
}