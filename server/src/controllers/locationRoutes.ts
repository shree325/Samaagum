import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getLocationFromIP } from '../services/LocationService';
import { R_cityControls } from '../repositories/R_cityControls';

export const locationRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // ──────────────────────────────────────────────────────────────────
    // GET /detect — Detect city from request IP
    // Used for user experience: auto-suggest location on public pages
    // ──────────────────────────────────────────────────────────────────
    fastify.get('/detect', async (request: any, reply) => {
        try {
            // Get IP from headers or connection
            const ip = request.headers['x-forwarded-for']?.split(',')[0]?.trim()
                || request.headers['x-real-ip']
                || request.ip
                || '127.0.0.1';

            const location = await getLocationFromIP(ip);

            if (!location?.city) {
                return reply.status(404).send({
                    success: false,
                    message: 'City not detected from IP'
                });
            }

            return {
                success: true,
                data: location
            };
        }
        catch (e: any) {
            console.error("Location Detect Error =>", e);

            return reply.status(500).send({
                success: false,
                message: e?.message || 'Internal server error'
            });
        }
    });

    // ──────────────────────────────────────────────────────────────────
    // GET /cities — Fetch active cities for user picker
    // ──────────────────────────────────────────────────────────────────
    fastify.get('/cities', async (request: any, reply) => {
        try {
            const query = request.query || {};
            const cityRepo = new R_cityControls();
            const opts = {
                page: query.page ? Number(query.page) : 1,
                limit: query.limit ? Number(query.limit) : 50,
                search: query.search || undefined,
                status: 'active' as 'active' | 'inactive' | 'all', // Only active cities for users
                sort: 'city_name' as 'city_name', // ensure literal type
                order: 'asc' as 'asc' // ensure literal type
            };
            
            const result = await cityRepo.findAll(opts);
            const data = result.data.map((c: any) => ({
                geoname_id: Number(c.geoname_id),
                city_name: c.city_name,
                state_name: c.state_name,
                country_name: c.country_name,
                latitude: c.latitude,
                longitude: c.longitude
            }));

            return { success: true, data, total: result.total, page: result.page, totalPages: result.totalPages };
        } catch (e: any) {
            console.error("Fetch Cities Error =>", e);
            return reply.status(500).send({
                success: false,
                message: e?.message || 'Internal server error'
            });
        }
    });
};

export default locationRoutes;
