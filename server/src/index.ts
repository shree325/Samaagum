import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import pool from './config/database';
import prisma from './config/prisma';
import { createAdminRbacRouter } from './controllers/adminRbacRoutes';
import { createSubscriptionPlanRouter } from './controllers/adminSubscriptionPlanRoutes';
import { createAdminCouponRouter } from './controllers/adminCouponRoutes';
import { createAdminSettingsRouter } from './controllers/adminSettingsRoutes';
import { createUserSubscriptionRouter } from './controllers/userSubscriptionRoutes';
import { seedAdminRBAC } from './services/adminRbacSeeder';
import { seedPlatformSettings } from './settings-library/settingsSeeder';

dotenv.config();

// Auto-seed if tables are empty
prisma.admin_roles.count()
    .then((count) => {
        if (count === 0) {
            console.log('🔄 Admin RBAC tables are empty. Running seeder...');
            return seedAdminRBAC();
        }
    })
    .then(() => {
        return seedPlatformSettings(async (query: string, params: any[]) => {
            return prisma.$queryRawUnsafe(query, ...params);
        });
    })
    .catch((err) => {
        console.error('❌ Error during auto-seeding:', err.message || err);
    });



const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});

// ── JWT auth and admin middlewares ───────────────────────────────────────
const authenticate = (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                req.user = payload;
            }
        } catch (err) {
            console.warn('⚠️ Warning: Failed to decode JWT payload from header.');
        }
    }
    next();
};
const requireAdmin = (req: any, res: Response, next: NextFunction) => {
    // If a authenticated user exists, make sure they are some form of admin
    if (req.user) {
        const role = String(req.user.role || '').toLowerCase();
        const isAdmin = role.includes('admin') || role.includes('host') || role.includes('organizer');
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access Denied: Administrative privileges required'
            });
        }
    }
    next();
};

// ── Admin RBAC routes ─────────────────────────────────────────────────────
app.use('/api/admin/rbac', createAdminRbacRouter(authenticate, requireAdmin));
app.use('/api/admin', createSubscriptionPlanRouter(authenticate, requireAdmin));
app.use('/api/admin', createAdminCouponRouter(authenticate, requireAdmin));
app.use('/api/admin', createAdminSettingsRouter(authenticate, requireAdmin));
app.use('/api/subscription', createUserSubscriptionRouter(authenticate));

// Basic health check route
app.get('/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            status: 'OK',
            message: 'Samaagum Backend is running and database is connected.',
            dbTime: result.rows[0].now
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Database connection failed',
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🔗 Health check available at http://localhost:${PORT}/health`);
});