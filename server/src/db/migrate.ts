import fs from 'fs';
import path from 'path';
import pool from '../config/database';

// Helper to log with timestamps
const log = (message: string) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

const errorLog = (message: string, error?: any) => {
  console.error(`[${new Date().toISOString()}] ❌ ${message}`, error || '');
};

async function ensureMigrationsTable() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(queryText);
}

async function getExecutedMigrations(): Promise<string[]> {
  const result = await pool.query('SELECT name FROM migrations ORDER BY id ASC');
  return result.rows.map(row => row.name);
}

async function runMigrations() {
  try {
    await ensureMigrationsTable();
    
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      errorLog(`Migrations directory not found at: ${migrationsDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort alphabetically to guarantee sequence: 000, 001, 002...

    const executed = await getExecutedMigrations();
    const executedSet = new Set(executed);

    const isStatusCheck = process.argv.includes('status');

    if (isStatusCheck) {
      log('--- Migration Status Report ---');
      for (const file of files) {
        if (executedSet.has(file)) {
          console.log(`  [Executed]  ${file}`);
        } else {
          console.log(`  [Pending]   ${file}`);
        }
      }
      log('-------------------------------');
      return;
    }

    const pendingFiles = files.filter(file => !executedSet.has(file));

    if (pendingFiles.length === 0) {
      log('✅ No pending migrations. Database is up to date.');
      return;
    }

    log(`Found ${pendingFiles.length} pending migration(s) to run.`);

    for (const file of pendingFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      log(`Running migration: ${file}...`);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Execute the migration SQL content
        await client.query(sql);

        // Record the migration in the migrations table
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);

        await client.query('COMMIT');
        log(`✅ Successfully executed: ${file}`);
      } catch (err: any) {
        await client.query('ROLLBACK');
        errorLog(`Failed running migration ${file}. Transaction rolled back.`, err.message);
        throw err;
      } finally {
        client.release();
      }
    }

    log('🎉 All pending migrations completed successfully.');
  } catch (err: any) {
    errorLog('Migration runner failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
