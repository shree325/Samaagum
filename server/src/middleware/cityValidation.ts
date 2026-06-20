// ─── cityValidation middleware ────────────────────────────────────────
// Fastify preHandler hook for blocking creation in inactive cities.
// Backend is the SOURCE OF TRUTH — attach to any creation route.
//
// Usage in a controller:
//   import { requireActiveCityHook } from '../middleware/cityValidation';
//   fastify.post('/events', { preHandler: [authenticate, requireAdmin, requireActiveCityHook('event')] }, handler);

import { FastifyRequest, FastifyReply } from 'fastify';
import { validateCityForCreation, EntityType } from '../services/CityValidationService';

/**
 * Creates a Fastify preHandler that blocks creation if the city is inactive.
 * Reads `geoname_id` or `geonameId` from request.body.
 *
 * @param entityType - The type of entity being created ('event' | 'group' | 'community')
 * @returns Fastify preHandler function
 */
export function requireActiveCityHook(entityType: EntityType) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;

    // Extract geoname_id from body (supports both naming conventions)
    const geonameId = body?.geoname_id || body?.geonameId;

    // If no geoname_id provided, skip validation (city may not be required)
    if (!geonameId) return;

    const numericId = Number(geonameId);
    if (isNaN(numericId)) return;

    const result = await validateCityForCreation(numericId, entityType);

    if (!result.allowed) {
      return reply.status(403).send({
        success: false,
        message: result.message,
        code: 'CITY_INACTIVE',
        cityName: result.cityName,
        geonameId: result.geonameId,
      });
    }
  };
}
