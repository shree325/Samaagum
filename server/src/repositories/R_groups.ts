import prisma from '../config/prisma';
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IGroup, IR_groups } from './IR_groups';

export class R_groups extends PostgresBaseRepository<IGroup> implements IR_groups {
    constructor() {
        super('groups', 'entity_id');
    }

    async findBySlug(slug: string): Promise<IGroup | null> {
        return (this.dbModel as any).findFirst({
            where: { slug }
        });
    }

    async getPublicGroups(): Promise<IGroup[]> {
        return (this.dbModel as any).findMany({
            where: { listed: 'listed' },
            include: { entities: { select: { visibility: true } } }
        });
    }
}
