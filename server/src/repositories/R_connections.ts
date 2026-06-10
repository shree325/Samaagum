import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IConnection, IR_connections } from './IR_connections';
import pool from '../config/database';

export class R_connections extends PostgresBaseRepository<IConnection> implements IR_connections {
  constructor() {
    super('connections', 'connection_id');
  }

  async findByRequesterId(requesterId: string): Promise<IConnection[]> {
    const query = `SELECT * FROM connections WHERE requester_user_id = $1`;
    const { rows } = await pool.query(query, [requesterId]);
    return rows;
  }

  async findByAddresseeId(addresseeId: string): Promise<IConnection[]> {
    const query = `SELECT * FROM connections WHERE addressee_user_id = $1`;
    const { rows } = await pool.query(query, [addresseeId]);
    return rows;
  }
}
