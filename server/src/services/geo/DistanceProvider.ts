export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export class DistanceProvider {
  /**
   * Calculates a bounding box in degrees around a target point for a given radius in meters.
   * 1 degree of latitude approx = 111,045 meters.
   */
  public static getBoundingBox(lat: number, lon: number, radiusMeters: number): BoundingBox {
    const latDelta = radiusMeters / 111045;
    const lonDelta = radiusMeters / (111045 * Math.cos((lat * Math.PI) / 180));

    return {
      minLat: Number((lat - latDelta).toFixed(5)),
      maxLat: Number((lat + latDelta).toFixed(5)),
      minLon: Number((lon - lonDelta).toFixed(5)),
      maxLon: Number((lon + lonDelta).toFixed(5)),
    };
  }

  /**
   * Calculates exact distance in meters between two lat/lon points using Haversine.
   */
  public static getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }
}
