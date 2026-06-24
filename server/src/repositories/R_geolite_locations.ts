import { PostgresBaseRepository } from './PostgresBaseRepository';
import {
    IGeoliteLocation,
    IR_geolite_locations
} from './IR_geolite_locations';

import prisma from '../config/prisma';

export class R_geolite_locations
    extends PostgresBaseRepository<IGeoliteLocation>
    implements IR_geolite_locations {

    constructor() {
        super('geolite_locations', 'geoname_id');
    }

    async findByGeonameId(
        geonameId: number
    ): Promise<IGeoliteLocation | null> {

        const rows =
            await prisma.$queryRawUnsafe<IGeoliteLocation[]>(
                `
                SELECT *
                FROM geolite_locations
                WHERE geoname_id = $1
                LIMIT 1
                `,
                geonameId
            );

        return rows[0] || null;
    }

    async findByCityName(
        cityName: string
    ): Promise<IGeoliteLocation[]> {

        return prisma.$queryRawUnsafe<IGeoliteLocation[]>(
            `
            SELECT *
            FROM geolite_locations
            WHERE city_name = $1
            ORDER BY city_name
            `,
            cityName
        );
    }
}