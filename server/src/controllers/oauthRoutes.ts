import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import prisma from '../config/prisma';

const SCOPES = 'openid email profile';

export const oauthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

    // GET /auth/google — Redirect to Google OAuth consent screen
    fastify.get('/google', async (request: any, reply) => {
        try {
            const authRow = await prisma.platform_settings.findFirst({
                where: { scope_tenant_id: null, key: 'auth_settings' }
            });

            const settings = authRow?.value as any;
            const clientId = settings?.google?.clientId;

            if (!settings?.google?.enabled || !clientId) {
                return reply.status(503).send({
                    success: false,
                    message: 'Google OAuth is not enabled. Configure it in Admin → System Settings → Auth.'
                });
            }

            // Callback goes to the server itself (port 3000)
            const serverBase = getBaseUrl(request);
            const redirectUri = `${serverBase}/api/auth/google/callback`;

            // Capture where the user came from so we redirect back to the right frontend port.
            // This is stored in the OAuth state and read back in the callback.
            const referer = request.headers['referer'] || request.headers['origin'] || '';
            let frontendOrigin = 'http://localhost:8080';
            try {
                if (referer) {
                    const u = new URL(referer);
                    frontendOrigin = `${u.protocol}//${u.host}`;
                }
            } catch {}

            const state = Buffer.from(JSON.stringify({
                mode: (request.query as any).mode || 'login',
                frontendOrigin,
                ts: Date.now()
            })).toString('base64url');

            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: SCOPES,
                access_type: 'offline',
                prompt: 'select_account',
                state
            });

            return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);

        } catch (err: any) {
            return reply.status(500).send({ success: false, message: err.message || 'OAuth initiation failed.' });
        }
    });

    // GET /auth/google/callback — Handle Google OAuth callback
    fastify.get('/google/callback', async (request: any, reply) => {
        // Read frontendOrigin from state (set during /google initiation from user's Referer header)
        let frontendBase = 'http://localhost:8080';
        try {
            const rawState = (request.query as any).state;
            if (rawState) {
                const stateData = JSON.parse(Buffer.from(rawState, 'base64url').toString('utf8'));
                if (stateData.frontendOrigin) frontendBase = stateData.frontendOrigin;
            }
        } catch {}

        try {
            const { code, error } = request.query as any;

            if (error || !code) {
                return reply.redirect(`${frontendBase}/?auth_error=${encodeURIComponent(error || 'oauth_cancelled')}`);
            }

            // Load auth settings
            const authRow = await prisma.platform_settings.findFirst({
                where: { scope_tenant_id: null, key: 'auth_settings' }
            });
            const settings = authRow?.value as any;
            const { clientId, clientSecret } = settings?.google || {};

            if (!clientId || !clientSecret) {
                return reply.redirect(`${frontendBase}/?auth_error=oauth_not_configured`);
            }

            // redirect_uri must exactly match what was sent during /google initiation
            const redirectUri = `${getBaseUrl(request)}/api/auth/google/callback`;
            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code'
                }).toString()
            });

            const tokenData: any = await tokenRes.json();
            if (!tokenRes.ok || tokenData.error) {
                console.error('Google token exchange failed:', tokenData);
                return reply.redirect(`${frontendBase}/?auth_error=token_exchange_failed`);
            }

            // Decode the id_token payload — contains email, name, etc.
            const idTokenParts = tokenData.id_token?.split('.');
            if (!idTokenParts || idTokenParts.length < 2) {
                return reply.redirect(`${frontendBase}/?auth_error=invalid_id_token`);
            }

            const googleUser = JSON.parse(Buffer.from(
                idTokenParts[1].replace(/-/g, '+').replace(/_/g, '/'),
                'base64'
            ).toString('utf8'));

            const email: string = googleUser.email;
            const name: string = googleUser.name || email.split('@')[0];

            if (!email) {
                return reply.redirect(`${frontendBase}/?auth_error=no_email`);
            }

            // Find or create user in DB
            const tenant = await prisma.tenants.findFirst();
            const tenantId = tenant?.id || '00000000-0000-0000-0000-000000000000';

            let dbUser = await prisma.users.findFirst({ where: { primary_email: email } });

            if (!dbUser) {
                dbUser = await prisma.users.create({
                    data: {
                        tenant_id: tenantId,
                        primary_email: email,
                        email_verified: true,
                        state: 'active' as any,
                    }
                });
                await prisma.profiles.upsert({
                    where: { user_id: dbUser.id },
                    update: { display_name: name, updated_at: new Date() },
                    create: {
                        user_id: dbUser.id,
                        tenant_id: tenantId,
                        display_name: name,
                        updated_at: new Date(),
                        created_at: new Date()
                    }
                });
            }

            // Issue JWT token
            const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
            const payload = Buffer.from(JSON.stringify({
                id: dbUser.id,
                tenantId: dbUser.tenant_id,
                email: dbUser.primary_email,
                name,
                role: 'user',
                provider: 'google'
            })).toString('base64url');
            const token = `${header}.${payload}.mocksignature`;

            console.log(`✅ Google OAuth login: ${email} → ${frontendBase}`);

            // Redirect back to frontend — the inline script in index.html saves the token and goes to home
            return reply.redirect(`${frontendBase}/?token=${encodeURIComponent(token)}&auth=google`);

        } catch (err: any) {
            console.error('Google OAuth callback error:', err);
            return reply.redirect(`${frontendBase}/?auth_error=server_error`);
        }
    });
};

function getBaseUrl(request: any): string {
    const proto = request.headers['x-forwarded-proto'] || 'http';
    const host = request.headers['x-forwarded-host'] || request.headers.host || 'localhost:3000';
    return `${proto}://${host}`;
}

export default oauthRoutes;
