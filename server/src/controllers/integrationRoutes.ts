import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { VirtualMeetingService } from '../services/VirtualMeetingService';
import { encrypt } from '../utils/encryption';
import prisma from '../config/prisma';

export const integrationRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

    fastify.get('', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const status = await VirtualMeetingService.getProviderStatus(request.user.id);
            return reply.send({ success: true, data: status });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // ZOOM OAUTH
    fastify.get('/zoom/connect', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const clientId = process.env.ZOOM_CLIENT_ID;
            const redirectUri = process.env.ZOOM_REDIRECT_URI || 'http://localhost:3000/api/integrations/zoom/callback';
            
            if (!clientId) throw new Error('Zoom client ID is not configured');

            const state = Buffer.from(JSON.stringify({ userId: request.user.id })).toString('base64url');
            
            const params = new URLSearchParams({
                response_type: 'code',
                client_id: clientId,
                redirect_uri: redirectUri,
                state: state
            });

            return reply.redirect(`https://zoom.us/oauth/authorize?${params.toString()}`);
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    fastify.get('/zoom/callback', async (request: any, reply) => {
        try {
            const { code, state, error } = request.query as any;
            if (error || !code) {
                return reply.type('text/html').send('<html><body><script>window.close();</script></body></html>');
            }

            const stateData = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
            const userId = stateData.userId;
            
            const clientId = process.env.ZOOM_CLIENT_ID || '';
            const clientSecret = process.env.ZOOM_CLIENT_SECRET || '';
            const redirectUri = process.env.ZOOM_REDIRECT_URI || 'http://localhost:3000/api/integrations/zoom/callback';
            
            const authHeader = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            
            const response = await fetch('https://zoom.us/oauth/token', {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirectUri
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(err);
            }

            const tokenData: any = await response.json();
            
            let expiresAt = null;
            if (tokenData.expires_in) {
                expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
            }

            // Get user info (optional, for email storage)
            let email = null;
            try {
                const meRes = await fetch('https://api.zoom.us/v2/users/me', {
                    headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
                });
                if (meRes.ok) {
                    const meData: any = await meRes.json();
                    email = meData.email;
                }
            } catch (e) {}

            await prisma.user_integrations.upsert({
                where: { user_id_provider: { user_id: userId, provider: 'zoom' } },
                update: {
                    access_token: encrypt(tokenData.access_token),
                    refresh_token: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
                    expires_at: expiresAt,
                    email: email,
                    updated_at: new Date()
                },
                create: {
                    user_id: userId,
                    provider: 'zoom',
                    access_token: encrypt(tokenData.access_token),
                    refresh_token: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
                    expires_at: expiresAt,
                    email: email
                }
            });

            // Send script to close popup and notify opener
            return reply.type('text/html').send(`
                <html>
                <body>
                <script>
                  try {
                    new BroadcastChannel('samaagum_oauth').postMessage({ type: 'ZOOM_CONNECTED' });
                  } catch(e) {}
                  if (window.opener) {
                      window.opener.postMessage({ type: 'ZOOM_CONNECTED' }, '*');
                  }
                  window.close();
                </script>
                </body>
                </html>
            `);

        } catch (e: any) {
            console.error('Zoom callback error', e);
            return reply.type('text/html').send(`<html><body>Failed to connect: ${e.message} <script>setTimeout(() => window.close(), 3000);</script></body></html>`);
        }
    });

    fastify.delete('/zoom/disconnect', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            await VirtualMeetingService.disconnectProvider(request.user.id, 'zoom');
            return reply.send({ success: true, message: 'Disconnected' });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });


    // GOOGLE OAUTH
    fastify.get('/google/connect', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
            const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'http://localhost:3000/api/integrations/google/callback';
            
            if (!clientId) throw new Error('Google Calendar client ID is not configured');

            const state = Buffer.from(JSON.stringify({ userId: request.user.id })).toString('base64url');
            
            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'https://www.googleapis.com/auth/calendar.events',
                access_type: 'offline',
                prompt: 'consent', // force refresh token
                state: state
            });

            return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    fastify.get('/google/callback', async (request: any, reply) => {
        try {
            const { code, state, error } = request.query as any;
            if (error || !code) {
                return reply.type('text/html').send('<html><body><script>window.close();</script></body></html>');
            }

            const stateData = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
            const userId = stateData.userId;
            
            const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || '';
            const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '';
            const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'http://localhost:3000/api/integrations/google/callback';
            
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirectUri
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(err);
            }

            const tokenData: any = await response.json();
            
            let expiresAt = null;
            if (tokenData.expires_in) {
                expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
            }

            // Important: Google only sends refresh_token on the first prompt=consent authorization.
            // So we use upsert but don't overwrite refresh_token with null if we didn't get one.
            const existing = await prisma.user_integrations.findUnique({
                where: { user_id_provider: { user_id: userId, provider: 'google' } }
            });

            let newRefreshToken = existing ? existing.refresh_token : null;
            if (tokenData.refresh_token) {
                newRefreshToken = encrypt(tokenData.refresh_token);
            }

            await prisma.user_integrations.upsert({
                where: { user_id_provider: { user_id: userId, provider: 'google' } },
                update: {
                    access_token: encrypt(tokenData.access_token),
                    refresh_token: newRefreshToken,
                    expires_at: expiresAt,
                    updated_at: new Date()
                },
                create: {
                    user_id: userId,
                    provider: 'google',
                    access_token: encrypt(tokenData.access_token),
                    refresh_token: newRefreshToken,
                    expires_at: expiresAt
                }
            });

            return reply.type('text/html').send(`
                <html>
                <body>
                <script>
                  try {
                    new BroadcastChannel('samaagum_oauth').postMessage({ type: 'GOOGLE_CONNECTED' });
                  } catch(e) {}
                  if (window.opener) {
                      window.opener.postMessage({ type: 'GOOGLE_CONNECTED' }, '*');
                  }
                  window.close();
                </script>
                </body>
                </html>
            `);

        } catch (e: any) {
            console.error('Google callback error', e);
            return reply.type('text/html').send(`<html><body>Failed to connect: ${e.message} <script>setTimeout(() => window.close(), 3000);</script></body></html>`);
        }
    });

    fastify.delete('/google/disconnect', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            await VirtualMeetingService.disconnectProvider(request.user.id, 'google');
            return reply.send({ success: true, message: 'Disconnected' });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

};
