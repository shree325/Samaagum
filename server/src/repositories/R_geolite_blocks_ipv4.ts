import { PostgresBaseRepository } from './PostgresBaseRepository';

import {
    IGeoliteBlockIPv4,
    IR_geolite_blocks_ipv4
} from './IR_geolite_blocks_ipv4';

import prisma from '../config/prisma';

export class R_geolite_blocks_ipv4
    extends PostgresBaseRepository<IGeoliteBlockIPv4>
    implements IR_geolite_blocks_ipv4 {

    constructor() {
        super('geolite2_blocks_ipv4', 'network');
    }

    async findByGeonameId(
        geonameId: number
    ): Promise<IGeoliteBlockIPv4[]> {

        return prisma.$queryRawUnsafe<
            IGeoliteBlockIPv4[]
        >(
            `
            SELECT *
            FROM geolite2_blocks_ipv4
            WHERE geoname_id = $1
            `,
            geonameId
        );
    }

    async findByNetwork(
        network: string
    ): Promise<IGeoliteBlockIPv4 | null> {

        const rows =
            await prisma.$queryRawUnsafe<
                IGeoliteBlockIPv4[]
            >(
                `
                SELECT *
                FROM geolite2_blocks_ipv4
                WHERE network = $1
                LIMIT 1
                `,
                network
            );

        return rows[0] || null;
    }
}