// ─── LocationService ──────────────────────────────────────────────────
// Database-backed geo lookup service
// Uses raw SQL against geolite2_* tables (no Prisma models)
// Wraps the existing MMDB-based geoip.service for IP lookups

import prisma from '../config/prisma';
import { getLocationFromIP as mmdbLookup } from './geoip.service';
import { R_cityControls } from '../repositories/R_cityControls';

const cityRepo = new R_cityControls();

export interface GeoLocation {
  geonameId: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  countryIso: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  isActive: boolean;
}

/**
 * Detect location from IP using the MMDB reader,
 * then enrich with city_controls status from the database.
 */

export async function getLocationFromIP(ip: string): Promise<GeoLocation> {
  try {
    const mmdbResult = mmdbLookup(ip);
    console.log("Detected IP:", ip);
    console.log("MMDB RESULT =>", mmdbResult);

    // Try to find the geoname_id from geolite2_locations by matching city
    let geonameId: number | null = null;
    let isActive = true;

    if (mmdbResult.city) {
      const rows = await prisma.$queryRawUnsafe<{ geoname_id: number }[]>(
        `
        SELECT geoname_id
        FROM geolite2_locations
        WHERE city_name = $1
          AND locale_code = 'en'
        LIMIT 1
        `,
        mmdbResult.city
      );

      if (rows.length > 0 && rows[0].geoname_id) {
        geonameId = Number(rows[0].geoname_id);
        isActive = await cityRepo.isCityActive(geonameId);
      }
    }

    return {
      geonameId,
      city: mmdbResult.city || null,
      state: mmdbResult.state || null,
      country: mmdbResult.country || null,
      countryIso: null,
      latitude: mmdbResult.latitude || null,
      longitude: mmdbResult.longitude || null,
      timezone: null,
      isActive,
    };
  } catch (err: any) {
    console.warn('⚠️ LocationService.getLocationFromIP failed:', err.message);

    return {
      geonameId: null,
      city: null,
      state: null,
      country: null,
      countryIso: null,
      latitude: null,
      longitude: null,
      timezone: null,
      isActive: true,
    };
  }
}

/**
 * Get city details from geolite2_locations by geoname_id.
 * Uses raw SQL — geolite2_locations is NOT a Prisma model.
 */
export async function getCityByGeonameId(geonameId: number): Promise<{
  geonameId: number;
  cityName: string | null;
  stateName: string | null;
  countryName: string | null;
  countryIso: string | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
} | null> {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT 
       geoname_id, city_name, subdivision_1_name, country_name,
       country_iso_code, time_zone
     FROM geolite2_locations 
     WHERE geoname_id = $1 AND locale_code = 'en'
     LIMIT 1`,
    geonameId
  );

  if (!rows.length) return null;

  const row = rows[0];

  // Get lat/lng from ipv4 blocks
  const coordRows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT latitude, longitude FROM geolite2_ipv4_blocks
     WHERE geoname_id = $1 AND latitude IS NOT NULL
     LIMIT 1`,
    geonameId
  );

  return {
    geonameId: Number(row.geoname_id),
    cityName: row.city_name,
    stateName: row.subdivision_1_name,
    countryName: row.country_name,
    countryIso: row.country_iso_code,
    timezone: row.time_zone,
    latitude: coordRows[0]?.latitude || null,
    longitude: coordRows[0]?.longitude || null,
  };
}

/**
 * Check if a city is active in city_controls.
 * Returns true if the city is not found (allow by default).
 */
export async function isCityActive(geonameId: number): Promise<boolean> {
  return cityRepo.isCityActive(geonameId);
}
