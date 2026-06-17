import prisma from '../config/prisma';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

function hashKey(plain: string): string {
    return crypto.createHash('sha256').update(plain).digest('hex');
}

async function upsertGlobalPlatformSetting(key: string, value: any) {
    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM platform_settings WHERE scope_tenant_id IS NULL AND key = $1 LIMIT 1`,
        key
    );

    if (existing && existing.length > 0) {
        await prisma.$executeRawUnsafe(
            `UPDATE platform_settings SET value = $1::jsonb, updated_at = now() WHERE id = $2::uuid`,
            JSON.stringify(value),
            existing[0].id
        );
    } else {
        await prisma.$executeRawUnsafe(
            `INSERT INTO platform_settings (id, scope_tenant_id, key, value, updated_at)
             VALUES (gen_random_uuid(), null, $1, $2::jsonb, now())`,
            key,
            JSON.stringify(value)
        );
    }
}


const responsibilities = [
    { name: 'dashboard_main', display_name: 'Main Dashboard', description: 'Access to the main dashboard', category: 'dashboard', route_path: '/dashboard', component_name: 'Dashboard', icon_name: 'LayoutDashboard', sort_order: 1 },
    { name: 'events_management', display_name: 'Manage Events', description: 'Access to create and modify community events', category: 'dashboard', route_path: '/admin/events', component_name: 'EventsManagement', icon_name: 'Calendar', sort_order: 2 },
    { name: 'groups_management', display_name: 'Manage Groups', description: 'Access to oversee community groups', category: 'dashboard', route_path: '/admin/groups', component_name: 'GroupsManagement', icon_name: 'Users', sort_order: 3 },
    { name: 'user_management', display_name: 'User Management', description: 'Manage users, roles and permissions', category: 'admin', route_path: '/admin/users', component_name: 'UserManagement', icon_name: 'Users', sort_order: 4 },
    { name: 'role_management', display_name: 'Role Management', description: 'Manage roles and responsibilities', category: 'admin', route_path: '/admin/roles', component_name: 'RoleManagement', icon_name: 'Shield', sort_order: 5 },
    { name: 'responsibility_management', display_name: 'Responsibility Management', description: 'Manage system responsibilities', category: 'admin', route_path: '/admin/responsibilities', component_name: 'ResponsibilityManagement', icon_name: 'Key', sort_order: 6 },
    { name: 'admin_position_management', display_name: 'Position Management', description: 'Manage organizational positions', category: 'admin', route_path: '/admin/positions', component_name: 'PositionManagement', icon_name: 'Layers', sort_order: 7 },
    { name: 'system_settings', display_name: 'System Settings', description: 'Configure system settings', category: 'admin', route_path: '/admin/settings', component_name: 'SystemSettings', icon_name: 'Settings', sort_order: 8 },
];

const positions = [
    {
        name: 'individual', display_name: 'Individual Access', description: 'Access to individual user data only',
        hierarchy_level: 1000, data_access_level: 'individual',
        data_access_limits: { maxEvents: 5, maxAttendees: 100, maxGroups: 1, supportLevel: 'basic', customBranding: false, whiteLabel: false }
    },
    {
        name: 'organization_admin', display_name: 'Organization Admin', description: 'Administrative access to all organization data',
        hierarchy_level: 100, data_access_level: 'organization',
        custom_conditions: [{ field: 'isAdmin', operator: 'equals', value: true, description: 'Administrative access to all data' }],
        data_access_limits: { maxEvents: 1000, maxAttendees: 10000, maxGroups: 500, supportLevel: 'enterprise', customBranding: true, whiteLabel: true }
    },
];

export async function seedAdminRBAC(): Promise<void> {
    console.log('--- Seeding Admin RBAC ---');

    // Seed default tenant
    const tenantId = '00000000-0000-0000-0000-000000000000';
    await prisma.$executeRawUnsafe(
        `INSERT INTO tenants (id, slug, name, status, default_currency, default_locale)
         VALUES ($1, $2, $3, 'active', 'INR', 'en')
         ON CONFLICT (id) DO NOTHING`,
        tenantId, 'default', 'Default Tenant'
    );
    console.log('Seeded default tenant');

    // Seed default user (Aanya Reddy)
    const userId = '00000000-0000-0000-0000-000000000001';
    await prisma.$executeRawUnsafe(
        `INSERT INTO users (id, tenant_id, primary_email, email_verified, state, locale)
         VALUES ($1, $2, $3, true, 'active', 'en')
         ON CONFLICT (id) DO NOTHING`,
        userId, tenantId, 'aanya@samaagum.com'
    );
    console.log('Seeded default user');

    // Insert responsibilities
    for (const r of responsibilities) {
        await prisma.$executeRawUnsafe(
            `INSERT INTO admin_responsibilities (name, display_name, description, category, route_path, component_name, icon_name, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (name) DO UPDATE
             SET display_name = EXCLUDED.display_name, description = EXCLUDED.description, category = EXCLUDED.category,
                 route_path = EXCLUDED.route_path, component_name = EXCLUDED.component_name, icon_name = EXCLUDED.icon_name, sort_order = EXCLUDED.sort_order`,
            r.name, r.display_name, r.description, r.category, r.route_path, r.component_name, r.icon_name, r.sort_order
        );
    }
    console.log(`Seeded ${responsibilities.length} responsibilities`);

    // Insert positions
    for (const p of positions) {
        await prisma.$executeRawUnsafe(
            `INSERT INTO admin_positions (name, display_name, description, hierarchy_level, data_access_level, custom_conditions, data_access_limits)
             VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
             ON CONFLICT (name) DO UPDATE
             SET display_name = EXCLUDED.display_name, description = EXCLUDED.description, hierarchy_level = EXCLUDED.hierarchy_level,
                 data_access_level = EXCLUDED.data_access_level, custom_conditions = EXCLUDED.custom_conditions, data_access_limits = EXCLUDED.data_access_limits`,
            p.name, p.display_name, p.description, p.hierarchy_level, p.data_access_level,
            JSON.stringify((p as any).custom_conditions || []),
            JSON.stringify(p.data_access_limits)
        );
    }
    console.log(`Seeded ${positions.length} positions`);

    // Fetch IDs for role creation
    const respRows = await prisma.$queryRawUnsafe<{ id: string; name: string }[]>(
        `SELECT id, name FROM admin_responsibilities`
    );
    const posRows = await prisma.$queryRawUnsafe<{ id: string; name: string }[]>(
        `SELECT id, name FROM admin_positions`
    );

    const allRespIds = respRows.map(r => r.id);
    const dashboardRespIds = respRows.filter(r => ['dashboard_main', 'events_management', 'groups_management'].includes(r.name)).map(r => r.id);
    const individualPosId = posRows.find(p => p.name === 'individual')?.id;
    const adminPosId = posRows.find(p => p.name === 'organization_admin')?.id;

    // Helper to upsert role and return its ID
    const upsertRole = async (
        name: string,
        displayName: string,
        description: string,
        responsibilityIds: string[],
        defaultPositionId: string | undefined,
        hierarchyLevel: number,
        isSystemRole: boolean,
        isActive: boolean,
        isDefault: boolean
    ) => {
        const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
            `INSERT INTO admin_roles (name, display_name, description, tenant_id, responsibility_ids, default_position_id, hierarchy_level, is_system_role, is_active, is_default)
             VALUES ($1, $2, $3, null, $4::jsonb, $5::uuid, $6, $7, $8, $9)
             ON CONFLICT ON CONSTRAINT admin_roles_name_tenant_id_key DO UPDATE
             SET display_name = EXCLUDED.display_name,
                 description = EXCLUDED.description,
                 responsibility_ids = EXCLUDED.responsibility_ids,
                 default_position_id = EXCLUDED.default_position_id,
                 hierarchy_level = EXCLUDED.hierarchy_level,
                 is_system_role = EXCLUDED.is_system_role,
                 is_active = EXCLUDED.is_active,
                 is_default = EXCLUDED.is_default
             RETURNING id`,
            name, displayName, description, JSON.stringify(responsibilityIds), defaultPositionId || null, hierarchyLevel, isSystemRole, isActive, isDefault
        );
        return rows[0]?.id;
    };

    const freeUserRoleId = await upsertRole('free_user', 'Free User', 'Basic access to main dashboard', dashboardRespIds, individualPosId, 1000, true, true, true);
    const basicHostRoleId = await upsertRole('basic_host', 'Basic Host', 'Enhanced access for basic event hosts', dashboardRespIds, individualPosId, 800, true, true, false);
    const proHostRoleId = await upsertRole('pro_host', 'Pro Host', 'Premium access for pro organizers', allRespIds, individualPosId, 500, true, true, false);
    const enterpriseHostRoleId = await upsertRole('enterprise_host', 'Enterprise Host', 'Full administrative event hosting features', allRespIds, adminPosId, 300, true, true, false);
    const adminRoleId = await upsertRole('admin', 'Administrator', 'Full administrative access to manage the entire system', allRespIds, adminPosId, 2, true, true, false);
    const superAdminRoleId = await upsertRole('super_admin', 'Super Administrator', 'Unrestricted platform-wide super administrative access', allRespIds, adminPosId, 1, true, true, false);

    console.log('Seeded roles');

    // ── Seed 2 Admin Users with Access Keys ───────────────────────────────────
    // Access keys come from env or are auto-generated (printed once to console)
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@samaagum.com';
    const superAdminKey   = process.env.SUPER_ADMIN_KEY   || crypto.randomBytes(16).toString('hex');
    const adminEmail2     = process.env.ADMIN_EMAIL        || 'admin@samaagum.com';
    const adminKey        = process.env.ADMIN_KEY          || crypto.randomBytes(16).toString('hex');

    // Upsert both users
    const superAdminUserRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO users (id, tenant_id, primary_email, email_verified, state, locale)
         VALUES (gen_random_uuid(), $1, $2, true, 'active', 'en')
         ON CONFLICT ON CONSTRAINT users_tenant_id_primary_email_key DO UPDATE SET email_verified = true, state = 'active'
         RETURNING id`,
        tenantId, superAdminEmail
    );
    const superAdminUserId = superAdminUserRows[0]?.id;

    const adminUserRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO users (id, tenant_id, primary_email, email_verified, state, locale)
         VALUES (gen_random_uuid(), $1, $2, true, 'active', 'en')
         ON CONFLICT ON CONSTRAINT users_tenant_id_primary_email_key DO UPDATE SET email_verified = true, state = 'active'
         RETURNING id`,
        tenantId, adminEmail2
    );
    const adminUserId2 = adminUserRows[0]?.id;

    // Store hashed credentials in platform_settings
    const credentialsPayload = {
        admins: [
            {
                email: superAdminEmail,
                name: 'Super Admin',
                role: 'super_admin',
                keyHash: hashKey(superAdminKey),
                userId: superAdminUserId,
                tenantId,
                roleId: superAdminRoleId
            },
            {
                email: adminEmail2,
                name: 'Platform Admin',
                role: 'admin',
                keyHash: hashKey(adminKey),
                userId: adminUserId2,
                tenantId,
                roleId: adminRoleId
            }
        ]
    };

    await upsertGlobalPlatformSetting('admin_credentials', credentialsPayload);

    // Also keep super_admin_config for OTP flow compatibility
    await upsertGlobalPlatformSetting('super_admin_config', {
        adminEmail: superAdminEmail,
        adminUserId: superAdminUserId,
        superAdminRoleId,
        adminRoleId
    });


    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║         SAMAAGUM ADMIN CREDENTIALS                  ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║  Super Admin                                         ║`);
    console.log(`║  Email : ${superAdminEmail.padEnd(42)}║`);
    console.log(`║  Key   : ${superAdminKey.padEnd(42)}║`);
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║  Platform Admin                                      ║`);
    console.log(`║  Email : ${adminEmail2.padEnd(42)}║`);
    console.log(`║  Key   : ${adminKey.padEnd(42)}║`);
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║  ⚠  Save these now — keys are hashed in DB          ║');
    console.log('║     or set SUPER_ADMIN_KEY / ADMIN_KEY in .env      ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');

    // ── Seed Subscription Plans ──────────────────────────────────────────────
    const basicPricing = {
        monthly: { amount: 499, currency: 'INR' },
        yearly: { amount: 4790, currency: 'INR' }
    };
    const basicFeatures = [
        { name: 'Access to 10 active communities' },
        { name: 'RSVP to 5 premium events per month' },
        { name: 'Standard support (24h turnaround)' }
    ];

    await prisma.$executeRawUnsafe(
        `INSERT INTO admin_subscription_plans (name, display_name, description, category, plan_type, is_active, is_popular, pricing, features, limits, metadata, visibility, rbac_role_id, rbac_position_id, rbac_auto_assign)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13::uuid, $14::uuid, $15)
         ON CONFLICT (name) DO UPDATE
         SET display_name = EXCLUDED.display_name, description = EXCLUDED.description, category = EXCLUDED.category, plan_type = EXCLUDED.plan_type,
             is_active = EXCLUDED.is_active, is_popular = EXCLUDED.is_popular, pricing = EXCLUDED.pricing, features = EXCLUDED.features,
             limits = EXCLUDED.limits, metadata = EXCLUDED.metadata, visibility = EXCLUDED.visibility, rbac_role_id = EXCLUDED.rbac_role_id,
             rbac_position_id = EXCLUDED.rbac_position_id, rbac_auto_assign = EXCLUDED.rbac_auto_assign`,
        'basic', 'Basic Member', 'Perfect for regular community members', 'individual', 'monthly', true, false,
        JSON.stringify(basicPricing), JSON.stringify(basicFeatures), '[]', '{}', '{}', basicHostRoleId, individualPosId, true
    );

    const proPricing = {
        monthly: { amount: 999, currency: 'INR' },
        yearly: { amount: 9590, currency: 'INR' }
    };
    const proFeatures = [
        { name: 'Access to unlimited communities' },
        { name: 'Unlimited RSVPs to premium events' },
        { name: 'VIP front row seating & early entry' },
        { name: 'Priority host-direct chat support' }
    ];

    await prisma.$executeRawUnsafe(
        `INSERT INTO admin_subscription_plans (name, display_name, description, category, plan_type, is_active, is_popular, pricing, features, limits, metadata, visibility, rbac_role_id, rbac_position_id, rbac_auto_assign)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13::uuid, $14::uuid, $15)
         ON CONFLICT (name) DO UPDATE
         SET display_name = EXCLUDED.display_name, description = EXCLUDED.description, category = EXCLUDED.category, plan_type = EXCLUDED.plan_type,
             is_active = EXCLUDED.is_active, is_popular = EXCLUDED.is_popular, pricing = EXCLUDED.pricing, features = EXCLUDED.features,
             limits = EXCLUDED.limits, metadata = EXCLUDED.metadata, visibility = EXCLUDED.visibility, rbac_role_id = EXCLUDED.rbac_role_id,
             rbac_position_id = EXCLUDED.rbac_position_id, rbac_auto_assign = EXCLUDED.rbac_auto_assign`,
        'premium', 'Pro Member', 'The ultimate community experience with VIP access', 'individual', 'monthly', true, true,
        JSON.stringify(proPricing), JSON.stringify(proFeatures), '[]', '{}', '{}', proHostRoleId, individualPosId, true
    );

    console.log('Seeded subscription plans');

    // ── Seed Coupons ────────────────────────────────────────────────────────
    const welcomeCouponRestrictions = {
        minimumAmount: 200,
        allowedEmails: []
    };
    const welcomeCouponLimits = {
        usageLimit: 100
    };

    await prisma.$executeRawUnsafe(
        `INSERT INTO admin_coupons (code, description, discount_type, amount, is_active, usage_restrictions, usage_limits, applicable_plan_ids, free_shipping, usage_count)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, false, 0)
         ON CONFLICT ON CONSTRAINT admin_coupons_code_tenant_id_key DO UPDATE
         SET description = EXCLUDED.description, discount_type = EXCLUDED.discount_type, amount = EXCLUDED.amount, is_active = EXCLUDED.is_active,
             usage_restrictions = EXCLUDED.usage_restrictions, usage_limits = EXCLUDED.usage_limits, applicable_plan_ids = EXCLUDED.applicable_plan_ids`,
        'WELCOME20', '20% welcome discount for new subscribers', 'percent', 20.00, true,
        JSON.stringify(welcomeCouponRestrictions), JSON.stringify(welcomeCouponLimits), '[]'
    );

    console.log('Seeded WELCOME20 coupon');

    // ── Seed Platform Settings (Auth & Communication) ──────────────────────
    const defaultAuthSettings = {
        google: {
            enabled: !!process.env.GOOGLE_CLIENT_ID,
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
        },
        linkedin: { enabled: false, clientId: '', clientSecret: '' }
    };
    const defaultCommSettings = {
        provider: 'brevo',
        enabled: false,
        senderEmail: 'admin@samaagum.com',
        senderName: 'Samaagum Admin',
        brevoApiKey: '',
        smtpHost: 'smtp.brevo.com',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: '',
        smtpPass: ''
    };

    // Only seed default auth_settings if they do not exist in the database yet
    const hasAuthRow = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM platform_settings WHERE scope_tenant_id IS NULL AND key = 'auth_settings' LIMIT 1`
    );

    if (hasAuthRow.length === 0) {
        await upsertGlobalPlatformSetting('auth_settings', defaultAuthSettings);
        console.log('Seeded platform auth settings with default credentials');
    } else {
        console.log('Platform auth settings already exist, skipping...');
    }

    const hasCommRow = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM platform_settings WHERE scope_tenant_id IS NULL AND key = 'communication_settings' LIMIT 1`
    );
    if (hasCommRow.length === 0) {
        await upsertGlobalPlatformSetting('communication_settings', defaultCommSettings);
        console.log('Seeded default platform communication settings');
    }


    console.log('--- Admin RBAC Seeding Complete ---');
}

export default seedAdminRBAC;
