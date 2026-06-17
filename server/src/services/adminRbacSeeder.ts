import prisma from '../config/prisma';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

function hashKey(plain: string): string {
    return crypto.createHash('sha256').update(plain).digest('hex');
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

    await prisma.$executeRawUnsafe(`TRUNCATE tenants, users, admin_responsibilities, admin_positions, admin_roles CASCADE`);

    // Seed default tenant
    const tenantId = '00000000-0000-0000-0000-000000000000';
    await prisma.$executeRawUnsafe(
        `INSERT INTO tenants (id, slug, name, status, default_currency, default_locale)
         VALUES ($1, $2, $3, 'active', 'INR', 'en')`,
        tenantId, 'default', 'Default Tenant'
    );
    console.log('Seeded default tenant');

    // Seed default user (Aanya Reddy)
    const userId = '00000000-0000-0000-0000-000000000001';
    await prisma.$executeRawUnsafe(
        `INSERT INTO users (id, tenant_id, primary_email, email_verified, state, locale)
         VALUES ($1, $2, $3, true, 'active', 'en')`,
        userId, tenantId, 'aanya@samaagum.com'
    );
    console.log('Seeded default user');

    // Insert responsibilities
    for (const r of responsibilities) {
        await prisma.$executeRawUnsafe(
            `INSERT INTO admin_responsibilities (name, display_name, description, category, route_path, component_name, icon_name, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            r.name, r.display_name, r.description, r.category, r.route_path, r.component_name, r.icon_name, r.sort_order
        );
    }
    console.log(`Seeded ${responsibilities.length} responsibilities`);

    // Insert positions
    for (const p of positions) {
        await prisma.$executeRawUnsafe(
            `INSERT INTO admin_positions (name, display_name, description, hierarchy_level, data_access_level, custom_conditions, data_access_limits)
             VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)`,
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

    // Insert default roles
    const freeUserRoleRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO admin_roles (name, display_name, description, responsibility_ids, default_position_id, hierarchy_level, is_system_role, is_active, is_default)
         VALUES ($1, $2, $3, $4::jsonb, $5::uuid, $6, $7, $8, $9) RETURNING id`,
        'free_user', 'Free User', 'Basic access to main dashboard',
        JSON.stringify(dashboardRespIds), individualPosId, 1000, true, true, true
    );
    const freeUserRoleId = freeUserRoleRows[0]?.id;

    const basicHostRoleRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO admin_roles (name, display_name, description, responsibility_ids, default_position_id, hierarchy_level, is_system_role, is_active, is_default)
         VALUES ($1, $2, $3, $4::jsonb, $5::uuid, $6, $7, $8, $9) RETURNING id`,
        'basic_host', 'Basic Host', 'Enhanced access for basic event hosts',
        JSON.stringify(dashboardRespIds), individualPosId, 800, true, true, false
    );
    const basicHostRoleId = basicHostRoleRows[0]?.id;

    const proHostRoleRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO admin_roles (name, display_name, description, responsibility_ids, default_position_id, hierarchy_level, is_system_role, is_active, is_default)
         VALUES ($1, $2, $3, $4::jsonb, $5::uuid, $6, $7, $8, $9) RETURNING id`,
        'pro_host', 'Pro Host', 'Premium access for pro organizers',
        JSON.stringify(allRespIds), individualPosId, 500, true, true, false
    );
    const proHostRoleId = proHostRoleRows[0]?.id;

    const enterpriseHostRoleRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO admin_roles (name, display_name, description, responsibility_ids, default_position_id, hierarchy_level, is_system_role, is_active, is_default)
         VALUES ($1, $2, $3, $4::jsonb, $5::uuid, $6, $7, $8, $9) RETURNING id`,
        'enterprise_host', 'Enterprise Host', 'Full administrative event hosting features',
        JSON.stringify(allRespIds), adminPosId, 300, true, true, false
    );
    const enterpriseHostRoleId = enterpriseHostRoleRows[0]?.id;

    const adminRoleRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO admin_roles (name, display_name, description, responsibility_ids, default_position_id, hierarchy_level, is_system_role, is_active, is_default)
         VALUES ($1, $2, $3, $4::jsonb, $5::uuid, $6, $7, $8, $9) RETURNING id`,
        'admin', 'Administrator', 'Full administrative access to manage the entire system',
        JSON.stringify(allRespIds), adminPosId, 2, true, true, false
    );
    const adminRoleId = adminRoleRows[0]?.id;

    const superAdminRoleRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO admin_roles (name, display_name, description, responsibility_ids, default_position_id, hierarchy_level, is_system_role, is_active, is_default)
         VALUES ($1, $2, $3, $4::jsonb, $5::uuid, $6, $7, $8, $9) RETURNING id`,
        'super_admin', 'Super Administrator', 'Unrestricted platform-wide super administrative access',
        JSON.stringify(allRespIds), adminPosId, 1, true, true, false
    );
    const superAdminRoleId = superAdminRoleRows[0]?.id;

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

    await prisma.$executeRawUnsafe(
        `INSERT INTO platform_settings (scope_tenant_id, key, value, updated_at)
         VALUES (null, 'admin_credentials', $1::jsonb, now())
         ON CONFLICT ON CONSTRAINT platform_settings_scope_tenant_id_key_key DO UPDATE SET value = $1::jsonb, updated_at = now()`,
        JSON.stringify(credentialsPayload)
    );

    // Also keep super_admin_config for OTP flow compatibility
    await prisma.$executeRawUnsafe(
        `INSERT INTO platform_settings (scope_tenant_id, key, value, updated_at)
         VALUES (null, 'super_admin_config', $1::jsonb, now())
         ON CONFLICT ON CONSTRAINT platform_settings_scope_tenant_id_key_key DO UPDATE SET value = $1::jsonb, updated_at = now()`,
        JSON.stringify({ adminEmail: superAdminEmail, adminUserId: superAdminUserId, superAdminRoleId, adminRoleId })
    );

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
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13::uuid, $14::uuid, $15)`,
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
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13::uuid, $14::uuid, $15)`,
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
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, false, 0)`,
        'WELCOME20', '20% welcome discount for new subscribers', 'percent', 20.00, true,
        JSON.stringify(welcomeCouponRestrictions), JSON.stringify(welcomeCouponLimits), '[]'
    );

    console.log('Seeded WELCOME20 coupon');

    // ── Seed Platform Settings (Auth & Communication) ──────────────────────
    const defaultAuthSettings = {
        google: { enabled: false, clientId: '', clientSecret: '' },
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

    const hasAuthRow = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM platform_settings WHERE key = 'auth_settings'`
    );
    if (hasAuthRow.length === 0) {
        await prisma.$executeRawUnsafe(
            `INSERT INTO platform_settings (scope_tenant_id, key, value, updated_at)
             VALUES (null, 'auth_settings', $1::jsonb, now())`,
            JSON.stringify(defaultAuthSettings)
        );
        console.log('Seeded default platform auth settings');
    }

    const hasCommRow = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM platform_settings WHERE key = 'communication_settings'`
    );
    if (hasCommRow.length === 0) {
        await prisma.$executeRawUnsafe(
            `INSERT INTO platform_settings (scope_tenant_id, key, value, updated_at)
             VALUES (null, 'communication_settings', $1::jsonb, now())`,
            JSON.stringify(defaultCommSettings)
        );
        console.log('Seeded default platform communication settings');
    }

    console.log('--- Admin RBAC Seeding Complete ---');
}

export default seedAdminRBAC;
