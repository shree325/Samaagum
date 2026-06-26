export interface OAuthProviderSettings {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  displayName?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userEndpoint?: string;
  scope?: string;
  emailField?: string;
  nameField?: string;
  isCustom?: boolean;
}

export interface AdminAuthSettings {
  google: OAuthProviderSettings;
  linkedin: OAuthProviderSettings;
  [key: string]: OAuthProviderSettings;
}

export interface CommunicationSettings {
  provider: 'brevo' | 'smtp' | 'none';
  enabled: boolean;
  senderEmail: string;
  senderName: string;
  // Brevo Specific
  brevoApiKey?: string;
  brevoTemplateId?: number;
  // SMTP Specific
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
}

export interface OtpSettings {
  length: number;
  expiryMinutes: number;
  maxAttempts: number;
  mockMode: boolean;
}

export interface FeatureSettings {
  location_active: boolean;
}

export interface OtpVerificationRow {
  id?: string;
  email: string;
  otp_hash: string;
  purpose: string;
  attempts: number;
  verified: boolean;
  expires_at: Date;
  created_at?: Date;
}

export interface PlatformSettingsRow {
  id?: string;
  scope_tenant_id?: string | null;
  key: string;
  value: any;
  updated_by?: string | null;
  updated_at?: Date;
}
