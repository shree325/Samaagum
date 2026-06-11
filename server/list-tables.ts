import { Client } from 'pg';
import dotenv from 'dotenv';

// Load variables from .env file
dotenv.config();

async function listTables() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Lucent',
    database: process.env.DB_NAME || 'samaagum',
  });

  try {
    await client.connect();
    console.log(`\nConnected to PostgreSQL Database "${client.database}" on port ${client.port}.\n`);

    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    const res = await client.query(query);
    
    if (res.rows.length === 0) {
      console.log('No tables found in the database.');
    } else {
      console.log(`Found ${res.rows.length} tables in public schema:`);
      console.log('-------------------------------------------');
      const tableNames = res.rows.map(row => row.table_name);
      // Print in columns or simple list
      for (let i = 0; i < tableNames.length; i += 3) {
        const row = tableNames.slice(i, i + 3).map(name => name.padEnd(30)).join('');
        console.log(row);
      }
      console.log('-------------------------------------------');
    }
  } catch (error: any) {
    console.error('❌ Error reading tables:', error.message);
  } finally {
    await client.end();
  }
}

listTables();
