import prisma from '../config/prisma';
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IAdminPosition, IR_adminPositions } from './IR_adminPositions';

export class R_adminPositions
    extends PostgresBaseRepository<IAdminPosition>
    implements IR_adminPositions
{
    constructor() {
        super('admin_positions', 'id');
    }

    async findActive(): Promise<IAdminPosition[]> {
        const rows = await prisma.$queryRawUnsafe<IAdminPosition[]>(
            `SELECT * FROM admin_positions WHERE is_active = true ORDER BY hierarchy_level ASC`
        );
        return rows;
    }
}
