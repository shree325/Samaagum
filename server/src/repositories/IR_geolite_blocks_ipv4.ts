import { IBaseRepository } from './IBaseRepository';

export interface IGeoliteBlockIPv4 {
    network: string;

    geoname_id?: number;

    registered_country_geoname_id?: number;
    represented_country_geoname_id?: number;

    is_anonymous_proxy?: boolean;
    is_satellite_provider?: boolean;

    postal_code?: string;

    latitude?: number;
    longitude?: number;

    accuracy_radius?: number;

    is_anycast?: boolean;
}

export interface IR_geolite_blocks_ipv4
    extends IBaseRepository<IGeoliteBlockIPv4> {

    findByGeonameId(
        geonameId: number
    ): Promise<IGeoliteBlockIPv4[]>;

    findByNetwork(
        network: string
    ): Promise<IGeoliteBlockIPv4 | null>;
}