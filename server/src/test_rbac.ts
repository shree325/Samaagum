import prisma from './config/prisma';
import accessControlService, { blockedInheritanceEntities } from './services/AccessControlService';

async function runTests() {
    console.log('🧪 Starting Samaagum RBAC Conformance Test Suite...');
    let success = true;

    // Helper to generate UUIDs
    const uuid = () => require('crypto').randomUUID();

    // Test IDs
    const tenantId = '00000000-0000-0000-0000-000000000000';
    const suspendedUserId = uuid();
    const activeUserId = uuid();
    const superAdminUserId = uuid();
    const childEntityId = uuid();
    const parentEntityId = uuid();
    const externalParentEntityId = uuid();

    try {
        console.log('   Setting up test fixtures...');

        // 1. Seed test users
        await prisma.$executeRawUnsafe(
            `INSERT INTO users (id, tenant_id, primary_email, email_verified, state, locale)
             VALUES 
             ($1::uuid, $3::uuid, 'suspended@test.com', true, 'suspended', 'en'),
             ($2::uuid, $3::uuid, 'active@test.com', true, 'active', 'en'),
             ($4::uuid, $3::uuid, 'superadmin@test.com', true, 'active', 'en')`,
            suspendedUserId, activeUserId, tenantId, superAdminUserId
        );

        // 2. Fetch or create roles
        const superAdminRoleRow = await prisma.$queryRawUnsafe<{ id: string }[]>(
            `SELECT id FROM roles WHERE key = 'super_admin' LIMIT 1`
        );
        const eventManagerRoleRow = await prisma.$queryRawUnsafe<{ id: string }[]>(
            `SELECT id FROM roles WHERE key = 'event_manager' LIMIT 1`
        );

        if (superAdminRoleRow.length === 0 || eventManagerRoleRow.length === 0) {
            throw new Error('Required platform roles (super_admin or event_manager) not seeded.');
        }

        // Assign super_admin role to superAdminUserId
        await prisma.$executeRawUnsafe(
            `INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_entity_id, created_at, updated_at)
             VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid, null, now(), now())`,
            tenantId, superAdminUserId, superAdminRoleRow[0].id
        );

        // 3. Seed test entities (hierarchy conforming to real schema)
        // External Parent Entity (blocks inheritance)
        await prisma.$executeRawUnsafe(
            `INSERT INTO entities (id, tenant_id, entity_type, parent_entity_id, user_id, status, visibility)
             VALUES ($1::uuid, $2::uuid, 'org'::entity_type, null, null, 'active'::entity_status, 'private'::visibility_level)`,
            externalParentEntityId, tenantId
        );
        blockedInheritanceEntities.add(externalParentEntityId);

        // Parent Entity
        await prisma.$executeRawUnsafe(
            `INSERT INTO entities (id, tenant_id, entity_type, parent_entity_id, user_id, status, visibility)
             VALUES ($1::uuid, $2::uuid, 'org'::entity_type, null, null, 'active'::entity_status, 'private'::visibility_level)`,
            parentEntityId, tenantId
        );

        // Child Entity (under Parent Entity)
        await prisma.$executeRawUnsafe(
            `INSERT INTO entities (id, tenant_id, entity_type, parent_entity_id, user_id, status, visibility)
             VALUES ($1::uuid, $2::uuid, 'community'::entity_type, $3::uuid, null, 'active'::entity_status, 'private'::visibility_level)`,
            childEntityId, tenantId, parentEntityId
        );

        // ─────────────────────────────────────────────────────────────────────
        // 🧪 TEST 1: Suspension Control
        // ─────────────────────────────────────────────────────────────────────
        console.log('   [Test 1] Verifying suspended users are denied all capabilities...');
        // Even with super_admin assignment, suspended user must be denied
        await prisma.$executeRawUnsafe(
            `INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_entity_id, created_at, updated_at)
             VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid, null, now(), now())`,
            tenantId, suspendedUserId, superAdminRoleRow[0].id
        );

        const suspendedAllowed = await accessControlService.hasCapability(suspendedUserId, 'event.configure_tickets', childEntityId);
        if (suspendedAllowed) {
            console.error('❌ FAIL: Suspended user was granted capabilities.');
            success = false;
        } else {
            console.log('   ✅ PASS: Suspended user denied successfully.');
        }

        // ─────────────────────────────────────────────────────────────────────
        // 🧪 TEST 2: Platform Admin Bypass
        // ─────────────────────────────────────────────────────────────────────
        console.log('   [Test 2] Verifying Platform Admins bypass resource checks...');
        const superAdminAllowed = await accessControlService.hasCapability(superAdminUserId, 'event.configure_tickets', childEntityId);
        if (!superAdminAllowed) {
            console.error('❌ FAIL: Super Admin denied access.');
            success = false;
        } else {
            console.log('   ✅ PASS: Super Admin bypass verified.');
        }

        // ─────────────────────────────────────────────────────────────────────
        // 🧪 TEST 3: Ownership Carve-out
        // ─────────────────────────────────────────────────────────────────────
        console.log('   [Test 3] Verifying entity ownership grants full access...');
        // Make activeUserId the owner of Child Entity by updating user_id to activeUserId
        await prisma.$executeRawUnsafe(
            `UPDATE entities SET user_id = $1::uuid WHERE id = $2::uuid`,
            activeUserId, childEntityId
        );
        const ownerAllowed = await accessControlService.hasCapability(activeUserId, 'event.configure_tickets', childEntityId);
        if (!ownerAllowed) {
            console.error('❌ FAIL: Entity owner denied access.');
            success = false;
        } else {
            console.log('   ✅ PASS: Entity owner access verified.');
        }

        // Reset ownership
        await prisma.$executeRawUnsafe(
            `UPDATE entities SET user_id = null WHERE id = $1::uuid`,
            childEntityId
        );

        // ─────────────────────────────────────────────────────────────────────
        // 🧪 TEST 4: Direct Assignment
        // ─────────────────────────────────────────────────────────────────────
        console.log('   [Test 4] Verifying direct assignment authorization...');
        // Assign eventManagerRole to activeUserId directly on childEntityId
        const assignmentId = uuid();
        await prisma.$executeRawUnsafe(
            `INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_entity_id, created_at, updated_at)
             VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, now(), now())`,
            assignmentId, tenantId, activeUserId, eventManagerRoleRow[0].id, childEntityId
        );

        const directAllowed = await accessControlService.hasCapability(activeUserId, 'event.configure_tickets', childEntityId);
        if (!directAllowed) {
            console.error('❌ FAIL: Direct role assignment did not grant permission.');
            success = false;
        } else {
            console.log('   ✅ PASS: Direct assignment verified.');
        }

        // Clean up direct assignment for next tests
        await prisma.$executeRawUnsafe(`DELETE FROM role_assignments WHERE id = $1::uuid`, assignmentId);

        // ─────────────────────────────────────────────────────────────────────
        // 🧪 TEST 5: Inheritance and Block-inheritance
        // ─────────────────────────────────────────────────────────────────────
        console.log('   [Test 5] Verifying role inheritance traversal and blocking...');
        // Assign eventManagerRole to activeUserId on Parent Entity
        const parentAssignmentId = uuid();
        await prisma.$executeRawUnsafe(
            `INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_entity_id, created_at, updated_at)
             VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, now(), now())`,
            parentAssignmentId, tenantId, activeUserId, eventManagerRoleRow[0].id, parentEntityId
        );

        // Access child entity (should inherit from parent entity)
        const childInherited = await accessControlService.hasCapability(activeUserId, 'event.configure_tickets', childEntityId);
        if (!childInherited) {
            console.error('❌ FAIL: Parent assignment did not inherit to child entity.');
            success = false;
        } else {
            console.log('   ✅ PASS: Inheritance traversal verified.');
        }

        // Now test block inheritance: set child's parent to externalParentEntityId
        await prisma.$executeRawUnsafe(
            `UPDATE entities SET parent_entity_id = $1::uuid WHERE id = $2::uuid`,
            externalParentEntityId, childEntityId
        );
        // Move assignment to externalParentEntityId
        await prisma.$executeRawUnsafe(
            `UPDATE role_assignments SET scope_entity_id = $1::uuid WHERE id = $2::uuid`,
            externalParentEntityId, parentAssignmentId
        );

        const blockedInherited = await accessControlService.hasCapability(activeUserId, 'event.configure_tickets', childEntityId);
        if (blockedInherited) {
            console.error('❌ FAIL: Traversal bypassed block_inheritance flag.');
            success = false;
        } else {
            console.log('   ✅ PASS: Block inheritance flag correctly honored.');
        }

        // Clean up
        await prisma.$executeRawUnsafe(`DELETE FROM role_assignments WHERE id = $1::uuid`, parentAssignmentId);

    } catch (error: any) {
        console.error('❌ ERROR running tests:', error.message || error);
        success = false;
    } finally {
        console.log('   Cleaning up test fixtures...');
        blockedInheritanceEntities.delete(externalParentEntityId);
        await prisma.$executeRawUnsafe(`DELETE FROM role_assignments WHERE user_id IN ($1::uuid, $2::uuid, $3::uuid)`, suspendedUserId, activeUserId, superAdminUserId);
        await prisma.$executeRawUnsafe(`DELETE FROM entities WHERE id IN ($1::uuid, $2::uuid, $3::uuid)`, childEntityId, parentEntityId, externalParentEntityId);
        await prisma.$executeRawUnsafe(`DELETE FROM users WHERE id IN ($1::uuid, $2::uuid, $3::uuid)`, suspendedUserId, activeUserId, superAdminUserId);
    }

    if (success) {
        console.log('🎉 All Samaagum RBAC Conformance Tests Passed Successfully!');
        process.exit(0);
    } else {
        console.error('❌ Some Samaagum RBAC Conformance Tests Failed.');
        process.exit(1);
    }
}

runTests();
