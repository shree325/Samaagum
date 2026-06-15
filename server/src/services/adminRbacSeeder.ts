import prisma from '../config/prisma';

const responsibilities = [
    { name: 'dashboard_main', display_name: 'Main Dashboard', description: 'Access to the main dashboard', category: 'dashboard', route_path: '/dashboard', component_name: 'Dashboard', icon_name: 'LayoutDashboard', sort_order: 1 },
    { name: 'portfolio_overview', display_name: 'Portfolio Overview', description: 'View portfolio summary', category: 'dashboard', route_path: '/portfolio/overview', component_name: 'PortfolioOverview', icon_name: 'PieChart', sort_order: 2 },
    { name: 'market_overview', display_name: 'Market Overview', description: 'General market overview', category: 'dashboard', route_path: '/market/overview', component_name: 'MarketOverview', icon_name: 'TrendingUp', sort_order: 3 },
    { name: 'user_management', display_name: 'User Management', description: 'Manage users, roles and permissions', category: 'admin', route_path: '/admin/users', component_name: 'UserManagement', icon_name: 'Users', sort_order: 1 },
    { name: 'role_management', display_name: 'Role Management', description: 'Manage roles and responsibilities', category: 'admin', route_path: '/admin/roles', component_name: 'RoleManagement', icon_name: 'Shield', sort_order: 2 },
    { name: 'responsibility_management', display_name: 'Responsibility Management', description: 'Manage system responsibilities', category: 'admin', route_path: '/admin/responsibilities', component_name: 'ResponsibilityManagement', icon_name: 'Key', sort_order: 3 },
    { name: 'admin_position_management', display_name: 'Position Management', description: 'Manage organizational positions', category: 'admin', route_path: '/admin/positions', component_name: 'PositionManagement', icon_name: 'Layers', sort_order: 4 },
    { name: 'system_settings', display_name: 'System Settings', description: 'Configure system settings', category: 'admin', route_path: '/admin/settings', component_name: 'SystemSettings', icon_name: 'Settings', sort_order: 5 },
];

const positions = [
    {
        name: 'individual', display_name: 'Individual Access', description: 'Access to individual user data only',
        hierarchy_level: 1000, data_access_level: 'individual',
        data_access_limits: { maxWatchlists: 5, maxPortfolios: 1, maxAlerts: 10, maxUsers: 1, apiCallsPerMonth: 1000, dataRetentionDays: 30, supportLevel: 'basic', customBranding: false, whiteLabel: false, dedicatedSupport: false, sla: 'Best effort' }
    },
    {
        name: 'organization_admin', display_name: 'Organization Admin', description: 'Administrative access to all organization data',
        hierarchy_level: 100, data_access_level: 'organization',
        custom_conditions: [{ field: 'isAdmin', operator: 'equals', value: true, description: 'Administrative access to all data' }],
        data_access_limits: { maxWatchlists: 500, maxPortfolios: 200, maxAlerts: 2000, maxUsers: 1000, apiCallsPerMonth: 200000, dataRetentionDays: 1825, supportLevel: 'enterprise', customBranding: true, whiteLabel: true, dedicatedSupport: true, sla: '15 minutes' }
    },
];

export async function seedAdminRBAC(): Promise<void> {
    console.log('--- Seeding Admin RBAC ---');

    await prisma.$executeRawUnsafe(`TRUNCATE admin_responsibilities, admin_positions, admin_roles CASCADE`);

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
    const dashboardRespIds = respRows.filter(r => ['dashboard_main', 'portfolio_overview', 'market_overview'].includes(r.name)).map(r => r.id);
    const individualPosId = posRows.find(p => p.name === 'individual')?.id;
    const adminPosId = posRows.find(p => p.name === 'organization_admin')?.id;

    // Insert default roles
    await prisma.$executeRawUnsafe(
        `INSERT INTO admin_roles (name, display_name, description, responsibility_ids, default_position_id, hierarchy_level, is_system_role, is_active, is_default)
         VALUES ($1, $2, $3, $4::jsonb, $5::uuid, $6, $7, $8, $9)`,
        'free_user', 'Free User', 'Basic access to main dashboard',
        JSON.stringify(dashboardRespIds), individualPosId, 1000, true, true, true
    );

    await prisma.$executeRawUnsafe(
        `INSERT INTO admin_roles (name, display_name, description, responsibility_ids, default_position_id, hierarchy_level, is_system_role, is_active, is_default)
         VALUES ($1, $2, $3, $4::jsonb, $5::uuid, $6, $7, $8, $9)`,
        'admin', 'Administrator', 'Administrative access to manage system',
        JSON.stringify(allRespIds), adminPosId, 100, true, true, false
    );

    console.log('Seeded 2 default roles');
    console.log('--- Admin RBAC Seeding Complete ---');
}

export default seedAdminRBAC;
