import { R_geolite_locations } from "../repositories/R_geolite_locations";

const locationRepo = new R_geolite_locations();

export class GeoLiteService {
    async getCityByGeonameId(geonameId: number) {
        return locationRepo.findByGeonameId(geonameId);
    }
}