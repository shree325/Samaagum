import fs from 'fs';
import path from 'path';
import pool from '../config/database';

async function main() {
  const sqlPath = path.resolve(__dirname, 'seed_city_controls.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ city_controls seeded');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ seeding failed', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
