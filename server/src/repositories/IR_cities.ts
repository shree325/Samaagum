import { IBaseRepository } from './IBaseRepository';

export interface ICity {
    id?: string;
    geoname_id: number;

    city_name: string;
    state_name?: string;
    country_name?: string;

    latitude?: number;
    longitude?: number;

    timezone?: string;

    created_at?: Date;
    updated_at?: Date;
}

export interface IR_cities extends IBaseRepository<ICity> {
    findByCityName(cityName: string): Promise<ICity | null>;
    searchCities(search: string): Promise<ICity[]>;
}