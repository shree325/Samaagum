import { AdminAuthSettings, CommunicationSettings, OtpSettings } from './settingsTypes';

export const DEFAULT_AUTH_SETTINGS: AdminAuthSettings = {
  google: {
    enabled: false,
    clientId: '',
    clientSecret: ''
  },
  linkedin: {
    enabled: false,
    clientId: '',
    clientSecret: ''
  }
};

export const DEFAULT_COMMUNICATION_SETTINGS: CommunicationSettings = {
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

export const DEFAULT_OTP_SETTINGS: OtpSettings = {
  length: 6,
  expiryMinutes: 5,
  maxAttempts: 3,
  mockMode: false
};

export const DEFAULT_FEATURE_SETTINGS: any = {
  location_active: true
};

/**
 * Platform settings seeder.
 * Runs in the host application to seed default config rows.
 * Supports passing a database client or raw runner.
 */
export async function seedPlatformSettings(
  dbExecutor: (query: string, params: any[]) => Promise<any>
): Promise<void> {
  console.log('--- Seeding Platform Settings ---');

  // Insert Auth Settings if not exists
  const checkAuthQuery = `SELECT id FROM platform_settings WHERE key = $1 LIMIT 1`;
  const authRows = await dbExecutor(checkAuthQuery, ['auth_settings']);

  if (authRows.length === 0) {
    const insertAuthQuery = `
      INSERT INTO platform_settings (id, scope_tenant_id, key, value, updated_at)
      VALUES (gen_random_uuid(), null, $1, $2::jsonb, now())
    `;
    await dbExecutor(insertAuthQuery, ['auth_settings', JSON.stringify(DEFAULT_AUTH_SETTINGS)]);
    console.log('Seeded default auth settings (Google, LinkedIn)');
  } else {
    const cleanGithubQuery = `
      UPDATE platform_settings 
      SET value = (value::jsonb - 'github')::json 
      WHERE key = $1
    `;
    await dbExecutor(cleanGithubQuery, ['auth_settings']);
    console.log('Auth settings already exist. Cleaned up legacy GitHub configurations.');
  }

  // Insert Communication Settings if not exists
  const checkCommRows = await dbExecutor(checkAuthQuery, ['communication_settings']);

  if (checkCommRows.length === 0) {
    const insertCommQuery = `
      INSERT INTO platform_settings (id, scope_tenant_id, key, value, updated_at)
      VALUES (gen_random_uuid(), null, $1, $2::jsonb, now())
    `;
    await dbExecutor(insertCommQuery, ['communication_settings', JSON.stringify(DEFAULT_COMMUNICATION_SETTINGS)]);
    console.log('Seeded default communication settings (Brevo/SMTP)');
  } else {
    console.log('Communication settings already exist, skipping...');
  }

  // Insert OTP Settings if not exists
  const checkOtpRows = await dbExecutor(checkAuthQuery, ['otp_settings']);

  if (checkOtpRows.length === 0) {
    const insertOtpQuery = `
      INSERT INTO platform_settings (id, scope_tenant_id, key, value, updated_at)
      VALUES (gen_random_uuid(), null, $1, $2::jsonb, now())
    `;
    await dbExecutor(insertOtpQuery, ['otp_settings', JSON.stringify(DEFAULT_OTP_SETTINGS)]);
    console.log('Seeded default OTP settings');
  } else {
    console.log('OTP settings already exist, skipping...');
  }

  // Insert Feature Settings if not exists
  const checkFeatureRows = await dbExecutor(checkAuthQuery, ['feature_settings']);

  if (checkFeatureRows.length === 0) {
    const insertFeatureQuery = `
      INSERT INTO platform_settings (id, scope_tenant_id, key, value, updated_at)
      VALUES (gen_random_uuid(), null, $1, $2::jsonb, now())
    `;
    await dbExecutor(insertFeatureQuery, ['feature_settings', JSON.stringify(DEFAULT_FEATURE_SETTINGS)]);
    console.log('Seeded default Feature settings');
  } else {
    console.log('Feature settings already exist, skipping...');
  }

  console.log('--- Platform Settings Seeding Complete ---');
}
