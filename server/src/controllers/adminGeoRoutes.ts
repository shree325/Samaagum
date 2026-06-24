import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const adminGeoRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Common preHandlers can be applied when registering this route in index.ts
  // e.g. { preHandler: [fastify.authenticate, fastify.requireAdmin] }

  const LOCATIONS_COLS = ['geoname_id', 'locale_code', 'continent_code', 'continent_name', 'country_iso_code', 'country_name', 'subdivision_1_iso_code', 'subdivision_1_name', 'subdivision_2_iso_code', 'subdivision_2_name', 'city_name', 'metro_code', 'time_zone', 'utc_offset', 'is_in_european_union'];
  const IP_COLS = ['network', 'geoname_id', 'registered_country_geoname_id', 'represented_country_geoname_id', 'is_anonymous_proxy', 'is_satellite_provider', 'postal_code', 'latitude', 'longitude', 'accuracy_radius', 'is_anycast'];

  const filterBody = (body: any, validCols: string[]) => {
    const filtered: any = {};
    for (const key of Object.keys(body)) {
      if (validCols.includes(key)) filtered[key] = body[key];
    }
    return filtered;
  };

  /**
   * Helper to execute a paginated search query
   */

  async function fetchPaginated(
    table: string,
    searchCols: string[],
    reqQuery: any
  ) {
    const page = parseInt(reqQuery.page as string) || 1;
    const limit = parseInt(reqQuery.limit as string) || 50;
    const offset = (page - 1) * limit;
    const search = reqQuery.search as string || '';

    const statusFilter = reqQuery.status as string || 'all';
    const countryFilter = reqQuery.country as string || '';
    const stateFilter = reqQuery.state as string || '';

    const sortBy = typeof reqQuery.sortBy === 'string' && /^[a-zA-Z0-9_]+$/.test(reqQuery.sortBy) ? reqQuery.sortBy : null;
    const sortOrder = reqQuery.sortOrder === 'desc' ? 'DESC' : 'ASC';

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    if (search && searchCols.length > 0) {
      const conditions = searchCols.map((col, idx) => `CAST(base.${col} AS TEXT) ILIKE $${idx + 1}`);
      whereClause += ` AND (${conditions.join(' OR ')})`;
      for (let i = 0; i < searchCols.length; i++) {
        queryParams.push(`%${search}%`);
      }
    }

    const needsCcJoin = statusFilter !== 'all';
    const needsLocJoin = !!countryFilter || !!stateFilter;

    if (statusFilter === 'active') {
      whereClause += ` AND cc.is_active = true`;
    } else if (statusFilter === 'inactive') {
      whereClause += ` AND (cc.is_active = false OR cc.is_active IS NULL)`;
    }

    if (countryFilter) {
      queryParams.push(countryFilter);
      whereClause += ` AND loc.country_name = $${queryParams.length}`;
    }

    if (stateFilter) {
      queryParams.push(stateFilter);
      whereClause += ` AND loc.subdivision_1_name = $${queryParams.length}`;
    }

    let dataFromClause = '';
    let countFromClause = '';
    let selectClause = 'base.*';

    if (table === 'geolite_locations') {
      selectClause = `base.*, cc.is_active as status`;

      dataFromClause = `
        FROM ${table} base
        LEFT JOIN city_controls cc ON base.geoname_id = cc.geoname_id
      `;

      countFromClause = `FROM ${table} base`;
      if (needsCcJoin) {
        countFromClause += ` LEFT JOIN city_controls cc ON base.geoname_id = cc.geoname_id`;
      }

      whereClause = whereClause.replace(/loc\./g, 'base.');
    } else {
      selectClause = `base.*, loc.country_name, loc.subdivision_1_name as state_name, cc.is_active as status`;

      dataFromClause = `
        FROM ${table} base
        LEFT JOIN geolite_locations loc ON base.geoname_id = loc.geoname_id
        LEFT JOIN city_controls cc ON base.geoname_id = cc.geoname_id
      `;

      countFromClause = `FROM ${table} base`;
      if (needsLocJoin) {
        countFromClause += ` LEFT JOIN geolite_locations loc ON base.geoname_id = loc.geoname_id`;
      }
      if (needsCcJoin) {
        countFromClause += ` LEFT JOIN city_controls cc ON base.geoname_id = cc.geoname_id`;
      }
    }

    let orderClause = '';
    if (sortBy) {
      orderClause = `ORDER BY base.${sortBy} ${sortOrder}`;
    }

    const dataQuery = `SELECT ${selectClause} ${dataFromClause} ${whereClause} ${orderClause} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    const dataParams = [...queryParams, limit, offset];

    const countQuery = `
      SELECT COUNT(*) AS total 
      ${countFromClause}
      ${whereClause}
    `;

    const client = await pool.connect();
    try {
      // Small optimization: If no filters/searches, we can use a super fast count estimate or exact count
      // but exact count without joins is already much faster.
      const [dataResult, countResult] = await Promise.all([
        client.query(dataQuery, dataParams),
        client.query(countQuery, queryParams)
      ]);
      const total = parseInt(countResult.rows[0].total, 10);
      const rows = dataResult.rows;

      // No longer calculating UTC offset dynamically; it is now pulled directly from the DB as utc_offset.

      return {
        data: rows,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } finally {
      client.release();
    }
  }


  const DATASET_MAP: Record<string, { table: string, pk: string, cols: string[], searchCols: string[] }> = {
    locations: {
      table: 'geolite_locations',
      pk: 'geoname_id',
      cols: LOCATIONS_COLS,
      searchCols: ['geoname_id', 'locale_code', 'continent_code', 'continent_name', 'country_iso_code', 'country_name', 'subdivision_1_iso_code', 'subdivision_1_name', 'subdivision_2_iso_code', 'subdivision_2_name', 'city_name', 'time_zone']
    },
    ipv4: {
      table: 'geolite_blocks_ipv4',
      pk: 'network',
      cols: IP_COLS,
      searchCols: ['network', 'geoname_id']
    },
    ipv6: {
      table: 'geolite_blocks_ipv6',
      pk: 'network',
      cols: IP_COLS,
      searchCols: ['network', 'geoname_id']
    }
  };

  fastify.get('/geo/filters', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const country = request.query.country as string || '';
      const client = await pool.connect();
      try {
        const countriesResult = await client.query(
          `SELECT DISTINCT country_name FROM geolite_locations WHERE country_name IS NOT NULL ORDER BY country_name ASC`
        );
        let statesResult = { rows: [] as any[] };
        if (country) {
          statesResult = await client.query(
            `SELECT DISTINCT subdivision_1_name FROM geolite_locations WHERE country_name = $1 AND subdivision_1_name IS NOT NULL ORDER BY subdivision_1_name ASC`,
            [country]
          );
        }
        reply.send({
          success: true,
          data: {
            countries: countriesResult.rows.map(r => r.country_name),
            states: statesResult.rows.map(r => r.subdivision_1_name)
          }
        });
      } finally {
        client.release();
      }
    } catch (err) {
      request.log.error(err);
      reply.status(500).send({ error: 'Failed to fetch filter options' });
    }
  });

  fastify.get('/geo/:dataset', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const config = DATASET_MAP[request.params.dataset];
      if (!config) return reply.status(400).send({ success: false, message: "Invalid dataset" });

      const result = await fetchPaginated(config.table, config.searchCols, request.query);
      reply.send(result);
    } catch (err) {
      request.log.error(err);
      reply.status(500).send({ error: 'Failed to fetch' });
    }
  });

  fastify.get('/geo/:dataset/export', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const dataset = request.params.dataset;
      const config = DATASET_MAP[dataset];
      if (!config) return reply.status(400).send({ success: false, message: "Invalid dataset" });

      const visibleColsStr = request.query.visibleCols as string;
      let visibleCols = visibleColsStr ? visibleColsStr.split(',') : null;

      reply.header('Content-Type', 'text/csv');
      const filename = `geolite_${dataset}_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.csv`;
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);

      const stream = Readable.from((async function* () {
        let page = 1;
        const limit = 5000;
        let isFirst = true;

        while (true) {
          const result = await fetchPaginated(config.table, config.searchCols, { ...request.query, page, limit });
          const rows = result.data;
          
          if (rows.length === 0) break;

          if (isFirst) {
            let headers = visibleCols || Object.keys(rows[0]);
            if (visibleCols && headers.includes('time_zone') && !headers.includes('utc_offset')) {
              headers = [...headers, 'utc_offset'];
            }
            // Prepend UTF-8 BOM (\uFEFF) so Excel reads international characters correctly
            yield '\uFEFF' + headers.map(h => `"${h}"`).join(',') + '\n';
            isFirst = false;
          }

          const chunk = rows.map((row: any) => {
            let keys = visibleCols || Object.keys(row);
            if (visibleCols && keys.includes('time_zone') && !keys.includes('utc_offset')) {
              keys = [...keys, 'utc_offset'];
            }
            return keys.map(k => {
              let v = row[k];
              if (v === null || v === undefined) return '';
              let str = String(v);
              if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            }).join(',');
          }).join('\n') + '\n';

          yield chunk;

          if (rows.length < limit) break;
          page++;
        }
      })());

      return reply.send(stream);
    } catch (err) {
      request.log.error(err);
      reply.status(500).send({ error: 'Failed to export' });
    }
  });

  fastify.get('/geo/:dataset/detail', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const config = DATASET_MAP[request.params.dataset];
      if (!config) return reply.status(400).send({ success: false, message: "Invalid dataset" });

      const result = await pool.query(`SELECT * FROM ${config.table} WHERE ${config.pk} = $1`, [request.query.id]);
      if (result.rows.length === 0) return reply.status(404).send({ error: 'Not found' });
      reply.send(result.rows[0]);
    } catch (err) {
      reply.status(500).send({ error: 'Failed to fetch detail' });
    }
  });

  fastify.post('/geo/:dataset', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const config = DATASET_MAP[request.params.dataset];
      if (!config) return reply.status(400).send({ success: false, message: "Invalid dataset" });

      if (request.body.time_zone) {
        try {
          const formatter = new Intl.DateTimeFormat('en-US', { timeZone: request.body.time_zone, timeZoneName: 'longOffset' });
          const str = formatter.format(new Date());
          const match = str.match(/GMT([+-]\d{2}:\d{2})/);
          request.body.utc_offset = match ? `UTC${match[1]}` : (str.includes('GMT') ? 'UTC+00:00' : null);
        } catch(e) {}
      }
      const filteredBody = filterBody(request.body, config.cols);
      const keys = Object.keys(filteredBody);
      const values = Object.values(filteredBody);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      await pool.query(`INSERT INTO ${config.table} (${keys.join(', ')}) VALUES (${placeholders})`, values);
      reply.send({ success: true });
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  fastify.put('/geo/:dataset', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const config = DATASET_MAP[request.params.dataset];
      if (!config) return reply.status(400).send({ success: false, message: "Invalid dataset" });

      if (request.body.time_zone) {
        try {
          const formatter = new Intl.DateTimeFormat('en-US', { timeZone: request.body.time_zone, timeZoneName: 'longOffset' });
          const str = formatter.format(new Date());
          const match = str.match(/GMT([+-]\d{2}:\d{2})/);
          request.body.utc_offset = match ? `UTC${match[1]}` : (str.includes('GMT') ? 'UTC+00:00' : null);
        } catch(e) {}
      }
      const filteredBody = filterBody(request.body, config.cols);
      const keys = Object.keys(filteredBody);
      const values = Object.values(filteredBody);
      const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
      await pool.query(`UPDATE ${config.table} SET ${setClause} WHERE ${config.pk} = $1`, [request.query.id, ...values]);
      reply.send({ success: true });
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  fastify.delete('/geo/:dataset', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const config = DATASET_MAP[request.params.dataset];
      if (!config) return reply.status(400).send({ success: false, message: "Invalid dataset" });

      await pool.query(`DELETE FROM ${config.table} WHERE ${config.pk} = $1`, [request.query.id]);
      reply.send({ success: true });
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });
};

export default adminGeoRoutes;
