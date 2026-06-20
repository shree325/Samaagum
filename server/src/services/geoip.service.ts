import { Reader } from "@maxmind/geoip2-node";
import path from "path";

let reader: any;

export async function initGeoIP() {
    const dbPath = path.join(
        process.cwd(),
        "data",
        "GeoLite2-City.mmdb"
    );

    console.log("GeoLite DB Path:", dbPath);

    reader = await Reader.open(dbPath);

    console.log("🌍 GeoLite2 loaded");
}

export function getLocationFromIP(ip: string) {
    const result = reader.city(ip);

    return {
        country: result.country?.names?.en,
        state: result.subdivisions?.[0]?.names?.en,
        city: result.city?.names?.en,
        latitude: result.location?.latitude,
        longitude: result.location?.longitude,
    };
}