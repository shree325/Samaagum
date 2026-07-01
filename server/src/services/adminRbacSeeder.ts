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
    { name: 'create_free_groups', display_name: 'Create Free Groups', description: 'Ability to create free groups', category: 'dashboard', route_path: '/groups/free', component_name: 'FreeGroups', icon_name: 'Users', sort_order: 10 },
    { name: 'create_paid_groups', display_name: 'Create Paid Groups', description: 'Ability to create paid groups', category: 'dashboard', route_path: '/groups/paid', component_name: 'PaidGroups', icon_name: 'Coins', sort_order: 11 },
    { name: 'create_free_events', display_name: 'Create Free Events', description: 'Ability to create free events', category: 'dashboard', route_path: '/events/free', component_name: 'FreeEvents', icon_name: 'Calendar', sort_order: 12 },
    { name: 'create_paid_events', display_name: 'Create Paid Events', description: 'Ability to create paid events', category: 'dashboard', route_path: '/events/paid', component_name: 'PaidEvents', icon_name: 'CreditCard', sort_order: 13 },
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


const rolesToSeed = [
    {
        key: 'super_admin',
        name: 'Super Admin',
        level: 'platform',
        phase: 'MVP-0',
        reserved: true,
        baseline_capabilities: [
            'rbac.manage', 'platform.settings', 'tenant.manage', 'user.manage',
            'event.cancel', 'refund.approve', 'checkin.bulk', 'checkin.gate_staff', 'checkin.view'
        ]
    },
    {
        key: 'platform_admin',
        name: 'Platform Admin',
        level: 'platform',
        phase: 'MVP-0',
        reserved: false,
        baseline_capabilities: [
            'platform.settings', 'tenant.manage', 'user.manage',
            'event.cancel', 'refund.approve', 'checkin.bulk', 'checkin.gate_staff', 'checkin.view'
        ]
    },
    {
        key: 'support_admin',
        name: 'Support Admin',
        level: 'platform',
        phase: 'Phase-1.5',
        reserved: false,
        baseline_capabilities: ['support.view', 'user.view', 'checkin.view']
    },
    {
        key: 'org_owner',
        name: 'Organization Owner',
        level: 'org',
        phase: 'Phase-1.5',
        reserved: true,
        baseline_capabilities: ['org.manage', 'org.finance', 'org.settings']
    },
    {
        key: 'org_admin',
        name: 'Organization Admin',
        level: 'org',
        phase: 'Phase-1.5',
        reserved: true,
        baseline_capabilities: ['org.manage', 'org.settings']
    },
    {
        key: 'community_owner',
        name: 'Community Owner',
        level: 'community',
        phase: 'MVP-1',
        reserved: true,
        baseline_capabilities: ['community.manage', 'community.settings']
    },
    {
        key: 'community_admin',
        name: 'Community Admin',
        level: 'community',
        phase: 'MVP-1',
        reserved: true,
        baseline_capabilities: ['community.manage']
    },
    {
        key: 'community_moderator',
        name: 'Community Moderator',
        level: 'community',
        phase: 'MVP-1',
        reserved: true,
        baseline_capabilities: ['community.moderate']
    },
    {
        key: 'group_owner',
        name: 'Group Owner',
        level: 'group',
        phase: 'MVP',
        reserved: false,
        baseline_capabilities: ['group.manage', 'group.settings']
    },
    {
        key: 'group_admin',
        name: 'Group Admin',
        level: 'group',
        phase: 'MVP',
        reserved: false,
        baseline_capabilities: ['group.manage']
    },
    {
        key: 'group_member',
        name: 'Group Member',
        level: 'group',
        phase: 'MVP',
        reserved: false,
        baseline_capabilities: ['group.view']
    },
    {
        key: 'event_owner',
        name: 'Event Owner',
        level: 'event',
        phase: 'MVP',
        reserved: true,
        baseline_capabilities: [
            'checkin.gate_staff', 'checkin.bulk', 'checkin.view',
            'event.configure_tickets', 'refund.approve', 'event.cancel', 'event.manage'
        ]
    },
    {
        key: 'ticket_scanner',
        name: 'Ticket Scanner',
        level: 'event',
        phase: 'MVP',
        reserved: false,
        baseline_capabilities: ['checkin.gate_staff', 'checkin.view']
    },
    {
        key: 'event_manager',
        name: 'Event Manager',
        level: 'event',
        phase: 'MVP',
        reserved: false,
        baseline_capabilities: [
            'checkin.gate_staff', 'checkin.bulk', 'checkin.view',
            'event.configure_tickets', 'refund.approve', 'event.cancel'
        ]
    },
    {
        key: 'co_host',
        name: 'Co-Host',
        level: 'event',
        phase: 'MVP',
        reserved: false,
        baseline_capabilities: [
            'checkin.gate_staff', 'checkin.bulk', 'checkin.view', 'event.configure_tickets'
        ]
    },
    {
        key: 'checkin_lead',
        name: 'Checkin Lead',
        level: 'event',
        phase: 'MVP',
        reserved: false,
        baseline_capabilities: ['checkin.gate_staff', 'checkin.bulk', 'checkin.view']
    },
    {
        key: 'gate_staff',
        name: 'Gate Staff',
        level: 'event',
        phase: 'MVP',
        reserved: false,
        baseline_capabilities: ['checkin.gate_staff', 'checkin.view']
    },
    {
        key: 'session_gate_staff',
        name: 'Session Gate Staff',
        level: 'event',
        phase: 'MVP',
        reserved: false,
        baseline_capabilities: ['checkin.gate_staff']
    },
    {
        key: 'finance_viewer',
        name: 'Finance Viewer',
        level: 'event',
        phase: 'MVP',
        reserved: false,
        baseline_capabilities: ['finance.view']
    },
    {
        key: 'registered_user',
        name: 'Registered User',
        level: 'participation',
        phase: 'MVP',
        reserved: false,
        baseline_capabilities: ['event.view', 'community.view']
    },
    {
        key: 'guest',
        name: 'Guest',
        level: 'participation',
        phase: 'MVP',
        reserved: false,
        baseline_capabilities: ['event.view']
    },
    {
        key: 'member',
        name: 'Member',
        level: 'participation',
        phase: 'MVP',
        reserved: false,
        baseline_capabilities: ['event.view', 'community.view', 'group.view']
    }
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

    // Deduplicate existing admin_roles to prevent duplicates
    await prisma.$executeRawUnsafe(`
        UPDATE admin_subscription_plans p
        SET rbac_role_id = (
            SELECT MIN(target.id::text)::uuid
            FROM admin_roles target
            JOIN admin_roles current ON current.id = p.rbac_role_id
            WHERE target.name = current.name 
              AND COALESCE(target.tenant_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(current.tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)
        )
        WHERE p.rbac_role_id IS NOT NULL
    `);

    await prisma.$executeRawUnsafe(`
        DELETE FROM admin_roles a
        WHERE a.id NOT IN (
            SELECT MIN(b.id::text)::uuid
            FROM admin_roles b
            GROUP BY b.name, COALESCE(b.tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)
        )
    `);

    // Include other legacy roles in rolesToSeed if not already present
    const rolesToSeedList = [...rolesToSeed];
    const legacyRoles = [
        { key: 'free_user', name: 'Free User', level: 'participation', phase: 'MVP', reserved: true, baseline_capabilities: ['event.view'] },
        { key: 'basic_host', name: 'Basic Host', level: 'event', phase: 'MVP', reserved: true, baseline_capabilities: ['event.view', 'checkin.view'] },
        { key: 'pro_host', name: 'Pro Host', level: 'event', phase: 'MVP', reserved: true, baseline_capabilities: ['event.view', 'checkin.view'] },
        { key: 'enterprise_host', name: 'Enterprise Host', level: 'event', phase: 'MVP', reserved: true, baseline_capabilities: ['event.view', 'checkin.view'] },
        { key: 'admin', name: 'Administrator', level: 'platform', phase: 'MVP', reserved: true, baseline_capabilities: ['platform.settings', 'tenant.manage', 'user.manage'] }
    ];
    for (const lr of legacyRoles) {
        if (!rolesToSeedList.some(r => r.key === lr.key)) {
            rolesToSeedList.push(lr);
        }
    }

    // Seed Authoritative Roles
    for (const r of rolesToSeedList) {
        await prisma.$executeRawUnsafe(
            `INSERT INTO roles (id, key, level, phase, reserved, baseline_capabilities)
             VALUES (gen_random_uuid(), $1, $2::role_level, $3, $4, $5::jsonb)
             ON CONFLICT (key) DO UPDATE
             SET level = EXCLUDED.level, phase = EXCLUDED.phase, reserved = EXCLUDED.reserved, baseline_capabilities = EXCLUDED.baseline_capabilities`,
            r.key, r.level, r.phase, r.reserved, JSON.stringify(r.baseline_capabilities)
        );
    }
    console.log(`Seeded ${rolesToSeedList.length} authoritative roles`);

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
        const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
            `SELECT id FROM admin_roles WHERE name = $1 AND tenant_id IS NULL LIMIT 1`,
            name
        );
        if (existing.length > 0) {
            const roleId = existing[0].id;
            await prisma.$executeRawUnsafe(
                `UPDATE admin_roles SET 
                    display_name = $1,
                    description = $2,
                    responsibility_ids = $3::jsonb,
                    default_position_id = $4::uuid,
                    hierarchy_level = $5,
                    is_system_role = $6,
                    is_active = $7,
                    is_default = $8,
                    updated_at = now()
                 WHERE id = $9::uuid`,
                displayName, description, JSON.stringify(responsibilityIds), defaultPositionId || null, hierarchyLevel, isSystemRole, isActive, isDefault, roleId
            );
            return roleId;
        } else {
            const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
                `INSERT INTO admin_roles (name, display_name, description, tenant_id, responsibility_ids, default_position_id, hierarchy_level, is_system_role, is_active, is_default)
                 VALUES ($1, $2, $3, null, $4::jsonb, $5::uuid, $6, $7, $8, $9)
                 RETURNING id`,
                name, displayName, description, JSON.stringify(responsibilityIds), defaultPositionId || null, hierarchyLevel, isSystemRole, isActive, isDefault
            );
            return rows[0]?.id;
        }
    };

    const defaultPositionIdForLevel = (level: string) => {
        if (['platform', 'org'].includes(level)) {
            return adminPosId;
        }
        return individualPosId;
    };

    const hierarchyLevelForRole = (key: string, level: string): number => {
        if (key === 'super_admin') return 1;
        if (key === 'platform_admin' || key === 'admin') return 2;
        if (key === 'support_admin') return 5;
        if (key === 'org_owner') return 10;
        if (key === 'org_admin') return 20;
        if (key === 'community_owner') return 50;
        if (key === 'community_admin') return 60;
        if (key === 'community_moderator') return 80;
        if (key === 'group_owner') return 100;
        if (key === 'group_admin') return 110;
        if (key === 'group_moderator') return 120;
        if (key === 'event_owner') return 200;
        if (key === 'event_manager') return 300;
        if (key === 'co_host') return 400;
        if (key === 'pro_host') return 500;
        if (key === 'checkin_lead') return 600;
        if (key === 'gate_staff' || key === 'session_gate_staff' || key === 'ticket_scanner') return 700;
        if (key === 'basic_host') return 800;
        if (key === 'free_user' || level === 'participation') return 1000;
        return 500; // default fallback
    };

    const mapCapabilitiesToResponsibilities = (key: string, caps: string[]): string[] => {
        const matched = new Set<string>();
        // Add default dashboard access for all logged in roles
        matched.add('dashboard_main');

        for (const cap of caps) {
            if (cap.startsWith('rbac.') || cap.startsWith('platform.') || cap.startsWith('tenant.')) {
                matched.add('role_management');
                matched.add('responsibility_management');
                matched.add('admin_position_management');
                matched.add('system_settings');
            }
            if (cap.startsWith('user.')) {
                matched.add('user_management');
            }
            if (cap.startsWith('event.') || cap.startsWith('checkin.')) {
                matched.add('events_management');
            }
            if (cap.startsWith('group.')) {
                matched.add('groups_management');
            }
            if (cap.startsWith('org.')) {
                matched.add('groups_management');
            }
        }

        // Add the free/paid responsibilities dynamically based on the role key
        // Free user & basic host can only create free events/groups
        if (['free_user', 'basic_host', 'registered_user', 'member', 'guest'].includes(key)) {
            matched.add('create_free_groups');
            matched.add('create_free_events');
        } else {
            // All other host & admin roles can create both free and paid groups/events
            matched.add('create_free_groups');
            matched.add('create_paid_groups');
            matched.add('create_free_events');
            matched.add('create_paid_events');
        }

        // Return legacy list for specific matching roles if needed
        if (['super_admin', 'platform_admin', 'pro_host', 'enterprise_host', 'admin'].includes(key)) {
            return allRespIds;
        }

        return respRows
            .filter(r => matched.has(r.name))
            .map(r => r.id);
    };



    let superAdminRoleId = '';
    let adminRoleId = '';
    let basicHostRoleId = '';
    let proHostRoleId = '';

    for (const r of rolesToSeedList) {
        const respIdsForRole = mapCapabilitiesToResponsibilities(r.key, r.baseline_capabilities);
        const posId = defaultPositionIdForLevel(r.level);
        const hLevel = hierarchyLevelForRole(r.key, r.level);
        const isDefault = r.key === 'member' || r.key === 'free_user';

        const roleId = await upsertRole(
            r.key,
            r.name,
            `Baseline capability role for ${r.name}`,
            respIdsForRole,
            posId,
            hLevel,
            true, // isSystemRole
            true, // isActive
            isDefault
        );

        if (r.key === 'super_admin') {
            superAdminRoleId = roleId!;
        } else if (r.key === 'admin' || r.key === 'platform_admin') {
            if (!adminRoleId) adminRoleId = roleId!;
        } else if (r.key === 'basic_host') {
            basicHostRoleId = roleId!;
        } else if (r.key === 'pro_host') {
            proHostRoleId = roleId!;
        }
    }

    console.log(`Seeded ${rolesToSeedList.length} roles into admin_roles`);

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

    // Seed role assignments in the roles/role_assignments table
    const superAdminRoleRow = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM roles WHERE key = 'super_admin' LIMIT 1`
    );
    const platformAdminRoleRow = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM roles WHERE key = 'platform_admin' LIMIT 1`
    );

    if (superAdminRoleRow.length > 0) {
        // Aanya Reddy (userId = '00000000-0000-0000-0000-000000000001')
        await prisma.$executeRawUnsafe(
            `INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_entity_id, created_at, updated_at)
             VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid, null, now(), now())
             ON CONFLICT (user_id, role_id, scope_entity_id) DO NOTHING`,
            tenantId, userId, superAdminRoleRow[0].id
        );
        // superadmin@samaagum.com
        if (superAdminUserId) {
            await prisma.$executeRawUnsafe(
                `INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_entity_id, created_at, updated_at)
                 VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid, null, now(), now())
                 ON CONFLICT (user_id, role_id, scope_entity_id) DO NOTHING`,
                tenantId, superAdminUserId, superAdminRoleRow[0].id
            );
        }
    }

    if (platformAdminRoleRow.length > 0 && adminUserId2) {
        // admin@samaagum.com
        await prisma.$executeRawUnsafe(
            `INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_entity_id, created_at, updated_at)
             VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid, null, now(), now())
             ON CONFLICT (user_id, role_id, scope_entity_id) DO NOTHING`,
            tenantId, adminUserId2, platformAdminRoleRow[0].id
        );
    }

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
