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
            const { clientId } = settings?.google || {};
            let clientSecret = settings?.google?.clientSecret;
            if (clientSecret && typeof clientSecret === 'string') {
                clientSecret = clientSecret.replace(/\\",\s*\\"?redirect_uris.*/, '')
                                           .replace(/",\s*"?redirect_uris.*/, '')
                                           .replace(/\\".*$/, '')
                                           .replace(/".*$/, '')
                                           .trim();
            }

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
            let isNewUser = false;

            if (!dbUser) {
                isNewUser = true;
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
                // Auto-assign the default plan to new users
                const { SubscriptionActivationService } = await import('../services/SubscriptionActivationService');
                SubscriptionActivationService.assignDefaultPlanToUser(dbUser.id, tenantId).catch(console.error);
            } else if (!(dbUser as any).profile_completed) {
                // Existing user who never finished onboarding — send them back through it
                isNewUser = true;
            }


            // Issue JWT token
            const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
            const payload = Buffer.from(JSON.stringify({
                id: dbUser.id,
                tenantId: dbUser.tenant_id,
                email: dbUser.primary_email,
                name,
                firstName: googleUser.given_name || name.split(' ')[0] || '',
                lastName: googleUser.family_name || name.split(' ').slice(1).join(' ') || '',
                picture: googleUser.picture || '',
                role: 'user',
                provider: 'google'
            })).toString('base64url');
            const token = `${header}.${payload}.mocksignature`;

            console.log(`✅ Google OAuth login: ${email} → ${frontendBase}`);

            // Redirect back to frontend — the inline script in index.html saves the token and goes to home
            return reply.redirect(`${frontendBase}/?token=${encodeURIComponent(token)}&auth=google${isNewUser ? '&isNewUser=true' : ''}`);

        } catch (err: any) {
            console.error('Google OAuth callback error:', err);
            return reply.redirect(`${frontendBase}/?auth_error=server_error`);
        }
    });

    // GET /auth/providers — Public endpoint to check which providers are enabled
    fastify.get('/providers', async (request: any, reply) => {
        try {
            const authRow = await prisma.platform_settings.findFirst({
                where: { scope_tenant_id: null, key: 'auth_settings' }
            });

            const settings = authRow?.value as any || {};
            const providersList = [];

            // Add Google
            providersList.push({
                key: 'google',
                displayName: 'Google',
                enabled: !!settings.google?.enabled
            });

            // Add LinkedIn
            providersList.push({
                key: 'linkedin',
                displayName: 'LinkedIn',
                enabled: !!settings.linkedin?.enabled
            });

            // Add all other keys that are custom
            for (const key of Object.keys(settings)) {
                if (key !== 'google' && key !== 'linkedin') {
                    const provider = settings[key];
                    providersList.push({
                        key,
                        displayName: provider.displayName || key,
                        enabled: !!provider.enabled,
                        isCustom: true
                    });
                }
            }

            return {
                success: true,
                providers: providersList
            };
        } catch (err: any) {
            return {
                success: true,
                providers: [
                    { key: 'google', displayName: 'Google', enabled: false },
                    { key: 'linkedin', displayName: 'LinkedIn', enabled: false }
                ]
            };
        }
    });

    // GET /auth/linkedin — Redirect to LinkedIn consent screen
    fastify.get('/linkedin', async (request: any, reply) => {
        try {
            const authRow = await prisma.platform_settings.findFirst({
                where: { scope_tenant_id: null, key: 'auth_settings' }
            });

            const settings = authRow?.value as any;
            const clientId = settings?.linkedin?.clientId;

            if (!settings?.linkedin?.enabled || !clientId) {
                return reply.status(503).send({
                    success: false,
                    message: 'LinkedIn OAuth is not enabled. Configure it in Admin → System Settings → Auth.'
                });
            }

            const serverBase = getBaseUrl(request);
            const redirectUri = `${serverBase}/api/auth/linkedin/callback`;

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
                response_type: 'code',
                client_id: clientId,
                redirect_uri: redirectUri,
                state,
                scope: 'openid email profile',
            });

            return reply.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`);

        } catch (err: any) {
            return reply.status(500).send({ success: false, message: err.message || 'LinkedIn OAuth initiation failed.' });
        }
    });

    // GET /auth/linkedin/callback — Handle LinkedIn OAuth callback
    fastify.get('/linkedin/callback', async (request: any, reply) => {
        let frontendBase = 'http://localhost:8080';
        let mode = 'login';
        try {
            const rawState = (request.query as any).state;
            if (rawState) {
                const stateData = JSON.parse(Buffer.from(rawState, 'base64url').toString('utf8'));
                if (stateData.frontendOrigin) frontendBase = stateData.frontendOrigin;
                if (stateData.mode) mode = stateData.mode;
            }
        } catch {}

        try {
            const { code, error } = request.query as any;

            if (error || !code) {
                return reply.redirect(`${frontendBase}/?auth_error=${encodeURIComponent(error || 'oauth_cancelled')}`);
            }

            const authRow = await prisma.platform_settings.findFirst({
                where: { scope_tenant_id: null, key: 'auth_settings' }
            });
            const settings = authRow?.value as any;
            const { clientId, clientSecret } = settings?.linkedin || {};

            if (!clientId || !clientSecret) {
                return reply.redirect(`${frontendBase}/?auth_error=oauth_not_configured`);
            }

            const redirectUri = `${getBaseUrl(request)}/api/auth/linkedin/callback`;

            const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri
                }).toString()
            });

            const tokenData: any = await tokenRes.json();
            if (!tokenRes.ok || tokenData.error) {
                console.error('LinkedIn token exchange failed:', tokenData);
                return reply.redirect(`${frontendBase}/?auth_error=token_exchange_failed`);
            }

            const userInfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
            });

            const linkedinUser = await userInfoRes.json() as any;
            if (!userInfoRes.ok || !linkedinUser.email) {
                console.error('LinkedIn user info fetch failed:', linkedinUser);
                return reply.redirect(`${frontendBase}/?auth_error=user_info_failed`);
            }

            const email = linkedinUser.email;
            const name = linkedinUser.name || `${linkedinUser.given_name || ''} ${linkedinUser.family_name || ''}`.trim() || email.split('@')[0];

            const tenant = await prisma.tenants.findFirst();
            const tenantId = tenant?.id || '00000000-0000-0000-0000-000000000000';

            let dbUser = await prisma.users.findFirst({ where: { primary_email: email } });
            let isNewUser = false;

            if (!dbUser) {
                isNewUser = true;
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
                // Auto-assign the default plan to new users
                const { SubscriptionActivationService } = await import('../services/SubscriptionActivationService');
                SubscriptionActivationService.assignDefaultPlanToUser(dbUser.id, tenantId).catch(console.error);
            }

            const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
            const payload = Buffer.from(JSON.stringify({
                id: dbUser.id,
                tenantId: dbUser.tenant_id,
                email: dbUser.primary_email,
                name,
                firstName: linkedinUser.given_name || name.split(' ')[0] || '',
                lastName: linkedinUser.family_name || name.split(' ').slice(1).join(' ') || '',
                picture: linkedinUser.picture || '',
                role: 'user',
                provider: 'linkedin'
            })).toString('base64url');
            const token = `${header}.${payload}.mocksignature`;

            console.log(`✅ LinkedIn OAuth login: ${email} → ${frontendBase}`);

            return reply.redirect(`${frontendBase}/?token=${encodeURIComponent(token)}&auth=linkedin${isNewUser ? '&isNewUser=true' : ''}`);

        } catch (err: any) {
            console.error('LinkedIn OAuth callback error:', err);
            return reply.redirect(`${frontendBase}/?auth_error=server_error`);
        }
    });

    // GET /auth/custom/:providerKey — Redirect to custom provider's authorization endpoint
    fastify.get('/custom/:providerKey', async (request: any, reply) => {
        try {
            const { providerKey } = request.params as any;
            const authRow = await prisma.platform_settings.findFirst({
                where: { scope_tenant_id: null, key: 'auth_settings' }
            });

            const settings = authRow?.value as any;
            const provider = settings?.[providerKey];

            if (!provider || !provider.enabled || !provider.clientId || !provider.authorizationEndpoint) {
                return reply.status(503).send({
                    success: false,
                    message: `Custom provider '${providerKey}' is not fully configured or enabled.`
                });
            }

            const serverBase = getBaseUrl(request);
            const redirectUri = `${serverBase}/api/auth/custom/${providerKey}/callback`;

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
                response_type: 'code',
                client_id: provider.clientId,
                redirect_uri: redirectUri,
                state,
                scope: provider.scope || 'openid email profile',
            });

            const authorizationUrl = provider.authorizationEndpoint.includes('?')
                ? `${provider.authorizationEndpoint}&${params.toString()}`
                : `${provider.authorizationEndpoint}?${params.toString()}`;

            return reply.redirect(authorizationUrl);
        } catch (err: any) {
            return reply.status(500).send({ success: false, message: err.message || 'Custom OAuth initiation failed.' });
        }
    });

    // GET /auth/custom/:providerKey/callback — Handle custom OAuth callback
    fastify.get('/custom/:providerKey/callback', async (request: any, reply) => {
        const { providerKey } = request.params as any;
        let frontendBase = 'http://localhost:8080';
        let mode = 'login';
        try {
            const rawState = (request.query as any).state;
            if (rawState) {
                const stateData = JSON.parse(Buffer.from(rawState, 'base64url').toString('utf8'));
                if (stateData.frontendOrigin) frontendBase = stateData.frontendOrigin;
                if (stateData.mode) mode = stateData.mode;
            }
        } catch {}

        try {
            const { code, error } = request.query as any;

            if (error || !code) {
                return reply.redirect(`${frontendBase}/?auth_error=${encodeURIComponent(error || 'oauth_cancelled')}`);
            }

            const authRow = await prisma.platform_settings.findFirst({
                where: { scope_tenant_id: null, key: 'auth_settings' }
            });
            const settings = authRow?.value as any;
            const provider = settings?.[providerKey];

            if (!provider || !provider.clientId || !provider.clientSecret || !provider.tokenEndpoint || !provider.userEndpoint) {
                return reply.redirect(`${frontendBase}/?auth_error=oauth_not_configured`);
            }

            const redirectUri = `${getBaseUrl(request)}/api/auth/custom/${providerKey}/callback`;

            const tokenRes = await fetch(provider.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'User-Agent': 'Samaagum-App'
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    client_id: provider.clientId,
                    client_secret: provider.clientSecret,
                    redirect_uri: redirectUri
                }).toString()
            });

            let tokenData: any;
            const tokenResponseText = await tokenRes.text();
            try {
                tokenData = JSON.parse(tokenResponseText);
            } catch (jsonErr) {
                const parsed = new URLSearchParams(tokenResponseText);
                if (parsed.has('access_token')) {
                    tokenData = {
                        access_token: parsed.get('access_token'),
                        token_type: parsed.get('token_type'),
                        scope: parsed.get('scope')
                    };
                } else {
                    console.error('Failed to parse token response:', tokenResponseText);
                    return reply.redirect(`${frontendBase}/?auth_error=token_parse_failed`);
                }
            }

            if (!tokenRes.ok || !tokenData || tokenData.error || !tokenData.access_token) {
                console.error('Custom token exchange failed:', tokenData || tokenResponseText);
                return reply.redirect(`${frontendBase}/?auth_error=token_exchange_failed`);
            }

            const accessToken = tokenData.access_token;

            const profileRes = await fetch(provider.userEndpoint, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'User-Agent': 'Samaagum-App'
                }
            });

            const userProfile = await profileRes.json() as any;
            if (!profileRes.ok || !userProfile) {
                console.error('Custom profile fetch failed:', userProfile);
                return reply.redirect(`${frontendBase}/?auth_error=profile_fetch_failed`);
            }

            const emailFieldKey = provider.emailField || 'email';
            const nameFieldKey = provider.nameField || 'name';

            let email = userProfile[emailFieldKey];
            let name = userProfile[nameFieldKey];



            if (!email) {
                for (const key of Object.keys(userProfile)) {
                    if (key.toLowerCase().includes('email') && typeof userProfile[key] === 'string') {
                        email = userProfile[key];
                        break;
                    }
                }
            }

            if (!email) {
                return reply.redirect(`${frontendBase}/?auth_error=no_email`);
            }

            if (!name) {
                name = userProfile.name || userProfile.login || userProfile.username || userProfile.display_name || email.split('@')[0];
            }

            const tenant = await prisma.tenants.findFirst();
            const tenantId = tenant?.id || '00000000-0000-0000-0000-000000000000';

            let dbUser = await prisma.users.findFirst({ where: { primary_email: email } });
            let isNewUser = false;

            if (!dbUser) {
                isNewUser = true;
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
                // Auto-assign the default plan to new users
                const { SubscriptionActivationService } = await import('../services/SubscriptionActivationService');
                SubscriptionActivationService.assignDefaultPlanToUser(dbUser.id, tenantId).catch(console.error);
            }

            const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
            const payload = Buffer.from(JSON.stringify({
                id: dbUser.id,
                tenantId: dbUser.tenant_id,
                email: dbUser.primary_email,
                name,
                firstName: userProfile.given_name || name.split(' ')[0] || '',
                lastName: userProfile.family_name || name.split(' ').slice(1).join(' ') || '',
                picture: userProfile.picture || userProfile.avatar_url || '',
                role: 'user',
                provider: providerKey
            })).toString('base64url');
            const token = `${header}.${payload}.mocksignature`;

            console.log(`✅ Custom OAuth login (${providerKey}): ${email} → ${frontendBase}`);

            return reply.redirect(`${frontendBase}/?token=${encodeURIComponent(token)}&auth=${providerKey}${isNewUser ? '&isNewUser=true' : ''}`);

        } catch (err: any) {
            console.error(`Custom OAuth callback error for ${providerKey}:`, err);
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
