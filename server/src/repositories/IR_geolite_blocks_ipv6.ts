import { IBaseRepository } from './IBaseRepository';

export interface IGeoliteBlockIPv6 {
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

export interface IR_geolite_blocks_ipv6
    extends IBaseRepository<IGeoliteBlockIPv6> {

    findByGeonameId(
        geonameId: number
    ): Promise<IGeoliteBlockIPv6[]>;

    findByNetwork(
        network: string
    ): Promise<IGeoliteBlockIPv6 | null>;
}