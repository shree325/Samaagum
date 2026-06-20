// ─── CityValidationService ────────────────────────────────────────────
// Validates city status before entity creation.
// Backend is the SOURCE OF TRUTH — frontend may also check,
// but this service enforces the rule server-side.
//
// Existing content (events/groups/communities) remains visible.
// Only NEW creation is blocked for inactive cities.

import { R_cityControls } from '../repositories/R_cityControls';

const cityRepo = new R_cityControls();

export type EntityType = 'event' | 'group' | 'community';

export interface CityValidationResult {
  allowed: boolean;
  message?: string;
  geonameId?: number;
  cityName?: string;
}

const ENTITY_MESSAGES: Record<EntityType, string> = {
  event: 'Event creation is currently disabled for this city.',
  group: 'Group creation is currently disabled for this city.',
  community: 'Community creation is currently disabled for this city.',
};

/**
 * Check if creation is allowed in the given city.
 * Returns { allowed: true } if the city is active or not found in city_controls.
 * Returns { allowed: false, message } if the city is inactive.
 */
export async function validateCityForCreation(
  geonameId: number,
  entityType: EntityType
): Promise<CityValidationResult> {
  const city = await cityRepo.findByGeonameId(geonameId);

  // City not in city_controls → allow creation (not yet controlled)
  if (!city) {
    return { allowed: true, geonameId };
  }

  if (!city.is_active) {
    return {
      allowed: false,
      message: ENTITY_MESSAGES[entityType],
      geonameId: city.geoname_id,
      cityName: city.city_name,
    };
  }

  return {
    allowed: true,
    geonameId: city.geoname_id,
    cityName: city.city_name,
  };
}

/**
 * Convenience wrapper — throws an error if city is inactive.
 * Use in controllers before creating entities.
 */
export async function requireActiveCity(
  geonameId: number,
  entityType: EntityType
): Promise<void> {
  const result = await validateCityForCreation(geonameId, entityType);
  if (!result.allowed) {
    const error: any = new Error(result.message);
    error.statusCode = 403;
    error.cityName = result.cityName;
    throw error;
  }
}
