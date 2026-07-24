import { IReverseGeocodingProvider, ReverseGeocodeResult, ForwardGeocodeResult } from './IReverseGeocodingProvider';
import { CityNormalizationService } from './CityNormalizationService';
import prisma from '../../config/prisma';

export class LocalDbGeocodingProvider implements IReverseGeocodingProvider {
  public name = 'local_db';

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  public async reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult | null> {
    try {
      const matchRadiusMeters = Number(process.env.LOCAL_DB_MATCH_RADIUS_METERS || 8000);
      const matchRadiusKm = matchRadiusMeters / 1000;

      // Query active city controls with valid coordinates
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT geoname_id, city_name, state_name, country_name, latitude, longitude
         FROM city_controls
         WHERE is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL
         LIMIT 2000`
      );

      if (!rows || rows.length === 0) return null;

      let nearest: any = null;
      let minDist = Infinity;

      for (const row of rows) {
        const cLat = Number(row.latitude);
        const cLon = Number(row.longitude);
        if (isNaN(cLat) || isNaN(cLon)) continue;

        const dist = this.haversineKm(lat, lon, cLat, cLon);
        if (dist < minDist) {
          minDist = dist;
          nearest = row;
        }
      }

      if (nearest && minDist <= matchRadiusKm) {
        return {
          city: CityNormalizationService.normalizeCityName(nearest.city_name),
          state: nearest.state_name || '',
          country: nearest.country_name || 'India',
          timezone: 'Asia/Kolkata',
          utcOffset: '+05:30',
          latitude: Number(nearest.latitude),
          longitude: Number(nearest.longitude),
          provider: this.name,
        };
      }

      return null;
    } catch (err) {
      console.error('[LocalDbGeocodingProvider] Error:', err);
      return null;
    }
  }

  public async forwardGeocode(address: string): Promise<ForwardGeocodeResult | null> {
    try {
      if (!address || typeof address !== 'string') return null;
      const cleanAddr = address.toLowerCase();

      // Query active city controls with valid coordinates
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT city_name, state_name, country_name, latitude, longitude
         FROM city_controls
         WHERE is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL
         ORDER BY CHAR_LENGTH(city_name) DESC`
      );

      if (!rows || rows.length === 0) return null;

      // Match city name in address string
      for (const row of rows) {
        const cName = (row.city_name || '').toLowerCase().trim();
        if (cName.length >= 3 && cleanAddr.includes(cName)) {
          return {
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            normalizedAddress: `${row.city_name}, ${row.state_name || ''}`,
            confidence: 'HIGH',
            provider: this.name,
          };
        }
      }

      return null;
    } catch {
      return null;
    }
  }
}
