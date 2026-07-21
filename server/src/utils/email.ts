import nodemailer from 'nodemailer';
import prisma from '../config/prisma';

export async function sendEmail({
  to,
  subject,
  html,
  attachments
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}) {
  const inviterName = 'Admin';

  // 1. Fetch communication settings from database
  let commSettings: any = null;
  try {
    const row = await prisma.platform_settings.findFirst({
      where: { scope_tenant_id: null, key: 'communication_settings' }
    });
    if (row && row.value) {
      commSettings = row.value;
    }
  } catch (e) {
    console.warn('Could not load communication settings from database, using env fallback:', e);
  }

  // 2. Decide sending method based on provider
  if (commSettings && commSettings.enabled) {
    if (commSettings.provider === 'brevo') {
      const apiKey = commSettings.brevoApiKey;
      if (apiKey && apiKey !== 'mock-key' && apiKey.trim() !== '' && !apiKey.includes('••••')) {
        console.log(`[sendEmail] Sending via Brevo to ${to}`);
        try {
          const payload: any = {
            to: [{ email: to }],
            sender: { name: commSettings.senderName || inviterName, email: commSettings.senderEmail || 'no-reply@samaagum.com' },
            subject,
            htmlContent: html,
          };
          if (attachments && attachments.length > 0) {
            payload.attachment = attachments.map(att => ({
              content: att.content.toString('base64'),
              name: att.filename
            }));
          }
          const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': apiKey,
              'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          const result = await response.json() as any;
          if (response.status >= 200 && response.status < 300) {
            console.log(`[sendEmail] ✅ Email successfully sent via Brevo to ${to}. MessageId: ${result.messageId}`);
            return;
          } else {
            console.error(`[sendEmail] ❌ Brevo sending failed to ${to}: ${result.message || JSON.stringify(result)}`);
          }
        } catch (fetchErr: any) {
          console.error(`[sendEmail] ❌ Brevo HTTP request failed for ${to}: ${fetchErr.message}`);
        }
      } else {
        console.warn(`[sendEmail] ⚠️ Brevo API Key is invalid or empty: '${apiKey}'`);
      }
    } else if (commSettings.provider === 'smtp') {
      console.log(`[sendEmail] Sending via DB SMTP to ${to} (${commSettings.smtpHost})`);
      try {
        const transporter = nodemailer.createTransport({
          host: commSettings.smtpHost,
          port: Number(commSettings.smtpPort || 587),
          secure: commSettings.smtpSecure ?? (Number(commSettings.smtpPort) === 465),
          auth: {
            user: commSettings.smtpUser,
            pass: commSettings.smtpPass,
          },
        });
        const info = await transporter.sendMail({
          from: `${commSettings.senderName || inviterName} <${commSettings.senderEmail || commSettings.smtpUser || 'no-reply@samaagum.com'}>`,
          to,
          subject,
          html,
          attachments: attachments?.map(att => ({ filename: att.filename, content: att.content }))
        });
        console.log(`[sendEmail] ✅ Email successfully sent via DB SMTP to ${to}. MessageId: ${info.messageId}`);
        return;
      } catch (smtpErr: any) {
        console.error(`[sendEmail] ❌ DB SMTP sending failed to ${to}: ${smtpErr.message}`);
      }
    } else {
      console.warn(`[sendEmail] ⚠️ Unknown provider: '${commSettings.provider}'`);
    }
  } else {
    console.warn(`[sendEmail] ⚠️ DB communication settings are disabled or null.`);
  }

  console.log(`[sendEmail] Falling back to environment variables SMTP for ${to}...`);

  // 3. Fallback to process.env SMTP settings if database settings failed or aren't set
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const info = await transporter.sendMail({
      from: `"${inviterName}" <${process.env.SMTP_USER || 'no-reply@samaagum.com'}>`,
      to,
      subject,
      html,
      attachments: attachments?.map(att => ({ filename: att.filename, content: att.content }))
    });
    console.log(`[sendEmail] ✅ Email successfully sent via ENV SMTP to ${to}: ${info.messageId}`);
  } catch (err: any) {
    console.error(`[sendEmail] ❌ ENV SMTP fallback failed to ${to}:`, err);
    console.log(`[sendEmail] Falling back to console log for: ${to}`);
    console.log(`======================================================================`);
    console.log(`✉️  SIMULATED EMAIL TO: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${html}`);
    console.log(`======================================================================`);
  }
}

export function formatCurrency(amountMinor: number | bigint | null, currency: string = 'INR') {
  if (amountMinor === null || amountMinor === undefined) return 'Free';
  const amount = Number(amountMinor) / 100;
  if (currency.toUpperCase() === 'INR') {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  return `${currency.toUpperCase()} ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function generateTicketHtml({
  qrToken,
  ticketCode,
  attendeeName,
  dateString,
  venueString,
  paidAmount,
  status,
  isOnline = false,
  onlineLink = '',
  cover = '',
  quantity = 1,
  totalAmountMinor,
  currency = 'INR',
  bookingIdCode
}: {
  qrToken: string;
  ticketCode: string;
  attendeeName: string;
  dateString: string;
  venueString: string;
  paidAmount: string;
  status: string;
  isOnline?: boolean;
  onlineLink?: string;
  cover?: string;
  quantity?: number;
  totalAmountMinor?: number | bigint | null;
  currency?: string;
  bookingIdCode?: string;
}) {
  function detectProvider(url: string) {
    if (!url) return { id: 'custom', icon: '🌐', text: 'Virtual Meeting', color: '#4b5563', bg: '#f3f4f6' };
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      if (host === 'zoom.us' || host.endsWith('.zoom.us')) return { id: 'zoom', icon: '📹', text: 'Zoom', color: '#0b5cff', bg: '#e6f0ff' };
      if (host === 'meet.google.com') return { id: 'google', icon: '🎥', text: 'Google Meet', color: '#008744', bg: '#e6f4ea' };
      if (host === 'teams.microsoft.com' || host === 'teams.live.com') return { id: 'teams', icon: '🌐', text: 'Teams', color: '#5a5eb9', bg: '#eef0f9' };
      if (host.endsWith('.webex.com')) return { id: 'webex', icon: '🌐', text: 'Webex', color: '#00bceb', bg: '#e6f8fd' };
      if (host === 'meet.jit.si' || host.endsWith('.jitsi.org')) return { id: 'jitsi', icon: '🌐', text: 'Jitsi', color: '#1d76ba', bg: '#e8f2f8' };
      return { id: 'custom', icon: '🌐', text: 'Virtual Meeting', color: '#4b5563', bg: '#f3f4f6' };
    } catch {
      return { id: 'custom', icon: '🌐', text: 'Virtual Meeting', color: '#4b5563', bg: '#f3f4f6' };
    }
  }

  const provider = detectProvider(onlineLink);
  let displayBanner = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000';
  if (cover && typeof cover === 'string') {
    if (!cover.startsWith('data:') && !cover.startsWith('blob:') && !cover.startsWith('file:')) {
      if (cover.startsWith('http')) {
        displayBanner = cover;
      } else if (cover.startsWith('/')) {
        const baseUrl = process.env.APP_BASE_URL || 'https://samaagum.com';
        displayBanner = `${baseUrl}${cover}`;
      } else {
        const baseUrl = process.env.APP_BASE_URL || 'https://samaagum.com';
        displayBanner = `${baseUrl}/${cover}`;
      }
    }
  }

  const displayPaidAmount =
    totalAmountMinor !== null && totalAmountMinor !== undefined
      ? Number(totalAmountMinor) > 0
        ? formatCurrency(totalAmountMinor, currency)
        : "Free"
      : paidAmount || "Free";

  return `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 20px; }
  .ticket-card { background: white; max-width: 400px; margin: 0 auto; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; padding-bottom: 20px; }
  .qr-section { text-align: center; padding: 40px 20px 20px; background: #fff; }
  .qr-code { width: 200px; height: 200px; border-radius: 8px; border: 1px solid #e5e7eb; padding: 10px; margin: 0 auto; display: block; }
  .scan-text { color: #6b7280; font-size: 14px; margin-top: 15px; }
  .token-text { color: #9ca3af; font-size: 12px; margin-top: 4px; font-family: monospace; }
  .online-meeting-card { padding: 20px; display: flex; flex-direction: column; gap: 16px; background: #fff; }
  .provider-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 6px; font-size: 13px; font-weight: 500; }
  .link-box { font-size: 14px; color: #4b5563; word-break: break-all; font-family: monospace; background: #f9fafb; padding: 10px 14px; border-radius: 8px; border: 1px solid #e5e7eb; }
  .join-btn { display: block; width: 100%; padding: 12px; font-size: 15px; background: #111827; color: #fff; text-align: center; text-decoration: none; border-radius: 8px; font-weight: 500; box-sizing: border-box; }
  .divider { height: 1px; background: #f3f4f6; margin: 20px; }
  .details { padding: 0 20px; }
  .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f9fafb; }
  .row:last-child { border-bottom: none; }
  .label { color: #9ca3af; font-size: 14px; font-weight: 500; }
  .value { color: #111827; font-size: 14px; font-weight: 600; text-align: right; }
  .status-badge { display: inline-flex; align-items: center; background: #ecfdf5; color: #059669; padding: 4px 10px; border-radius: 9999px; font-size: 13px; font-weight: 600; }
  .status-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; margin-right: 6px; display: inline-block; }
</style>
</head>
<body>
<div class="ticket-card">
  ${isOnline ? `
    <img src="${displayBanner}" alt="Event Banner" width="100%" style="display: block; width: 100%; max-width: 600px; border-radius: 12px 12px 0 0; object-fit: cover; max-height: 200px;" />
    <div class="online-meeting-card">
      <div>
        <span class="provider-badge" style="background: ${provider.bg}; color: ${provider.color};">
          ${provider.icon} ${provider.text}
        </span>
      </div>
      <div class="link-box">
        <a href="${onlineLink}" style="color: inherit; text-decoration: none;">${onlineLink}</a>
      </div>
      <a href="${onlineLink}" class="join-btn" target="_blank">Join Meeting</a>
    </div>
  ` : `
  <div class="qr-section">
    <img class="qr-code" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrToken)}" alt="QR Code" />
    <div class="scan-text">Show this at the gate for scanning</div>
  </div>
  `}
  <div class="divider"></div>
  <div class="details">
    <div class="row">
      <div class="label">Ticket ID</div>
      <div class="value">${ticketCode}</div>
    </div>
    ${bookingIdCode ? `
    <div class="row">
      <div class="label">Booking ID</div>
      <div class="value">${bookingIdCode}</div>
    </div>
    ` : ''}
    <div class="row">
      <div class="label">Attendee</div>
      <div class="value">${attendeeName}</div>
    </div>
    <div class="row">
      <div class="label">Date</div>
      <div class="value">${dateString}</div>
    </div>
    <div class="row">
      <div class="label">Venue</div>
      <div class="value">${venueString}</div>
    </div>
    <div class="row">
      <div class="label">Quantity</div>
      <div class="value">${quantity}</div>
    </div>
    <div class="row">
      <div class="label">Paid</div>
      <div class="value">${displayPaidAmount}</div>
    </div>
    <div class="row">
      <div class="label">Status</div>
      <div class="value">
        <div class="status-badge">
          <div class="status-dot"></div>
          ${status}
        </div>
      </div>
    </div>
  </div>
</div>
</body>
</html>
  `;
}

export async function sendInvitationEmail(
  to: string,
  token: string,
  role: string = 'Participant',
  inviterName: string = 'Admin'
) {
  const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  const inviteLink = `${appBaseUrl}/api/admin/accept-invite?token=${token}`;

  const html = `
    <p>Hello,</p>
    <p>${inviterName} has invited you to join as <strong>${role}</strong> on Samaagum.</p>
    <p>Click the link below to accept the invitation (valid for 24 hours):</p>
    <p><a href="${inviteLink}">Accept Invitation</a></p>
    <p>If you did not expect this email, you can safely ignore it.</p>
  `;

  return sendEmail({ to, subject: 'You are invited to join Samaagum', html });
}
