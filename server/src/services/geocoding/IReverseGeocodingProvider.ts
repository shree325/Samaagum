export interface ReverseGeocodeResult {
  city: string;
  state: string;
  country: string;
  timezone?: string;
  utcOffset?: string;
  latitude: number;
  longitude: number;
  provider: string;
}

export interface ForwardGeocodeResult {
  latitude: number;
  longitude: number;
  normalizedAddress: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  provider: string;
}

export interface IReverseGeocodingProvider {
  name: string;
  reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult | null>;
  forwardGeocode?(address: string): Promise<ForwardGeocodeResult | null>;
}
