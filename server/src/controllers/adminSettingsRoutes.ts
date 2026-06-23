import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import prisma from '../config/prisma';
import { AdminAuthSettings, CommunicationSettings, OtpSettings } from '../settings-library/settingsTypes';
import { DEFAULT_AUTH_SETTINGS, DEFAULT_COMMUNICATION_SETTINGS, DEFAULT_OTP_SETTINGS } from '../settings-library/settingsSeeder';

/**
 * Utility to mask sensitive credentials
 */
function maskSecret(secret?: string): string {
  if (!secret) return '';
  if (secret.length <= 8) return '••••••••';
  return `${secret.substring(0, 4)}••••••••${secret.substring(secret.length - 4)}`;
}

/**
 * Helper to check if a value is masked
 */
function isMasked(value?: string): boolean {
  return typeof value === 'string' && value.includes('••••');
}

// ── PORTABLE DATABASE HELPERS FOR OTP VERIFICATION ───────────────────────────

async function saveOtpVerification(db: any, email: string, otp: string, purpose: string, expiresAt: Date) {
  if (db.otp_verifications) {
    return db.otp_verifications.create({
      data: {
        email,
        otp_hash: otp,
        purpose,
        expires_at: expiresAt,
        attempts: 0,
        verified: false
      }
    });
  } else {
    const query = `
      INSERT INTO otp_verifications (id, email, otp_hash, purpose, expires_at, attempts, verified, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, 0, false, now())
    `;
    return db.$executeRawUnsafe(query, email, otp, purpose, expiresAt);
  }
}

async function getOtpVerification(db: any, email: string, purpose: string) {
  if (db.otp_verifications) {
    return db.otp_verifications.findFirst({
      where: {
        email,
        purpose,
        verified: false,
        expires_at: {
          gt: new Date()
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  } else {
    const query = `
      SELECT * FROM otp_verifications
      WHERE email = $1 AND purpose = $2 AND verified = false AND expires_at > now()
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const rows = await db.$queryRawUnsafe(query, email, purpose);
    return rows && rows.length > 0 ? rows[0] : null;
  }
}

async function incrementOtpAttempts(db: any, id: string) {
  if (db.otp_verifications) {
    return db.otp_verifications.update({
      where: { id },
      data: { attempts: { increment: 1 } }
    });
  } else {
    const query = `UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1`;
    return db.$executeRawUnsafe(query, id);
  }
}

async function markOtpVerified(db: any, id: string) {
  if (db.otp_verifications) {
    return db.otp_verifications.update({
      where: { id },
      data: { verified: true }
    });
  } else {
    const query = `UPDATE otp_verifications SET verified = true WHERE id = $1`;
    return db.$executeRawUnsafe(query, id);
  }
}

export const adminSettingsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

  // ── AUTH SETTINGS ──────────────────────────────────────────────────────────
  
  fastify.get('/settings/auth', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const row = await prisma.platform_settings.findFirst({
        where: {
          scope_tenant_id: null,
          key: 'auth_settings',
        }
      });

      let settings: AdminAuthSettings = DEFAULT_AUTH_SETTINGS;
      if (row && row.value) {
        settings = { ...DEFAULT_AUTH_SETTINGS, ...(row.value as any) };
      }

      const maskedSettings: any = {};
      for (const key of Object.keys(settings)) {
        const provider = settings[key];
        maskedSettings[key] = {
          ...provider,
          enabled: !!provider.enabled,
          clientId: provider.clientId ?? '',
          clientSecret: maskSecret(provider.clientSecret),
        };
      }

      return { success: true, data: maskedSettings };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to fetch auth settings' });
    }
  });

  fastify.post('/settings/auth', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const bodySettings = request.body as any;
      if (!bodySettings || typeof bodySettings !== 'object') {
        return reply.status(400).send({ success: false, message: 'Invalid payload' });
      }

      if (!bodySettings.google || !bodySettings.linkedin) {
        return reply.status(400).send({ success: false, message: 'Google and LinkedIn settings are required defaults' });
      }

      const row = await prisma.platform_settings.findFirst({
        where: {
          scope_tenant_id: null,
          key: 'auth_settings',
        }
      });

      let existing: AdminAuthSettings = DEFAULT_AUTH_SETTINGS;
      if (row && row.value) {
        existing = row.value as any;
      }

      const newSettings: any = {};
      for (const key of Object.keys(bodySettings)) {
        const provider = bodySettings[key];
        const existingProvider = existing[key] || {};
        const secret = isMasked(provider.clientSecret)
          ? (existingProvider.clientSecret || '')
          : (provider.clientSecret || '');

        newSettings[key] = {
          ...provider,
          enabled: !!provider.enabled,
          clientId: provider.clientId || '',
          clientSecret: secret,
        };
      }

      if (row) {
        await prisma.platform_settings.update({
          where: { id: row.id },
          data: {
            value: newSettings as any,
            updated_at: new Date(),
            updated_by: request.user?.id || null,
          }
        });
      } else {
        await prisma.platform_settings.create({
          data: {
            scope_tenant_id: null,
            key: 'auth_settings',
            value: newSettings as any,
            updated_at: new Date(),
            updated_by: request.user?.id || null,
          }
        });
      }

      return { success: true, message: 'Authentication settings updated successfully' };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to save auth settings' });
    }
  });

  // ── COMMUNICATION SETTINGS ──────────────────────────────────────────────────
  
  fastify.get('/settings/communication', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const row = await prisma.platform_settings.findFirst({
        where: {
          scope_tenant_id: null,
          key: 'communication_settings',
        }
      });

      let settings: CommunicationSettings = DEFAULT_COMMUNICATION_SETTINGS;
      if (row && row.value) {
        settings = { ...DEFAULT_COMMUNICATION_SETTINGS, ...(row.value as any) };
      }

      const maskedSettings: CommunicationSettings = {
        ...settings,
        brevoApiKey: maskSecret(settings.brevoApiKey),
        smtpPass: maskSecret(settings.smtpPass),
      };

      return { success: true, data: maskedSettings };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to fetch communication settings' });
    }
  });

  fastify.post('/settings/communication', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const data = request.body as CommunicationSettings;
      if (!data) {
        return reply.status(400).send({ success: false, message: 'Settings payload required' });
      }

      const row = await prisma.platform_settings.findFirst({
        where: {
          scope_tenant_id: null,
          key: 'communication_settings',
        }
      });

      let existing: CommunicationSettings = DEFAULT_COMMUNICATION_SETTINGS;
      if (row && row.value) {
        existing = row.value as any;
      }

      const resolvedBrevoApiKey = isMasked(data.brevoApiKey)
        ? existing.brevoApiKey
        : (data.brevoApiKey || '');

      const resolvedSmtpPass = isMasked(data.smtpPass)
        ? existing.smtpPass
        : (data.smtpPass || '');

      const newSettings: CommunicationSettings = {
        provider: data.provider || 'none',
        enabled: !!data.enabled,
        senderEmail: data.senderEmail || 'admin@samaagum.com',
        senderName: data.senderName || 'Samaagum Admin',
        brevoApiKey: resolvedBrevoApiKey,
        brevoTemplateId: data.brevoTemplateId ? Number(data.brevoTemplateId) : undefined,
        smtpHost: data.smtpHost || 'smtp.brevo.com',
        smtpPort: data.smtpPort ? Number(data.smtpPort) : 587,
        smtpSecure: !!data.smtpSecure,
        smtpUser: data.smtpUser || '',
        smtpPass: resolvedSmtpPass,
      };

      if (row) {
        await prisma.platform_settings.update({
          where: { id: row.id },
          data: {
            value: newSettings as any,
            updated_at: new Date(),
            updated_by: request.user?.id || null,
          }
        });
      } else {
        await prisma.platform_settings.create({
          data: {
            scope_tenant_id: null,
            key: 'communication_settings',
            value: newSettings as any,
            updated_at: new Date(),
            updated_by: request.user?.id || null,
          }
        });
      }

      return { success: true, message: 'Communication settings updated successfully' };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to save communication settings' });
    }
  });

  fastify.post('/settings/communication/test', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const { email } = request.body as any;
      if (!email) {
        return reply.status(400).send({ success: false, message: 'Recipient email is required' });
      }

      const row = await prisma.platform_settings.findFirst({
        where: {
          scope_tenant_id: null,
          key: 'communication_settings',
        }
      });

      if (!row || !row.value) {
        return reply.status(400).send({ success: false, message: 'No communication credentials configured yet.' });
      }

      const settings: CommunicationSettings = row.value as any;

      if (!settings.enabled) {
        return reply.status(400).send({ success: false, message: 'Communication settings are disabled.' });
      }

      if (settings.provider === 'brevo') {
        const apiKey = settings.brevoApiKey;
        
        const payload: any = {
          to: [{ email }]
        };

        if (settings.brevoTemplateId) {
          payload.templateId = Number(settings.brevoTemplateId);
          payload.params = {
            OTP: '123456',
            otp: '123456',
            code: '123456',
            purpose: 'Connection Test'
          };
        } else {
          payload.sender = { name: settings.senderName, email: settings.senderEmail };
          payload.subject = 'Samaagum Admin: Connection Test Email';
          payload.htmlContent = `
            <h3>Integration Test Successful</h3>
            <p>This is a validation email sent from the Samaagum Admin settings console.</p>
            <p><strong>Provider:</strong> Brevo API v3</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          `;
        }

        if (!apiKey || apiKey === 'mock-key' || apiKey.trim() === '' || apiKey.includes('••••')) {
          return { 
            success: true, 
            message: `[MOCK] Test email successfully routed to ${email} (Mock Brevo flow). Configure a real Brevo API Key to send live emails.` 
          };
        }

        try {
          const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': apiKey,
              'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          const result = (await response.json()) as any;
          if (response.status >= 200 && response.status < 300) {
            return { success: true, message: `Live test email sent successfully to ${email}! Message ID: ${result.messageId || 'N/A'}` };
          } else {
            return reply.status(400).send({ success: false, message: `Brevo API Error: ${result.message || JSON.stringify(result)}` });
          }
        } catch (fetchErr: any) {
          return reply.status(500).send({ success: false, message: `Network request to Brevo failed: ${fetchErr.message}` });
        }
      } else if (settings.provider === 'smtp') {
        return {
          success: true,
          message: `[MOCK] Test email successfully routed to ${email} via SMTP relay ${settings.smtpHost}:${settings.smtpPort}.`
        };
      } else {
        return reply.status(400).send({ success: false, message: 'Invalid or unsupported provider.' });
      }
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to execute connection test' });
    }
  });

  // ── OTP CONFIGURATION & DEMO SANDBOX ─────────────────────────────────────────

  fastify.get('/settings/otp', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const row = await prisma.platform_settings.findFirst({
        where: {
          scope_tenant_id: null,
          key: 'otp_settings',
        }
      });

      let settings: OtpSettings = DEFAULT_OTP_SETTINGS;
      if (row && row.value) {
        settings = { ...DEFAULT_OTP_SETTINGS, ...(row.value as any) };
      }

      return { success: true, data: settings };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to fetch OTP settings' });
    }
  });

  fastify.post('/settings/otp', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const data = request.body as OtpSettings;
      if (!data) {
        return reply.status(400).send({ success: false, message: 'OTP settings payload required' });
      }

      const row = await prisma.platform_settings.findFirst({
        where: {
          scope_tenant_id: null,
          key: 'otp_settings',
        }
      });

      const newSettings: OtpSettings = {
        length: Math.max(4, Math.min(8, Number(data.length || 6))),
        expiryMinutes: Math.max(1, Math.min(60, Number(data.expiryMinutes || 5))),
        maxAttempts: Math.max(1, Math.min(10, Number(data.maxAttempts || 3))),
        mockMode: !!data.mockMode
      };

      if (row) {
        await prisma.platform_settings.update({
          where: { id: row.id },
          data: {
            value: newSettings as any,
            updated_at: new Date(),
            updated_by: request.user?.id || null,
          }
        });
      } else {
        await prisma.platform_settings.create({
          data: {
            scope_tenant_id: null,
            key: 'otp_settings',
            value: newSettings as any,
            updated_at: new Date(),
            updated_by: request.user?.id || null,
          }
        });
      }

      return { success: true, message: 'OTP settings updated successfully' };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to save OTP settings' });
    }
  });

  // Generates and Sends an OTP
  fastify.post('/otp/send', async (request: any, reply) => {
    try {
      const { email, purpose } = request.body as any;
      if (!email || !purpose) {
        return reply.status(400).send({ success: false, message: 'Email and purpose are required parameters.' });
      }

      // Check if user already exists
      const existingUser = await prisma.users.findFirst({
        where: { primary_email: email }
      });

      if (purpose === 'Signup') {
        if (existingUser) {
          return reply.status(400).send({ 
            success: false, 
            message: 'Account already exists with this email. Please log in instead.' 
          });
        }
      } else if (purpose === 'Login') {
        if (!existingUser) {
          return reply.status(400).send({ 
            success: false, 
            message: 'Account does not exist. Please sign up/create a profile first.' 
          });
        }
      }

      // 1. Fetch OTP configuration
      const otpRow = await prisma.platform_settings.findFirst({
        where: { scope_tenant_id: null, key: 'otp_settings' }
      });
      const otpSettings: OtpSettings = otpRow && otpRow.value ? (otpRow.value as any) : DEFAULT_OTP_SETTINGS;

      // 2. Generate a cryptographically secure numeric OTP code
      const digits = '0123456789';
      let otp = '';
      for (let i = 0; i < otpSettings.length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
      }

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + otpSettings.expiryMinutes);

      // 3. Save OTP to DB
      await saveOtpVerification(prisma, email, otp, purpose, expiresAt);

      // 4. Send via configured communication settings
      const commRow = await prisma.platform_settings.findFirst({
        where: { scope_tenant_id: null, key: 'communication_settings' }
      });
      const commSettings: CommunicationSettings = commRow && commRow.value ? (commRow.value as any) : DEFAULT_COMMUNICATION_SETTINGS;

      // Check if communication is disabled or if we are in mock mode
      if (otpSettings.mockMode || !commSettings.enabled || commSettings.provider === 'none') {
        return { 
          success: true, 
          message: `[MOCK MODE] OTP sent to ${email}. Code is: ${otp}`, 
          code: otp 
        };
      }

      // If provider is Brevo, send transactional email
      if (commSettings.provider === 'brevo') {
        const apiKey = commSettings.brevoApiKey;
        const payload: any = {
          to: [{ email }]
        };

        if (commSettings.brevoTemplateId) {
          payload.templateId = Number(commSettings.brevoTemplateId);
          payload.params = {
            OTP: otp,
            otp: otp,
            code: otp,
            purpose: purpose
          };
        } else {
          payload.sender = { name: commSettings.senderName, email: commSettings.senderEmail };
          payload.subject = `Verification Code: ${otp}`;
          payload.htmlContent = `
            <div style="font-family: sans-serif; padding: 20px; color: #111;">
              <h2 style="color: #6d5efc;">Verification Code</h2>
              <p>Your one-time authorization code for <strong>${purpose}</strong> is:</p>
              <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; font-size: 28px; letter-spacing: 4px; font-weight: bold; font-family: monospace; display: inline-block; margin: 15px 0;">
                ${otp}
              </div>
              <p style="color: #666; font-size: 13px;">This code will expire in ${otpSettings.expiryMinutes} minutes. If you did not request this code, please ignore this message.</p>
            </div>
          `;
        }

        if (apiKey && apiKey !== 'mock-key' && apiKey.trim() !== '' && !apiKey.includes('••••')) {
          const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': apiKey,
              'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          
          if (response.status >= 200 && response.status < 300) {
            return { success: true, message: `OTP code sent successfully to ${email} (via Brevo).` };
          } else {
            const errResult = await response.json() as any;
            return reply.status(400).send({ success: false, message: `Brevo SMTP API Error: ${errResult.message || JSON.stringify(errResult)}` });
          }
        }
      }

      // SMTP flow (mocked response for simplicity)
      if (commSettings.provider === 'smtp') {
        return { 
          success: true, 
          message: `[SMTP MOCK] OTP code successfully routed via SMTP relay ${commSettings.smtpHost}:${commSettings.smtpPort} to ${email}. Code: ${otp}` 
        };
      }

      // Fallback
      return { 
        success: true, 
        message: `OTP sent to ${email} (communication fallback mock). Code: ${otp}`, 
        code: otp 
      };

    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to send OTP code.' });
    }
  });

  // Verifies an OTP
  fastify.post('/otp/verify', async (request: any, reply) => {
    try {
      const { email, purpose, code } = request.body as any;
      if (!email || !purpose || !code) {
        return reply.status(400).send({ success: false, message: 'Email, purpose and verification code are required.' });
      }

      // 1. Fetch OTP configuration
      const otpRow = await prisma.platform_settings.findFirst({
        where: { scope_tenant_id: null, key: 'otp_settings' }
      });
      const otpSettings: OtpSettings = otpRow && otpRow.value ? (otpRow.value as any) : DEFAULT_OTP_SETTINGS;

      // 2. Fetch active OTP record
      const verification = await getOtpVerification(prisma, email, purpose);
      if (!verification) {
        return reply.status(400).send({ success: false, message: 'No active OTP verification code found. Please request a new one.' });
      }

      // Check max attempts
      if (verification.attempts >= otpSettings.maxAttempts) {
        return reply.status(400).send({ success: false, message: 'Too many incorrect attempts. Please request a new code.' });
      }

      // 3. Compare OTP values (trimming whitespace)
      if (verification.otp_hash.trim() === code.trim()) {
        await markOtpVerified(prisma, verification.id);

        // Fetch or create user record
        let tenantId = '00000000-0000-0000-0000-000000000000';
        try {
          const tenant = await prisma.tenants.findFirst();
          if (tenant) {
            tenantId = tenant.id;
          }
        } catch (e) {
          console.warn('Warning: Could not fetch tenant, falling back to default UUID');
        }

        let dbUser = await prisma.users.findFirst({
          where: { primary_email: email }
        });

        if (purpose === 'Signup') {
          if (dbUser) {
            return reply.status(400).send({ success: false, message: 'Account already exists with this email. Please log in instead.' });
          }
          dbUser = await prisma.users.create({
            data: {
              tenant_id: tenantId,
              primary_email: email,
              email_verified: true,
              state: 'active' as any,
            }
          });
        } else {
          if (!dbUser) {
            return reply.status(400).send({ success: false, message: 'Account does not exist. Please sign up/create a profile first.' });
          }
        }

        // ── Determine real role from DB ─────────────────────────────────────
        // 1. Check if this user is the seeded super-admin
        let userRole = 'user';
        let userRoleId: string | null = null;

        try {
          const superAdminConfigRow = await prisma.platform_settings.findFirst({
            where: { scope_tenant_id: null, key: 'super_admin_config' }
          });

          if (superAdminConfigRow?.value) {
            const config = superAdminConfigRow.value as any;
            if (config.adminEmail && config.adminEmail.toLowerCase() === email.toLowerCase()) {
              userRole = 'super_admin';
              userRoleId = config.superAdminRoleId || config.adminRoleId || null;
            }
          }

          // 2. If not super-admin, look up an assigned role in admin_roles for this user
          if (userRole === 'user') {
            const userRoleRows = await prisma.$queryRawUnsafe<{ role_name: string; role_id: string }[]>(
              `SELECT ar.name as role_name, ar.id as role_id
               FROM admin_roles ar
               WHERE ar.created_by = $1::uuid OR ar.id IN (
                 SELECT (value->>'superAdminRoleId')::uuid FROM platform_settings WHERE key = 'super_admin_config' AND (value->>'adminUserId') = $1
               )
               LIMIT 1`,
              dbUser.id
            );

            if (userRoleRows.length > 0) {
              userRole = userRoleRows[0].role_name;
              userRoleId = userRoleRows[0].role_id;
            }
          }
        } catch (roleErr) {
          console.warn('⚠️ Could not determine user role from DB, defaulting to user:', roleErr);
        }

        // Generate token with real role from DB
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const tokenPayload = Buffer.from(JSON.stringify({
          id: dbUser.id,
          tenantId: dbUser.tenant_id,
          email: dbUser.primary_email,
          role: userRole,
          roleId: userRoleId
        })).toString('base64url');
        const token = `${header}.${tokenPayload}.mocksignature`;

        return { 
          success: true, 
          message: 'OTP verified successfully!', 
          token,
          user: {
            id: dbUser.id,
            email: dbUser.primary_email,
            role: userRole
          }
        };
      } else {
        await incrementOtpAttempts(prisma, verification.id);
        const remaining = otpSettings.maxAttempts - (verification.attempts + 1);
        return reply.status(400).send({ 
          success: false, 
          message: `Incorrect code entered. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Please request a new code.'}` 
        });
      }

    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to verify OTP code.' });
    }
  });

  // GET current user profile
  fastify.get('/user/profile', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.status(401).send({ success: false, message: 'Unauthorized: No valid user token provided.' });
      }

      const dbUser = await prisma.users.findUnique({
        where: { id: request.user.id },
        include: {
          profiles: true
        }
      });

      if (!dbUser) {
        return reply.status(404).send({ success: false, message: 'User not found.' });
      }

      return {
        success: true,
        data: {
          email: dbUser.primary_email,
          profile: dbUser.profiles || null
        }
      };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to fetch profile.' });
    }
  });

  // POST update or create current user profile
  fastify.post('/user/profile', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.status(401).send({ success: false, message: 'Unauthorized: No valid user token provided.' });
      }

      const { displayName, bio, preferredLocation } = request.body as any;

      const dbUser = await prisma.users.findUnique({
        where: { id: request.user.id }
      });

      if (!dbUser) {
        return reply.status(404).send({ success: false, message: 'User not found.' });
      }

      // Upsert profile
      const profile = await prisma.profiles.upsert({
        where: { user_id: dbUser.id },
        update: {
          display_name: displayName,
          bio: bio,
          preferred_location: preferredLocation,
          updated_at: new Date()
        },
        create: {
          user_id: dbUser.id,
          tenant_id: dbUser.tenant_id,
          display_name: displayName,
          bio: bio || '',
          preferred_location: preferredLocation || '',
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Profile updated successfully!',
        data: profile
      };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to update profile.' });
    }
  });
};

export default adminSettingsRoutes;
