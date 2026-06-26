import fs from 'fs';
import path from 'path';

export interface CityLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
}

class LocationService {
  private cities: CityLocation[] = [];
  private isLoaded = false;

  constructor() {
    this.loadCities();
  }

  private loadCities() {
    try {
      const dataPath = path.join(__dirname, '../data/cities.json');
      if (fs.existsSync(dataPath)) {
        const data = fs.readFileSync(dataPath, 'utf8');
        this.cities = JSON.parse(data);
        console.log(`[LocationService] Loaded ${this.cities.length} cities into memory.`);
      } else {
        console.warn(`[LocationService] cities.json not found at ${dataPath}.`);
      }
      this.isLoaded = true;
    } catch (error) {
      console.error(`[LocationService] Failed to load cities:`, error);
      this.isLoaded = true; // prevent infinite retries
    }
  }

  public search(query: string, limit: number = 10): CityLocation[] {
    if (!this.isLoaded) {
      return [];
    }
    
    if (!query || query.length < 2) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    
    // Perform a simple case-insensitive substring search
    const results: CityLocation[] = [];
    for (const city of this.cities) {
      // Prioritize starting with, then fallback to includes
      if (city.name.toLowerCase().startsWith(lowerQuery)) {
        results.push(city);
      }
      if (results.length >= limit) break;
    }

    // If we haven't hit the limit, find some that include the string
    if (results.length < limit) {
      for (const city of this.cities) {
        if (!city.name.toLowerCase().startsWith(lowerQuery) && city.name.toLowerCase().includes(lowerQuery)) {
          results.push(city);
        }
        if (results.length >= limit) break;
      }
    }

    return results;
  }
  
  public getCityById(id: string): CityLocation | undefined {
    return this.cities.find(c => c.id === id);
  }

  /**
   * Validates if a given location name matches an active city in the admin server.
   * Allows skipping validation if the location string exactly matches the existing location
   * (to retain legacy deactivated locations already on a user's profile).
   */
  public async validateActiveLocation(locationName: string | undefined | null, existingLocation?: string | null): Promise<boolean> {
    if (!locationName) return true; // Empty location is usually handled by schema/form rules
    
    // If it's the exact same as the old one, we allow it to persist
    if (existingLocation && locationName === existingLocation) {
      return true;
    }

    // Extract city name if it's a full address (very basic extraction)
    const parts = locationName.split(',');
    const citySearch = parts[0].trim().toLowerCase();

    const { default: prisma } = require('../config/prisma');
    
    try {
      // Find matching active city
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT is_active FROM city_controls WHERE LOWER(city_name) = $1 LIMIT 1`,
        citySearch
      )) as any[];

      if (rows.length > 0 && rows[0].is_active) {
        return true;
      }
      
      // Secondary check: if nominatim gave a different display name but it contains our active city
      const allActiveRows = (await prisma.$queryRawUnsafe(
        `SELECT city_name FROM city_controls WHERE is_active = true`
      )) as any[];
      
      const isContained = allActiveRows.some((row: any) => {
        const dbCity = row.city_name.toLowerCase();
        return citySearch.includes(dbCity) || dbCity.includes(citySearch);
      });
      
      return isContained;
    } catch (e) {
      console.error('[LocationService] validation error:', e);
      return false; // Fail safe or fail open? The requirement says reject unconfigured
    }
  }
}

export const locationService = new LocationService();
