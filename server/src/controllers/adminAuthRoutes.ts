import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import crypto from 'crypto';
import prisma from '../config/prisma';

/**
 * Hash an access key the same way the seeder does — simple SHA-256.
 * Not bcrypt intentionally: these are machine-generated keys, not user passwords.
 */
function hashKey(plain: string): string {
    return crypto.createHash('sha256').update(plain).digest('hex');
}

export const adminAuthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

    // POST /auth/login — Admin credential login (no OTP)
    fastify.post('/auth/login', async (request: any, reply) => {
        try {
            const { email, accessKey } = request.body as { email: string; accessKey: string };

            if (!email || !accessKey) {
                return reply.status(400).send({
                    success: false,
                    message: 'Email and access key are required.'
                });
            }

            // Load admin credentials from platform_settings (seeded by adminRbacSeeder)
            const credRow = await prisma.platform_settings.findFirst({
                where: { scope_tenant_id: null, key: 'admin_credentials' }
            });

            if (!credRow || !credRow.value) {
                return reply.status(503).send({
                    success: false,
                    message: 'Admin credentials not configured. Please run: npm run seed'
                });
            }

            const credentials: Array<{
                email: string;
                keyHash: string;
                role: string;
                name: string;
                userId: string;
                tenantId: string;
                roleId: string;
            }> = (credRow.value as any).admins || [];

            // Find matching admin by email (case-insensitive)
            const adminRecord = credentials.find(
                (c) => c.email.toLowerCase() === email.toLowerCase()
            );

            if (!adminRecord) {
                return reply.status(401).send({
                    success: false,
                    message: 'Invalid email or access key.'
                });
            }

            // Verify access key
            const inputHash = hashKey(accessKey.trim());
            if (inputHash !== adminRecord.keyHash) {
                return reply.status(401).send({
                    success: false,
                    message: 'Invalid email or access key.'
                });
            }

            // Build token payload
            const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
            const payload = Buffer.from(JSON.stringify({
                id: adminRecord.userId,
                tenantId: adminRecord.tenantId,
                email: adminRecord.email,
                role: adminRecord.role,
                roleId: adminRecord.roleId,
                name: adminRecord.name
            })).toString('base64url');
            const token = `${header}.${payload}.mocksignature`;

            console.log(`✅ Admin login: ${adminRecord.email} (${adminRecord.role})`);

            return {
                success: true,
                token,
                user: {
                    id: adminRecord.userId,
                    email: adminRecord.email,
                    role: adminRecord.role,
                    name: adminRecord.name
                }
            };

        } catch (error: any) {
            return reply.status(500).send({
                success: false,
                message: error.message || 'Login failed.'
            });
        }
    });
};

export default adminAuthRoutes;
