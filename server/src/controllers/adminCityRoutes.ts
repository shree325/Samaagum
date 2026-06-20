// ─── adminCityRoutes ──────────────────────────────────────────────────
// Admin CRUD endpoints for city_controls
// Follows existing Samaagum controller pattern (FastifyPluginAsync)

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { R_cityControls } from '../repositories/R_cityControls';
import { ICityControlListOptions } from '../repositories/ICityControl';
import { getLocationFromIP } from '../services/LocationService';
import { validateCityForCreation, EntityType } from '../services/CityValidationService';
import { R_geolite_locations } from '../repositories/R_geolite_locations';

export const adminCityRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const cityRepo = new R_cityControls();

    // ──────────────────────────────────────────────────────────────────
    // GET /cities — List with pagination, search, filters, sort
    // ──────────────────────────────────────────────────────────────────
    fastify.get('/cities', {
        preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin]
    }, async (request: any, reply) => {
        try {
            const query = request.query || {};
            const opts: ICityControlListOptions = {
                page: query.page ? Number(query.page) : 1,
                limit: query.limit ? Number(query.limit) : 50,
                search: query.search || undefined,
                status: query.status || 'all',
                state: query.state || undefined,
                country: query.country || undefined,
                sort: query.sort || 'city_name',
                order: query.order || 'asc',
            };

            const result = await cityRepo.findAll(opts);
            const data = result.data.map((c: any) => ({
                ...c,
                geoname_id: Number(c.geoname_id)
            }));
            return { success: true, ...result, data };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // ──────────────────────────────────────────────────────────────────
    // GET /cities/stats — Dashboard statistics
    // ──────────────────────────────────────────────────────────────────
    fastify.get('/cities/stats', {
        preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin]
    }, async (request: any, reply) => {
        try {
            const stats = await cityRepo.getStats();
            return { success: true, data: stats };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // ──────────────────────────────────────────────────────────────────
    // GET /cities/filters — Distinct states & countries for dropdowns
    // ──────────────────────────────────────────────────────────────────
    fastify.get('/cities/filters', {
        preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin]
    }, async (request: any, reply) => {
        try {
            const query = request.query || {};
            const countries = await cityRepo.getDistinctCountries();
            const states = await cityRepo.getDistinctStates(query.country || undefined);
            return { success: true, data: { countries, states } };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // ──────────────────────────────────────────────────────────────────
    // GET /cities/:geonameId — Single city detail
    // ──────────────────────────────────────────────────────────────────
    fastify.get('/cities/:geonameId', {
        preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin]
    }, async (request: any, reply) => {
        try {
            const geonameId = Number(request.params.geonameId);
            if (isNaN(geonameId)) {
                return reply.status(400).send({ success: false, message: 'Invalid geoname ID' });
            }

            const city = await cityRepo.findByGeonameId(geonameId);
            if (!city) {
                return reply.status(404).send({ success: false, message: 'City not found' });
            }

            return { success: true, data: { ...city, geoname_id: Number((city as any).geoname_id) } };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // ──────────────────────────────────────────────────────────────────
    // PATCH /cities/:geonameId/toggle — Enable/disable single city
    // ──────────────────────────────────────────────────────────────────
    fastify.patch('/cities/:geonameId/toggle', {
        preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin]
    }, async (request: any, reply) => {
        try {
            const geonameId = Number(request.params.geonameId);
            if (isNaN(geonameId)) {
                return reply.status(400).send({ success: false, message: 'Invalid geoname ID' });
            }

            const body = request.body as any;
            const isActive = body.isActive === true || body.isActive === 'true';
            const updatedBy = request.user?.email || 'admin';

            const updated = await cityRepo.toggleActive(geonameId, isActive, updatedBy);
            if (!updated) {
                return reply.status(404).send({ success: false, message: 'City not found' });
            }

            return {
                success: true,
                data: { ...updated, geoname_id: Number((updated as any).geoname_id) },
                message: `City "${updated.city_name}" ${isActive ? 'enabled' : 'disabled'} successfully`,
            };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // ──────────────────────────────────────────────────────────────────
    // PATCH /cities/bulk-toggle — Bulk enable/disable
    // Supports: { geonameIds: number[], isActive: boolean }
    //       or: { state: string, country?: string, isActive: boolean }
    // ──────────────────────────────────────────────────────────────────
    fastify.patch('/cities/bulk-toggle', {
        preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin]
    }, async (request: any, reply) => {
        try {
            const body = request.body as any;
            const isActive = body.isActive === true || body.isActive === 'true';
            const updatedBy = request.user?.email || 'admin';

            let affected = 0;

            if (body.state) {
                // Toggle all cities in a state
                affected = await cityRepo.toggleByState(body.state, isActive, updatedBy, body.country);
            } else if (body.geonameIds && Array.isArray(body.geonameIds)) {
                // Toggle specific cities by ID
                const ids = body.geonameIds.map(Number).filter((n: number) => !isNaN(n));
                affected = await cityRepo.bulkToggle(ids, isActive, updatedBy);
            } else {
                return reply.status(400).send({
                    success: false,
                    message: 'Provide either "geonameIds" array or "state" string',
                });
            }

            return {
                success: true,
                affected,
                message: `${affected} cities ${isActive ? 'enabled' : 'disabled'} successfully`,
            };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // ──────────────────────────────────────────────────────────────────
    // GET /cities/check/:geonameId — Check if city is active
    // Used by frontend before creation forms
    // ──────────────────────────────────────────────────────────────────
    fastify.get('/cities/check/:geonameId', {
        preHandler: [(fastify as any).authenticate]
    }, async (request: any, reply) => {
        try {
            const geonameId = Number(request.params.geonameId);
            if (isNaN(geonameId)) {
                return reply.status(400).send({ success: false, message: 'Invalid geoname ID' });
            }

            const entityType: EntityType = (request.query?.entityType as EntityType) || 'event';
            const result = await validateCityForCreation(geonameId, entityType);

            return { success: true, ...result };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

};

export default adminCityRoutes;
