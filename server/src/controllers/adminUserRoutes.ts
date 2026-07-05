import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import prisma from '../config/prisma';
import * as crypto from 'crypto';
import { sendInvitationEmail } from '../utils/email';

// Helper to map backend role key to UI-friendly name
function mapKeyToRole(key: string | null): string {
  switch (key) {
    case 'super_admin': return 'Super Admin';
    case 'org_admin':   return 'Platform Admin';
    case 'community_admin': return 'Community Admin';
    case 'group_admin': return 'Group Organizer';
    case 'moderator':   return 'Event Host';
    case 'member':      return 'Participant';
    default:            return 'Participant';
  }
}

export const adminUserRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // GET /users – returns enriched user list
  fastify.get('/users', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const users = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          u.id,
          u.primary_email AS email,
          u.state,
          u.created_at,
          p.display_name AS name,
          r.key AS role_key               -- <-- use only existing column
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        LEFT JOIN role_assignments ra ON ra.user_id = u.id
        LEFT JOIN roles r ON r.id = ra.role_id
        ORDER BY u.created_at DESC
      `);

      const mappedUsers = users.map(u => ({
        id: u.id,
        name: u.name || u.email?.split('@')[0] || 'Unknown',
        email: u.email,
        role: mapKeyToRole(u.role_key),
        status: u.state === 'suspended' ? 'Suspended' : u.state === 'provisional' ? 'Invited' : 'Active',
        joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Unknown',
      }));

      return { success: true, data: mappedUsers };
    } catch (e: any) {
      return reply.status(500).send({ success: false, message: e.message });
    }
  });

  // POST /users – create or update a user
  fastify.post('/users', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const { id, name, email, role, status } = request.body as any;
      if (!email) return reply.status(400).send({ success: false, message: 'Email is required' });

      // Map UI role name to backend key
      const mapRoleToKey = (roleName: string): string => {
        switch (roleName) {
          case 'Super Admin': return 'super_admin';
          case 'Platform Admin': return 'org_admin';
          case 'Community Admin': return 'community_admin';
          case 'Group Organizer': return 'group_admin';
          case 'Event Host': return 'moderator';
          case 'Participant':
          default: return 'member';
        }
      };

      const isUuid = (val?: string) => val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      let userRecord: any = null;

      if (isUuid(id)) {
        userRecord = await prisma.users.findUnique({ where: { id } });
      }
      if (!userRecord && email) {
        userRecord = await prisma.users.findFirst({ where: { primary_email: email } });
      }

      const state = status === 'Suspended' ? 'suspended' : status === 'Invited' ? 'provisional' : 'active';
      const roleKey = mapRoleToKey(role);
      const roleRecord = await prisma.roles.findUnique({ where: { key: roleKey } });

      if (userRecord) {
        // Update existing user
        await prisma.users.update({
          where: { id: userRecord.id },
          data: { primary_email: email, state, updated_at: new Date() },
        });

        await prisma.profiles.upsert({
          where: { user_id: userRecord.id },
          update: { display_name: name, updated_at: new Date() },
          create: { user_id: userRecord.id, tenant_id: userRecord.tenant_id, display_name: name },
        });

        if (roleRecord) {
          await prisma.role_assignments.deleteMany({ where: { user_id: userRecord.id } });
          await prisma.role_assignments.create({
            data: { tenant_id: userRecord.tenant_id, user_id: userRecord.id, role_id: roleRecord.id },
          });
        }

        return { success: true, data: { id: userRecord.id, name, email, role, status } };
      } else {
        // Create new user
        const tenantId = request.user?.tenantId || '00000000-0000-0000-0000-000000000000';
        const newUser = await prisma.users.create({
          data: { tenant_id: tenantId, primary_email: email, email_verified: state === 'active', state, locale: 'en' },
        });

        await prisma.profiles.create({
          data: { user_id: newUser.id, tenant_id: tenantId, display_name: name },
        });

        if (roleRecord) {
          await prisma.role_assignments.create({
            data: { tenant_id: tenantId, user_id: newUser.id, role_id: roleRecord.id },
          });
        }

        // Auto-assign the default plan to manually created user
        const { SubscriptionActivationService } = await import('../services/SubscriptionActivationService');
        SubscriptionActivationService.assignDefaultPlanToUser(newUser.id, tenantId).catch(console.error);

        return { success: true, data: { id: newUser.id, name, email, role, status } };
      }
    } catch (e: any) {
      return reply.status(500).send({ success: false, message: e.message });
    }
  });

  // PATCH /users/:id – update name, email, role, status
  fastify.patch('/users/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const { id } = request.params as any;
      const { name, email, role, status } = request.body as any;
      const state = status === 'Suspended' ? 'suspended' : status === 'Invited' ? 'provisional' : 'active';
      const roleKey = role ? (function mapRoleToKey(roleName: string): string { switch (roleName) { case 'Super Admin': return 'super_admin'; case 'Platform Admin': return 'org_admin'; case 'Community Admin': return 'community_admin'; case 'Group Organizer': return 'group_admin'; case 'Event Host': return 'moderator'; case 'Participant': default: return 'member'; } })(role) : null;
      const userRecord = await prisma.users.findUnique({ where: { id } });
      if (!userRecord) return reply.status(404).send({ success: false, message: 'User not found' });
      
      const userData: any = { state, updated_at: new Date() };
      if (email) {
        userData.primary_email = email;
      }
      await prisma.users.update({ where: { id }, data: userData });

      if (name) {
        await prisma.profiles.upsert({ where: { user_id: id }, update: { display_name: name, updated_at: new Date() }, create: { user_id: id, tenant_id: userRecord.tenant_id, display_name: name } });
      }
      if (roleKey) {
        const roleRecord = await prisma.roles.findUnique({ where: { key: roleKey } });
        if (roleRecord) {
          await prisma.role_assignments.deleteMany({ where: { user_id: id } });
          await prisma.role_assignments.create({ data: { tenant_id: userRecord.tenant_id, user_id: id, role_id: roleRecord.id } });
        }
      }
      return { success: true, data: { id, name, email, role, status } };
    } catch (e: any) {
      return reply.status(500).send({ success: false, message: e.message });
    }
  });

  // DELETE /users/:id – delete a user
  fastify.delete('/users/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const { id } = request.params as any;
      
      // Perform deletion inside a transaction to cleanup profiles, roles, and auth identities first
      await prisma.$transaction([
        prisma.auth_identities.deleteMany({ where: { user_id: id } }),
        prisma.admin_roles.updateMany({ where: { created_by: id }, data: { created_by: null } }),
        prisma.role_assignments.deleteMany({ where: { user_id: id } }),
        prisma.profiles.deleteMany({ where: { user_id: id } }),
        prisma.users.delete({ where: { id } }),
      ]);

      return { success: true, message: 'User deleted successfully' };
    } catch (e: any) {
      return reply.status(500).send({ success: false, message: e.message });
    }
  });

  // POST /users/invite – send invitation email and register provisional user
  fastify.post('/users/invite', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const { email, role } = request.body as any;
      if (!email) return reply.status(400).send({ success: false, message: 'Email is required' });

      const tenantId = request.user?.tenantId || '00000000-0000-0000-0000-000000000000';
      
      // 1. Find or create the provisional user
      let userRecord = await prisma.users.findFirst({ where: { primary_email: email } });
      if (!userRecord) {
        userRecord = await prisma.users.create({
          data: {
            tenant_id: tenantId,
            primary_email: email,
            email_verified: false,
            state: 'provisional',
            locale: 'en',
          },
        });
        
        await prisma.profiles.create({
          data: {
            user_id: userRecord.id,
            tenant_id: tenantId,
            display_name: email.split('@')[0],
          },
        });
        
        const roleKey = role ? (function mapRoleToKey(roleName: string): string { switch (roleName) { case 'Super Admin': return 'super_admin'; case 'Platform Admin': return 'org_admin'; case 'Community Admin': return 'community_admin'; case 'Group Organizer': return 'group_admin'; case 'Event Host': return 'moderator'; case 'Participant': default: return 'member'; } })(role) : 'member';
        const roleRecord = await prisma.roles.findUnique({ where: { key: roleKey } });
        if (roleRecord) {
          await prisma.role_assignments.create({
            data: {
              tenant_id: tenantId,
              user_id: userRecord.id,
              role_id: roleRecord.id,
            },
          });
        }

        // Auto-assign the default plan to invited user
        const { SubscriptionActivationService } = await import('../services/SubscriptionActivationService');
        SubscriptionActivationService.assignDefaultPlanToUser(userRecord.id, tenantId).catch(console.error);
      }

      // 2. Generate and store token in auth_identities
      const token = crypto.randomBytes(32).toString('hex');
      await prisma.auth_identities.create({
        data: {
          tenant_id: tenantId,
          user_id: userRecord.id,
          provider: 'invitation',
          provider_uid: token,
        },
      });

      const inviterName = request.user?.name || 'Admin';
      await sendInvitationEmail(email, token, role || 'Participant', inviterName);
      
      return { success: true, message: 'Invitation sent' };
    } catch (e: any) {
      return reply.status(500).send({ success: false, message: e.message });
    }
  });

  // GET /accept-invite – accept invitation and activate user
  fastify.get('/accept-invite', async (request: any, reply) => {
    try {
      const { token } = request.query as any;
      if (!token) {
        return reply.status(400).type('text/html').send('<h1>Error</h1><p>Invitation token is missing.</p>');
      }

      const identity = await prisma.auth_identities.findFirst({
        where: {
          provider: 'invitation',
          provider_uid: token,
        },
      });

      if (!identity) {
        return reply.status(400).type('text/html').send('<h1>Error</h1><p>Invalid or expired invitation token.</p>');
      }

      // 1. Activate the user
      await prisma.users.update({
        where: { id: identity.user_id },
        data: {
          state: 'active',
          email_verified: true,
          activated_at: new Date(),
        },
      });

      // 2. Remove the invitation token
      await prisma.auth_identities.delete({
        where: { id: identity.id },
      });

      const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:8080';
      return reply.redirect(`${appBaseUrl}/pages/Samaagum%20Auth.html?invite_accepted=true`);
    } catch (e: any) {
      return reply.status(500).type('text/html').send(`<h1>Error</h1><p>${e.message}</p>`);
    }
  });

};

export default adminUserRoutes;
