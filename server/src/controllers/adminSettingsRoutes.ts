import { Router, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

type Middleware = (req: any, res: Response, next: NextFunction) => void;

interface OAuthProviderSettings {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
}

interface AdminAuthSettings {
  google: OAuthProviderSettings;
  linkedin: OAuthProviderSettings;
}

interface CommunicationSettings {
  provider: 'brevo' | 'smtp' | 'none';
  enabled: boolean;
  senderEmail: string;
  senderName: string;
  brevoApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
}

const DEFAULT_AUTH_SETTINGS: AdminAuthSettings = {
  google: { enabled: false, clientId: '', clientSecret: '' },
  linkedin: { enabled: false, clientId: '', clientSecret: '' }
};

const DEFAULT_COMMUNICATION_SETTINGS: CommunicationSettings = {
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

function maskSecret(secret?: string): string {
  if (!secret) return '';
  if (secret.length <= 8) return '••••••••';
  return `${secret.substring(0, 4)}••••••••${secret.substring(secret.length - 4)}`;
}

function isMasked(value?: string): boolean {
  return typeof value === 'string' && value.includes('••••');
}

export function createAdminSettingsRouter(authenticate: Middleware, requireAdmin: Middleware): Router {
  const router = Router();

  // GET /settings/auth
  router.get('/settings/auth', authenticate, requireAdmin, async (req: any, res: Response) => {
    try {
      const row = await prisma.platform_settings.findUnique({
        where: {
          scope_tenant_id_key: {
            scope_tenant_id: null,
            key: 'auth_settings',
          }
        }
      });

      let settings: AdminAuthSettings = DEFAULT_AUTH_SETTINGS;
      if (row && row.value) {
        settings = { ...DEFAULT_AUTH_SETTINGS, ...(row.value as any) };
      }

      const maskedSettings = {
        google: {
          enabled: settings.google.enabled,
          clientId: settings.google.clientId,
          clientSecret: maskSecret(settings.google.clientSecret),
        },
        linkedin: {
          enabled: settings.linkedin.enabled,
          clientId: settings.linkedin.clientId,
          clientSecret: maskSecret(settings.linkedin.clientSecret),
        }
      };

      res.json({ success: true, data: maskedSettings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch auth settings' });
    }
  });

  // POST /settings/auth
  router.post('/settings/auth', authenticate, requireAdmin, async (req: any, res: Response) => {
    try {
      const { google, linkedin } = req.body;
      if (!google || !linkedin) {
        return res.status(400).json({ success: false, message: 'Google and Linkedin settings are required' });
      }

      const row = await prisma.platform_settings.findUnique({
        where: {
          scope_tenant_id_key: {
            scope_tenant_id: null,
            key: 'auth_settings',
          }
        }
      });

      let existing: AdminAuthSettings = DEFAULT_AUTH_SETTINGS;
      if (row && row.value) {
        existing = row.value as any;
      }

      const googleSecret = isMasked(google.clientSecret)
        ? existing.google.clientSecret
        : (google.clientSecret || '');

      const linkedinSecret = isMasked(linkedin.clientSecret)
        ? existing.linkedin.clientSecret
        : (linkedin.clientSecret || '');

      const newSettings: AdminAuthSettings = {
        google: {
          enabled: !!google.enabled,
          clientId: google.clientId || '',
          clientSecret: googleSecret,
        },
        linkedin: {
          enabled: !!linkedin.enabled,
          clientId: linkedin.clientId || '',
          clientSecret: linkedinSecret,
        }
      };

      await prisma.platform_settings.upsert({
        where: {
          scope_tenant_id_key: {
            scope_tenant_id: null,
            key: 'auth_settings',
          }
        },
        update: {
          value: newSettings,
          updated_at: new Date(),
          updated_by: req.user?.id || null,
        },
        create: {
          scope_tenant_id: null,
          key: 'auth_settings',
          value: newSettings,
          updated_at: new Date(),
          updated_by: req.user?.id || null,
        }
      });

      res.json({ success: true, message: 'Authentication settings updated successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to save auth settings' });
    }
  });

  // GET /settings/communication
  router.get('/settings/communication', authenticate, requireAdmin, async (req: any, res: Response) => {
    try {
      const row = await prisma.platform_settings.findUnique({
        where: {
          scope_tenant_id_key: {
            scope_tenant_id: null,
            key: 'communication_settings',
          }
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

      res.json({ success: true, data: maskedSettings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch communication settings' });
    }
  });

  // POST /settings/communication
  router.post('/settings/communication', authenticate, requireAdmin, async (req: any, res: Response) => {
    try {
      const data = req.body as CommunicationSettings;
      if (!data) {
        return res.status(400).json({ success: false, message: 'Settings payload required' });
      }

      const row = await prisma.platform_settings.findUnique({
        where: {
          scope_tenant_id_key: {
            scope_tenant_id: null,
            key: 'communication_settings',
          }
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
        smtpHost: data.smtpHost || 'smtp.brevo.com',
        smtpPort: data.smtpPort ? Number(data.smtpPort) : 587,
        smtpSecure: !!data.smtpSecure,
        smtpUser: data.smtpUser || '',
        smtpPass: resolvedSmtpPass,
      };

      await prisma.platform_settings.upsert({
        where: {
          scope_tenant_id_key: {
            scope_tenant_id: null,
            key: 'communication_settings',
          }
        },
        update: {
          value: newSettings,
          updated_at: new Date(),
          updated_by: req.user?.id || null,
        },
        create: {
          scope_tenant_id: null,
          key: 'communication_settings',
          value: newSettings,
          updated_at: new Date(),
          updated_by: req.user?.id || null,
        }
      });

      res.json({ success: true, message: 'Communication settings updated successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to save communication settings' });
    }
  });

  // POST /settings/communication/test
  router.post('/settings/communication/test', authenticate, requireAdmin, async (req: any, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Recipient email is required' });
      }

      const row = await prisma.platform_settings.findUnique({
        where: {
          scope_tenant_id_key: {
            scope_tenant_id: null,
            key: 'communication_settings',
          }
        }
      });

      if (!row || !row.value) {
        return res.status(400).json({ success: false, message: 'No communication credentials configured yet.' });
      }

      const settings: CommunicationSettings = row.value as any;

      if (!settings.enabled) {
        return res.status(400).json({ success: false, message: 'Communication settings are disabled.' });
      }

      if (settings.provider === 'brevo') {
        const apiKey = settings.brevoApiKey;
        
        const payload = {
          sender: { name: settings.senderName, email: settings.senderEmail },
          to: [{ email }],
          subject: 'Samaagum Admin: Connection Test Email',
          htmlContent: `
            <h3>Integration Test Successful</h3>
            <p>This is a validation email sent from the Samaagum Admin settings console.</p>
            <p><strong>Provider:</strong> Brevo API v3</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          `
        };

        if (!apiKey || apiKey === 'mock-key' || apiKey.trim() === '' || apiKey.includes('••••')) {
          return res.json({ 
            success: true, 
            message: `[MOCK] Test email successfully routed to ${email} (Mock Brevo flow). Configure a real Brevo API Key to send live emails.` 
          });
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
          const result = await response.json();
          if (response.status >= 200 && response.status < 300) {
            return res.json({ success: true, message: `Live test email sent successfully to ${email}! Message ID: ${result.messageId || 'N/A'}` });
          } else {
            return res.status(400).json({ success: false, message: `Brevo API Error: ${result.message || JSON.stringify(result)}` });
          }
        } catch (fetchErr: any) {
          return res.status(500).json({ success: false, message: `Network request to Brevo failed: ${fetchErr.message}` });
        }
      } else if (settings.provider === 'smtp') {
        return res.json({
          success: true,
          message: `[MOCK] Test email successfully routed to ${email} via SMTP relay ${settings.smtpHost}:${settings.smtpPort}.`
        });
      } else {
        return res.status(400).json({ success: false, message: 'Invalid or unsupported provider.' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to execute connection test' });
    }
  });

  return router;
}

export default createAdminSettingsRouter;
