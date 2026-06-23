import { Reader } from '@maxmind/geoip2-node';

async function test() {
    console.log("STARTED");

    const reader = await Reader.open('./GeoLite2-City.mmdb');

    const result = reader.city('152.59.30.5');

    console.log({
        ip: '152.59.30.5',
        city: result.city?.names?.en,
        state: result.subdivisions?.[0]?.names?.en,
        country: result.country?.names?.en,
        latitude: result.location?.latitude,
        longitude: result.location?.longitude,
        timezone: result.location?.timeZone,
    });
}

test().catch(console.error);