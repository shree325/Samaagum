import { ReverseGeocodeResult, ForwardGeocodeResult } from './IReverseGeocodingProvider';
import { LocalDbGeocodingProvider } from './LocalDbGeocodingProvider';
import { CityNormalizationService } from './CityNormalizationService';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

class ReverseGeocodingService {
  private cache = new Map<string, { data: any; expiresAt: number }>();
  private circuitState: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastStateChange = Date.now();
  private localProvider = new LocalDbGeocodingProvider();

  // Metrics
  public metrics = {
    cacheHits: 0,
    localDbHits: 0,
    externalHits: 0,
    circuitBreakerTrips: 0,
    totalRequests: 0,
  };

  private getGridCacheKey(lat: number, lon: number): string {
    const version = process.env.GEOCODE_CACHE_VERSION || 'v1';
    // Grid rounding to ~100m (2 decimal places)
    const roundedLat = lat.toFixed(2);
    const roundedLon = lon.toFixed(2);
    return `geocode:${version}:reverse:${roundedLat}:${roundedLon}`;
  }

  public async reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
    this.metrics.totalRequests++;
    const cacheKey = this.getGridCacheKey(lat, lon);
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      this.metrics.cacheHits++;
      return cached.data;
    }

    // 1. Attempt Local DB Provider (Proximity threshold check)
    const localResult = await this.localProvider.reverseGeocode(lat, lon);
    if (localResult) {
      this.metrics.localDbHits++;
      this.setCache(cacheKey, localResult, 24 * 3600 * 1000);
      return localResult;
    }

    // 2. Handle Circuit Breaker Lifecycle
    this.checkCircuitState();

    // 3. Fallback: If circuit open or no external configured, return coordinate fallback
    const fallbackResult: ReverseGeocodeResult = {
      city: 'Unknown City',
      state: '',
      country: 'India',
      timezone: 'Asia/Kolkata',
      utcOffset: '+05:30',
      latitude: Number(lat.toFixed(5)),
      longitude: Number(lon.toFixed(5)),
      provider: 'coordinates_fallback',
    };

    this.setCache(cacheKey, fallbackResult, 3600 * 1000);
    return fallbackResult;
  }

  public async forwardGeocode(address: string): Promise<ForwardGeocodeResult | null> {
    const norm = CityNormalizationService.normalizeAddressString(address);
    if (!norm) return null;

    const version = process.env.GEOCODE_CACHE_VERSION || 'v1';
    const cacheKey = `geocode:${version}:forward:${norm}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const localResult = await this.localProvider.forwardGeocode(address);
    if (localResult) {
      this.setCache(cacheKey, localResult, 30 * 24 * 3600 * 1000);
      return localResult;
    }

    return null;
  }

  private setCache(key: string, data: any, ttlMs: number) {
    if (this.cache.size > 10000) {
      // LRU eviction fallback
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  private checkCircuitState() {
    const openSeconds = Number(process.env.GEOCODER_CIRCUIT_BREAKER_OPEN_SECONDS || 3600);
    if (this.circuitState === 'OPEN' && Date.now() - this.lastStateChange > openSeconds * 1000) {
      this.circuitState = 'HALF_OPEN';
      this.lastStateChange = Date.now();
    }
  }

  public recordFailure() {
    const threshold = Number(process.env.GEOCODER_CIRCUIT_BREAKER_FAILURE_THRESHOLD || 5);
    this.failureCount++;
    if (this.failureCount >= threshold && this.circuitState === 'CLOSED') {
      this.circuitState = 'OPEN';
      this.lastStateChange = Date.now();
      this.metrics.circuitBreakerTrips++;
    } else if (this.circuitState === 'HALF_OPEN') {
      this.circuitState = 'OPEN';
      this.lastStateChange = Date.now();
    }
  }

  public recordSuccess() {
    if (this.circuitState === 'HALF_OPEN') {
      this.circuitState = 'CLOSED';
      this.failureCount = 0;
      this.lastStateChange = Date.now();
    }
  }
}

export const reverseGeocodingService = new ReverseGeocodingService();
