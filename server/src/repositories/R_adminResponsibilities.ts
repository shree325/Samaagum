import prisma from '../config/prisma';
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IAdminResponsibility, IR_adminResponsibilities } from './IR_adminResponsibilities';

export class R_adminResponsibilities
    extends PostgresBaseRepository<IAdminResponsibility>
    implements IR_adminResponsibilities
{
    constructor() {
        super('admin_responsibilities', 'id');
    }

    async findByCategory(category: string): Promise<IAdminResponsibility[]> {
        const { rows } = await prisma.$queryRawUnsafe<IAdminResponsibility[]>(
            `SELECT * FROM admin_responsibilities WHERE category = $1 ORDER BY sort_order ASC`,
            category
        ).then(rows => ({ rows: rows as IAdminResponsibility[] }));
        return rows;
    }

    async findActive(): Promise<IAdminResponsibility[]> {
        const rows = await prisma.$queryRawUnsafe<IAdminResponsibility[]>(
            `SELECT * FROM admin_responsibilities WHERE is_active = true ORDER BY category, sort_order`
        );
        return rows;
    }

    async findByIds(ids: string[]): Promise<IAdminResponsibility[]> {
        if (ids.length === 0) return [];
        const rows = await prisma.$queryRawUnsafe<IAdminResponsibility[]>(
            `SELECT * FROM admin_responsibilities WHERE id = ANY($1::uuid[])`,
            ids
        );
        return rows;
    }
}
