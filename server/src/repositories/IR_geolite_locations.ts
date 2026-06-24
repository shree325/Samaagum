import { IBaseRepository } from './IBaseRepository';

export interface IGeoliteLocation {
    geoname_id: number;

    locale_code?: string;

    continent_code?: string;
    continent_name?: string;

    country_iso_code?: string;
    country_name?: string;

    subdivision_1_iso_code?: string;
    subdivision_1_name?: string;

    subdivision_2_iso_code?: string;
    subdivision_2_name?: string;

    city_name?: string;

    metro_code?: string;

    time_zone?: string;

    is_in_european_union?: boolean;
}

export interface IR_geolite_locations
    extends IBaseRepository<IGeoliteLocation> {

    findByGeonameId(
        geonameId: number
    ): Promise<IGeoliteLocation | null>;

    findByCityName(
        cityName: string
    ): Promise<IGeoliteLocation[]>;
}