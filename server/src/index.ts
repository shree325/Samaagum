import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import pool from './config/database';
import prisma from './config/prisma';
import { adminRbacRoutes } from './controllers/adminRbacRoutes';
import { subscriptionPlanRoutes } from './controllers/adminSubscriptionPlanRoutes';
import { adminCouponRoutes } from './controllers/adminCouponRoutes';
import { adminSettingsRoutes } from './controllers/adminSettingsRoutes';
import { userSubscriptionRoutes } from './controllers/userSubscriptionRoutes';
import { adminAuthRoutes } from './controllers/adminAuthRoutes';
import { oauthRoutes } from './controllers/oauthRoutes';
import { uploadRoutes } from './controllers/uploadRoutes';
import fastifyMultipart from '@fastify/multipart';
import path from 'path';
import { adminCategoryRoutes } from './controllers/adminCategoryRoutes';
import { adminTagRoutes } from './controllers/adminTagRoutes';
import { adminCityRoutes } from './controllers/adminCityRoutes';
import { adminGeoRoutes } from './controllers/adminGeoRoutes';

import { adminUserRoutes } from './controllers/adminUserRoutes';
import { seedAdminRBAC } from './services/adminRbacSeeder';
import { seedPlatformSettings } from './settings-library/settingsSeeder';
import { startMessaging, stopMessaging, getMessagingHealth } from './services/messagingSocket';
import { messagingTestRoutes } from './controllers/messagingTestRoutes';
import { messagingRoutes } from './controllers/messagingRoutes';
import { connectionRoutes } from './controllers/connectionRoutes';


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

const fastify = Fastify({ logger: true });
const PORT = Number(process.env.PORT) || 3000;

// Register CORS
fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
});

// Register Multipart
fastify.register(fastifyMultipart, {
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Decoupled types for typescript compiling
declare module 'fastify' {
    interface FastifyRequest {
        user?: any;
    }
}

// Register authentication decorator
fastify.decorate('authenticate', async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                request.user = payload;
            }
        } catch (err) {
            console.warn('⚠️ Warning: Failed to decode JWT payload from header.');
        }
    }
});

// Register admin validation decorator
fastify.decorate('requireAdmin', async (request: any, reply: any) => {
    if (!request.user) {
        console.log('requireAdmin: No request.user');
        return reply.status(401).send({
            success: false,
            message: 'Unauthorized: Authentication required'
        });
    }
    const role = String(request.user.role || '').toLowerCase();
    const isAdmin = role.includes('admin') || role.includes('host') || role.includes('organizer') || role === 'super_admin';
    if (!isAdmin) {
        return reply.status(403).send({
            success: false,
            message: 'Access Denied: Administrative privileges required'
        });
    }
});

// Register routing plugins
fastify.register(adminAuthRoutes, { prefix: '/api/admin' });
fastify.register(oauthRoutes, { prefix: '/api/auth' });
fastify.register(adminRbacRoutes, { prefix: '/api/admin/rbac' });
fastify.register(subscriptionPlanRoutes, { prefix: '/api/admin' });
fastify.register(adminCouponRoutes, { prefix: '/api/admin' });
fastify.register(adminCategoryRoutes, { prefix: '/api/admin' });
fastify.register(adminTagRoutes, { prefix: '/api/admin' });
fastify.register(adminUserRoutes, { prefix: '/api/admin' });
fastify.register(adminSettingsRoutes, { prefix: '/api/admin' });
fastify.register(adminCityRoutes, { prefix: '/api/admin' });
fastify.register(adminGeoRoutes, { prefix: '/api/admin' });

fastify.register(userSubscriptionRoutes, { prefix: '/api/subscription' });
fastify.register(uploadRoutes, { prefix: '/api' });
import { publicRoutes } from './controllers/publicRoutes';
fastify.register(publicRoutes, { prefix: '/api/public' });
fastify.register(messagingTestRoutes, { prefix: '/api/test' });
fastify.register(messagingRoutes, { prefix: '/api/messaging' });
fastify.register(connectionRoutes, { prefix: '/api/connections' });

// Health check route
fastify.get('/health', async (request, reply) => {
    try {
        const result = await pool.query('SELECT NOW()');
        const messagingHealth = getMessagingHealth();
        return {
            status: 'OK',
            message: 'Samaagum Backend is running and database is connected.',
            dbTime: result.rows[0].now,
            messaging: messagingHealth
        };
    } catch (error: any) {
        return reply.status(500).send({
            status: 'ERROR',
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Graceful shutdown helper
const handleShutdown = async (signal: string) => {
    console.log(`\n📶 Received ${signal}. Starting graceful shutdown...`);
    try {
        await stopMessaging();
        await prisma.$disconnect();
        await fastify.close();
        console.log('🏁 Server and messaging module shut down cleanly.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during graceful shutdown:', err);
        process.exit(1);
    }
};

// Register shutdown event listeners
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Start the server
const start = async () => {
    try {
        console.log('🔍 Bootstrap Guard: Checking database connection...');
        await prisma.$connect();
        console.log('✅ Database is ready.');

        console.log('🔍 Bootstrap Guard: Initializing Socket.IO...');
        const io = new Server(fastify.server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });
        (fastify as any).io = io;
        console.log('✅ Socket.IO server created.');

        await startMessaging(io);

        await fastify.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`🔗 Health check available at http://localhost:${PORT}/health`);
        // Trigger reload comment - restart 2
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
    console.log(`📡 Received ${signal}. Gracefully shutting down...`);
    try {
        await fastify.close();
        console.log('🔌 Fastify server closed.');
        await prisma.$disconnect();
        console.log('📦 Database connection closed.');
        
        if (signal === 'SIGUSR2') {
            // Signal nodemon that we are done cleaning up and ready to restart
            process.kill(process.pid, 'SIGUSR2');
        } else {
            process.exit(0);
        }
    } catch (err) {
        console.error('❌ Error during graceful shutdown:', err);
        process.exit(1);
    }
};

// Listen for termination signals
process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

start();