import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const adminGeoRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Common preHandlers can be applied when registering this route in index.ts
  // e.g. { preHandler: [fastify.authenticate, fastify.requireAdmin] }

  const LOCATIONS_COLS = ['geoname_id', 'locale_code', 'continent_code', 'continent_name', 'country_iso_code', 'country_name', 'subdivision_1_iso_code', 'subdivision_1_name', 'subdivision_2_iso_code', 'subdivision_2_name', 'city_name', 'metro_code', 'time_zone', 'is_in_european_union'];
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

    let fromClause = '';
    let selectClause = 'base.*';
    
    if (table === 'geolite2_locations') {
      selectClause = `base.*, cc.is_active as status`;
      fromClause = `
        FROM ${table} base
        LEFT JOIN city_controls cc ON base.geoname_id = cc.geoname_id
      `;
      whereClause = whereClause.replace(/loc\./g, 'base.');
      whereClause += ` AND base.locale_code = 'en'`;
    } else {
      selectClause = `base.*, loc.country_name, loc.subdivision_1_name as state_name, cc.is_active as status`;
      fromClause = `
        FROM ${table} base
        LEFT JOIN geolite2_locations loc ON base.geoname_id = loc.geoname_id AND loc.locale_code = 'en'
        LEFT JOIN city_controls cc ON base.geoname_id = cc.geoname_id
      `;
    }

    let orderClause = '';
    if (sortBy) {
      orderClause = `ORDER BY base.${sortBy} ${sortOrder}`;
    }

    const dataQuery = `SELECT ${selectClause} ${fromClause} ${whereClause} ${orderClause} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    const dataParams = [...queryParams, limit, offset];
    
    console.log('[DEBUG fetchPaginated] QUERY:', dataQuery);
    console.log('[DEBUG fetchPaginated] PARAMS:', dataParams);

    const countQuery = `
      SELECT COUNT(*) AS total 
      ${fromClause}
      ${whereClause}
    `;

    const client = await pool.connect();
    try {
      const [dataResult, countResult] = await Promise.all([
        client.query(dataQuery, [...queryParams, limit, offset]),
        client.query(countQuery, queryParams)
      ]);
      const total = parseInt(countResult.rows[0].total, 10);

      return {
        data: dataResult.rows,
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

  fastify.get('/geo/locations', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request, reply) => {
    try {
      const result = await fetchPaginated(
        'geolite2_locations',
        ['geoname_id', 'city_name', 'country_name', 'subdivision_1_name'],
        request.query
      );
      reply.send(result);
    } catch (err) {
      request.log.error(err);
      reply.status(500).send({ error: 'Failed to fetch locations' });
    }
  });

  // Filter options from the actual geolite2_locations table
  fastify.get('/geo/filters', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const country = request.query.country as string || '';
      const client = await pool.connect();
      try {
        const countriesResult = await client.query(
          `SELECT DISTINCT country_name FROM geolite2_locations WHERE locale_code = 'en' AND country_name IS NOT NULL ORDER BY country_name ASC`
        );
        let statesResult = { rows: [] as any[] };
        if (country) {
          statesResult = await client.query(
            `SELECT DISTINCT subdivision_1_name FROM geolite2_locations WHERE locale_code = 'en' AND country_name = $1 AND subdivision_1_name IS NOT NULL ORDER BY subdivision_1_name ASC`,
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

  fastify.get('/geo/locations/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const result = await pool.query('SELECT * FROM geolite2_locations WHERE geoname_id = $1', [request.params.id]);
      if (result.rows.length === 0) return reply.status(404).send({ error: 'Not found' });
      reply.send(result.rows[0]);
    } catch (err) {
      reply.status(500).send({ error: 'Failed to fetch' });
    }
  });

  fastify.post('/geo/locations', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const filteredBody = filterBody(request.body, LOCATIONS_COLS);
      const keys = Object.keys(filteredBody);
      const values = Object.values(filteredBody);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      await pool.query(`INSERT INTO geolite2_locations (${keys.join(', ')}) VALUES (${placeholders})`, values);
      reply.send({ success: true });
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  fastify.put('/geo/locations/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const filteredBody = filterBody(request.body, LOCATIONS_COLS);
      const keys = Object.keys(filteredBody);
      const values = Object.values(filteredBody);
      const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
      await pool.query(`UPDATE geolite2_locations SET ${setClause} WHERE geoname_id = $1`, [request.params.id, ...values]);
      reply.send({ success: true });
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  fastify.delete('/geo/locations/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      await pool.query('DELETE FROM geolite2_locations WHERE geoname_id = $1', [request.params.id]);
      reply.send({ success: true });
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  fastify.get('/geo/ipv4', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request, reply) => {
    try {
      const result = await fetchPaginated(
        'geolite2_ipv4_blocks',
        ['network', 'geoname_id'],
        request.query
      );
      reply.send(result);
    } catch (err) {
      request.log.error(err);
      reply.status(500).send({ error: 'Failed to fetch IPv4 blocks' });
    }
  });

  fastify.get('/geo/ipv4/detail', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const result = await pool.query('SELECT * FROM geolite2_ipv4_blocks WHERE network = $1', [request.query.network]);
      if (result.rows.length === 0) return reply.status(404).send({ error: 'Not found' });
      reply.send(result.rows[0]);
    } catch (err) {
      reply.status(500).send({ error: 'Failed to fetch' });
    }
  });

  fastify.post('/geo/ipv4', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const filteredBody = filterBody(request.body, IP_COLS);
      const keys = Object.keys(filteredBody);
      const values = Object.values(filteredBody);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      await pool.query(`INSERT INTO geolite2_ipv4_blocks (${keys.join(', ')}) VALUES (${placeholders})`, values);
      reply.send({ success: true });
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  fastify.put('/geo/ipv4/update', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const filteredBody = filterBody(request.body, IP_COLS);
      const keys = Object.keys(filteredBody);
      const values = Object.values(filteredBody);
      const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
      await pool.query(`UPDATE geolite2_ipv4_blocks SET ${setClause} WHERE network = $1`, [request.query.network, ...values]);
      reply.send({ success: true });
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  fastify.delete('/geo/ipv4', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      await pool.query('DELETE FROM geolite2_ipv4_blocks WHERE network = $1', [request.query.network]);
      reply.send({ success: true });
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  fastify.get('/geo/ipv6', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request, reply) => {
    try {
      const result = await fetchPaginated(
        'geolite2_ipv6_blocks',
        ['network', 'geoname_id'],
        request.query
      );
      reply.send(result);
    } catch (err) {
      request.log.error(err);
      reply.status(500).send({ error: 'Failed to fetch IPv6 blocks' });
    }
  });

  fastify.get('/geo/ipv6/detail', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const result = await pool.query('SELECT * FROM geolite2_ipv6_blocks WHERE network = $1', [request.query.network]);
      if (result.rows.length === 0) return reply.status(404).send({ error: 'Not found' });
      reply.send(result.rows[0]);
    } catch (err) {
      reply.status(500).send({ error: 'Failed to fetch' });
    }
  });

  fastify.post('/geo/ipv6', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const filteredBody = filterBody(request.body, IP_COLS);
      const keys = Object.keys(filteredBody);
      const values = Object.values(filteredBody);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      await pool.query(`INSERT INTO geolite2_ipv6_blocks (${keys.join(', ')}) VALUES (${placeholders})`, values);
      reply.send({ success: true });
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  fastify.put('/geo/ipv6/update', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      const filteredBody = filterBody(request.body, IP_COLS);
      const keys = Object.keys(filteredBody);
      const values = Object.values(filteredBody);
      const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
      await pool.query(`UPDATE geolite2_ipv6_blocks SET ${setClause} WHERE network = $1`, [request.query.network, ...values]);
      reply.send({ success: true });
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  fastify.delete('/geo/ipv6', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
    try {
      await pool.query('DELETE FROM geolite2_ipv6_blocks WHERE network = $1', [request.query.network]);
      reply.send({ success: true });
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });
};

export default adminGeoRoutes;
