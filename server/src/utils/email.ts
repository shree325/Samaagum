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
        try {
          const payload: any = {
            to: [{ email: to }],
            sender: { name: commSettings.senderName || inviterName, email: commSettings.senderEmail || 'no-reply@samaagum.com' },
            subject,
            htmlContent: html,
          };
          // Attach PDF invoices if provided
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
            console.log(`Email successfully sent via Brevo: ${result.messageId}`);
            return;
          } else {
            console.error(`Brevo sending failed: ${result.message || JSON.stringify(result)}`);
          }
        } catch (fetchErr: any) {
          console.error(`Brevo HTTP request failed: ${fetchErr.message}`);
        }
      }
    } else if (commSettings.provider === 'smtp') {
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
        console.log(`Email successfully sent via DB SMTP: ${info.messageId}`);
        return;
      } catch (smtpErr: any) {
        console.error(`DB SMTP sending failed: ${smtpErr.message}`);
      }
    }
  }

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
      from: `${inviterName} <${process.env.SMTP_USER || 'no-reply@samaagum.com'}>`,
      to,
      subject,
      html,
      attachments: attachments?.map(att => ({ filename: att.filename, content: att.content }))
    });
    console.log(`Email successfully sent via env SMTP: ${info.messageId}`);
  } catch (err: any) {
    console.warn('All email sending methods failed. Falling back to console log:', err.message);
    console.log(`======================================================================`);
    console.log(`✉️  SIMULATED EMAIL TO: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML: ${html}`);
    console.log(`======================================================================`);
  }
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
