import fs from 'fs';
import path from 'path';
import { R_geolite_blocks_ipv4 } from '../repositories/R_geolite_blocks_ipv4';
import { R_geolite_locations } from '../repositories/R_geolite_locations';
import { R_cityControls } from '../repositories/R_cityControls';
import { ICityControl } from '../repositories/ICityControl';
import prisma from '../config/prisma';

export interface CityLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
}

export interface DetectedLocation {
  geoname_id: number;
  city_name: string;
  state_name: string | null;
  country_name: string | null;
  latitude: number | null;
  longitude: number | null;
}

class LocationService {
  private cities: CityLocation[] = [];
  private isLoaded = false;
  private readonly blocksRepo = new R_geolite_blocks_ipv4();
  private readonly locationsRepo = new R_geolite_locations();
  private readonly cityControlsRepo = new R_cityControls();

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

  public async search(query: string, limit: number = 10): Promise<(CityLocation & { is_active: boolean })[]> {
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
          if (!results.some(r => r.id === city.id)) {
            results.push(city);
          }
        }
        if (results.length >= limit) break;
      }
    }

    const cityNames = results.map(r => r.name);
    const controls = await prisma.city_controls.findMany({
      where: { city_name: { in: cityNames } },
      select: { city_name: true, is_active: true }
    });

    return results.map(r => {
      const ctrl = controls.find(c => c.city_name.toLowerCase() === r.name.toLowerCase());
      return {
        ...r,
        is_active: ctrl ? ctrl.is_active : true
      };
    });
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

  public async detectByIp(ip: string): Promise<DetectedLocation | null> {
    if (!ip || this.isPrivateIp(ip)) return null;

    const block = await this.blocksRepo.findByIp(ip);
    if (!block?.geoname_id) return null;

    const geoLoc = await this.locationsRepo.findByGeonameId(Number(block.geoname_id));
    if (!geoLoc?.city_name) return null;

    const controls = await this.cityControlsRepo.findByCityName(geoLoc.city_name);
    const activeCity = controls.find(c => c.is_active);

    if (activeCity) return this.toDetectedLocation(activeCity);

    const fallbackLat = Number(block.latitude ?? 0);
    const fallbackLon = Number(block.longitude ?? 0);
    return this.findNearestActiveCity(fallbackLat, fallbackLon);
  }

  private async findNearestActiveCity(lat: number, lon: number): Promise<DetectedLocation | null> {
    const rows = await prisma.$queryRawUnsafe<ICityControl[]>(
      `SELECT geoname_id, city_name, state_name, country_name, latitude, longitude
       FROM city_controls
       WHERE is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL
       LIMIT 2000`
    );
    if (!rows.length) return null;

    let nearest: ICityControl | null = null;
    let minDist = Infinity;

    for (const city of rows) {
      const cLat = Number(city.latitude);
      const cLon = Number(city.longitude);
      if (isNaN(cLat) || isNaN(cLon)) continue;
      const dist = this.haversineKm(lat, lon, cLat, cLon);
      if (dist < minDist) { minDist = dist; nearest = city; }
    }

    return nearest ? this.toDetectedLocation(nearest) : null;
  }

  private isPrivateIp(ip: string): boolean {
    return (
      ip === '127.0.0.1' || ip === '::1' ||
      ip.startsWith('10.') || ip.startsWith('172.16.') ||
      ip.startsWith('192.168.') || ip.startsWith('::ffff:127.')
    );
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toDetectedLocation(city: ICityControl): DetectedLocation {
    return {
      geoname_id: city.geoname_id,
      city_name: city.city_name,
      state_name: city.state_name || null,
      country_name: city.country_name || null,
      latitude: city.latitude !== null ? Number(city.latitude) : null,
      longitude: city.longitude !== null ? Number(city.longitude) : null,
    };
  }
}

export const locationService = new LocationService();
