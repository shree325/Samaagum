import prisma from '../config/prisma';
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IAdminCoupon, IR_adminCoupons } from './IR_adminCoupons';

export class R_adminCoupons
    extends PostgresBaseRepository<IAdminCoupon>
    implements IR_adminCoupons
{
    constructor() {
        super('admin_coupons', 'id');
    }

    async findByCode(code: string, tenantId?: string | null): Promise<IAdminCoupon | null> {
        const rows = tenantId
            ? await prisma.$queryRawUnsafe<IAdminCoupon[]>(
                `SELECT * FROM admin_coupons WHERE code = $1 AND tenant_id = $2 LIMIT 1`,
                code.toUpperCase().trim(), tenantId
              )
            : await prisma.$queryRawUnsafe<IAdminCoupon[]>(
                `SELECT * FROM admin_coupons WHERE code = $1 LIMIT 1`,
                code.toUpperCase().trim()
              );
        return rows[0] || null;
    }

    async incrementUsage(id: string): Promise<void> {
        await prisma.$executeRawUnsafe(
            `UPDATE admin_coupons SET usage_count = usage_count + 1, updated_at = now() WHERE id = $1::uuid`,
            id
        );
    }
}
