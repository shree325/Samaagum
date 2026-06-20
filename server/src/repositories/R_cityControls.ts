// ─── R_cityControls ───────────────────────────────────────────────────
// Raw SQL repository — does NOT extend PostgresBaseRepository
// GeoLite-related tables are not Prisma models (CIDR/GIST incompatible)

import prisma from '../config/prisma';
import { ICityControl, ICityControlListOptions, ICityControlListResult } from './ICityControl';

export class R_cityControls {

  /**
   * List cities with pagination, search, filter, and sort
   */
  async findAll(opts: ICityControlListOptions = {}): Promise<ICityControlListResult> {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(100, Math.max(1, opts.limit || 50));
    const offset = (page - 1) * limit;
    const sort = opts.sort || 'city_name';
    const order = opts.order === 'desc' ? 'DESC' : 'ASC';

    // Build WHERE clauses
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (opts.search) {
      conditions.push(`(city_name ILIKE $${paramIdx} OR state_name ILIKE $${paramIdx} OR country_name ILIKE $${paramIdx})`);
      params.push(`%${opts.search}%`);
      paramIdx++;
    }

    if (opts.status && opts.status !== 'all') {
      conditions.push(`is_active = $${paramIdx}`);
      params.push(opts.status === 'active');
      paramIdx++;
    }

    if (opts.state) {
      conditions.push(`state_name = $${paramIdx}`);
      params.push(opts.state);
      paramIdx++;
    }

    if (opts.country) {
      conditions.push(`country_name = $${paramIdx}`);
      params.push(opts.country);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countSql = `SELECT COUNT(*)::int AS total FROM city_controls ${whereClause}`;
    const countResult = await prisma.$queryRawUnsafe<{ total: number }[]>(countSql, ...params);
    const total = countResult[0]?.total || 0;

    // Fetch page
    const dataSql = `
      SELECT
          c.*
      FROM city_controls c
      ${whereClause}
      ORDER BY ${sort} ${order}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    const dataParams = [...params, limit, offset];
    const data = await prisma.$queryRawUnsafe<ICityControl[]>(dataSql, ...dataParams);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single city by geoname_id
   */
  async findByGeonameId(geonameId: number): Promise<ICityControl | null> {
    const rows = await prisma.$queryRawUnsafe<ICityControl[]>(
      'SELECT * FROM city_controls WHERE geoname_id = $1 LIMIT 1',
      geonameId
    );
    return rows[0] || null;
  }


  async findByCityName(cityName: string): Promise<ICityControl[]> {
    return await prisma.$queryRawUnsafe<ICityControl[]>(
      `
      SELECT *
      FROM city_controls
      WHERE LOWER(city_name) = LOWER($1)
      `,
      cityName
    );
  }

  /**
   * Toggle active status for a single city
   */
  async toggleActive(geonameId: number, isActive: boolean, updatedBy: string): Promise<ICityControl | null> {
    let rows = await prisma.$queryRawUnsafe<ICityControl[]>(
      `UPDATE city_controls 
       SET is_active = $1, updated_at = NOW(), updated_by = $2, modification_num = modification_num + 1
       WHERE geoname_id = $3
       RETURNING *`,
      isActive, updatedBy, geonameId
    );
    if (!rows.length) {
      rows = await prisma.$queryRawUnsafe<ICityControl[]>(
        `INSERT INTO city_controls (geoname_id, city_name, state_name, country_name, timezone, is_active, created_by, updated_by)
         SELECT l.geoname_id, COALESCE(l.city_name, 'Unknown'), l.subdivision_1_name, l.country_name, l.time_zone, $1, $2, $2
         FROM geolite2_locations l
         WHERE l.geoname_id = $3 AND l.locale_code = 'en'
         LIMIT 1
         RETURNING *`,
         isActive, updatedBy, geonameId
      );
    }
    return rows[0] || null;
  }

  /**
   * Bulk toggle by array of geoname_ids
   */
  async bulkToggle(geonameIds: number[], isActive: boolean, updatedBy: string): Promise<number> {
    if (!geonameIds.length) return 0;

    // Build parameterized IN clause
    const placeholders = geonameIds.map((_, i) => `$${i + 3}`).join(', ');
    const sql = `
      UPDATE city_controls 
      SET is_active = $1, updated_at = NOW(), updated_by = $2, modification_num = modification_num + 1
      WHERE geoname_id IN (${placeholders})
    `;
    const params = [isActive, updatedBy, ...geonameIds];

    // $executeRawUnsafe returns the number of affected rows
    const affected = await prisma.$executeRawUnsafe(sql, ...params);
    return affected;
  }

  /**
   * Toggle all cities in a given state (and optionally country)
   */
  async toggleByState(stateName: string, isActive: boolean, updatedBy: string, countryName?: string): Promise<number> {
    let sql = `
      UPDATE city_controls 
      SET is_active = $1, updated_at = NOW(), updated_by = $2, modification_num = modification_num + 1
      WHERE state_name = $3
    `;
    const params: any[] = [isActive, updatedBy, stateName];

    if (countryName) {
      sql += ` AND country_name = $4`;
      params.push(countryName);
    }

    const affected = await prisma.$executeRawUnsafe(sql, ...params);
    return affected;
  }

  /**
   * Get distinct state names for filter dropdown
   */
  async getDistinctStates(country?: string): Promise<string[]> {
    let sql = `SELECT DISTINCT state_name FROM city_controls WHERE state_name IS NOT NULL`;
    const params: any[] = [];

    if (country) {
      sql += ` AND country_name = $1`;
      params.push(country);
    }

    sql += ` ORDER BY state_name ASC`;

    const rows = await prisma.$queryRawUnsafe<{ state_name: string }[]>(sql, ...params);
    return rows.map(r => r.state_name);
  }

  /**
   * Get distinct country names for filter dropdown
   */
  async getDistinctCountries(): Promise<string[]> {
    const rows = await prisma.$queryRawUnsafe<{ country_name: string }[]>(
      `SELECT DISTINCT country_name FROM city_controls WHERE country_name IS NOT NULL ORDER BY country_name ASC`
    );
    return rows.map(r => r.country_name);
  }

  /**
   * Check if a city is active
   */
  async isCityActive(geonameId: number): Promise<boolean> {
    const rows = await prisma.$queryRawUnsafe<{ is_active: boolean }[]>(
      'SELECT is_active FROM city_controls WHERE geoname_id = $1 LIMIT 1',
      geonameId
    );
    // If city not in city_controls, default to active (allow creation)
    if (!rows.length) return true;
    return rows[0].is_active;
  }

  /**
   * Get stats for dashboard
   */
  async getStats(): Promise<{ total: number; active: number; inactive: number; countries: number; states: number }> {
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE is_active = true)::int AS active,
        COUNT(*) FILTER (WHERE is_active = false)::int AS inactive,
        COUNT(DISTINCT country_name)::int AS countries,
        COUNT(DISTINCT state_name)::int AS states
      FROM city_controls
    `);
    return rows[0] || { total: 0, active: 0, inactive: 0, countries: 0, states: 0 };
  }
}
