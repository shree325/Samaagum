import pool from '../config/database';
import { IBaseRepository } from './IBaseRepository';

export class PostgresBaseRepository<T> implements IBaseRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async getById(id: string | number): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  async findOne(filter: object): Promise<T | null> {
    const keys = Object.keys(filter);
    const values = Object.values(filter);
    if (keys.length === 0) return null;

    const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    const query = `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`;
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  async findAll(filter?: object): Promise<T[]> {
    if (!filter || Object.keys(filter).length === 0) {
      const query = `SELECT * FROM ${this.tableName}`;
      const { rows } = await pool.query(query);
      return rows;
    }
    const keys = Object.keys(filter);
    const values = Object.values(filter);
    const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    const query = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;
    const { rows } = await pool.query(query, values);
    return rows;
  }

  async create(data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    if (keys.length === 0) {
      throw new Error('Cannot insert empty object');
    }
    const columns = keys.join(', ');
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    const query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async update(id: string | number, data: Partial<T>): Promise<T | null> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    if (keys.length === 0) return this.getById(id);

    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
    const { rows } = await pool.query(query, [...values, id]);
    return rows[0] || null;
  }

  async delete(id: string | number): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
