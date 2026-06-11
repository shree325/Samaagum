import pool from '../config/database';

async function resetDatabase() {
  console.log('Resetting database...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT ALL ON SCHEMA public TO public');
    await client.query('COMMIT');
    console.log('✅ Database reset successfully.');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to reset database:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase();
