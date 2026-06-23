import { PostgresBaseRepository } from './PostgresBaseRepository';
import { ICity, IR_cities } from './IR_cities';
import prisma from '../config/prisma';

export class R_cities
    extends PostgresBaseRepository<ICity>
    implements IR_cities {

    constructor() {
        super('cities', 'id');
    }

    async findByCityName(
        cityName: string
    ): Promise<ICity | null> {

        const rows =
            await prisma.$queryRawUnsafe<ICity[]>(
                `
        SELECT *
        FROM cities
        WHERE LOWER(city_name) = LOWER($1)
        LIMIT 1
        `,
                cityName
            );

        return rows[0] || null;
    }

    async searchCities(
        search: string
    ): Promise<ICity[]> {

        return await prisma.$queryRawUnsafe<ICity[]>(
            `
      SELECT *
      FROM cities
      WHERE
        city_name ILIKE $1
        OR state_name ILIKE $1
        OR country_name ILIKE $1
      ORDER BY city_name
      LIMIT 100
      `,
            `%${search}%`
        );
    }
}