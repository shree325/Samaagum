import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IGallery, IR_galleries } from './IR_galleries';
import prisma from '../config/prisma';

export class R_galleries extends PostgresBaseRepository<IGallery> implements IR_galleries {
  constructor() {
    super('galleries', 'gallery_id');
  }

  async findByOwnerEntityId(ownerEntityId: string): Promise<IGallery[]> {
    const query = `SELECT * FROM galleries WHERE owner_entity_id = $1`;
    const { rows } = await prisma.query(query, [ownerEntityId]);
    return rows;
  }
}
