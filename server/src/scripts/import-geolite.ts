import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { from as copyFrom } from 'pg-copy-streams';
import { pipeline } from 'stream/promises';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let REPO_ROOT = process.cwd();
if (!fs.existsSync(path.join(REPO_ROOT, 'GeoLite2-City-CSV_20260616', 'GeoLite2-City-CSV_20260616', 'GeoLite2-City-Locations-en.csv'))) {
  REPO_ROOT = path.resolve(process.cwd(), '../');
}

const LOCATIONS_CSV = path.join(REPO_ROOT, 'GeoLite2-City-CSV_20260616', 'GeoLite2-City-CSV_20260616', 'GeoLite2-City-Locations-en.csv');
const IPV4_CSV = path.join(REPO_ROOT, 'GeoLite2-City-CSV_20260616', 'GeoLite2-City-CSV_20260616', 'GeoLite2-City-Blocks-IPv4.csv');
const IPV6_CSV = path.join(REPO_ROOT, 'GeoLite2-City-CSV_20260616', 'GeoLite2-City-CSV_20260616', 'GeoLite2-City-Blocks-IPv6.csv');

function validateFiles() {
  const files = [
    { name: 'Locations', path: LOCATIONS_CSV },
    { name: 'IPv4 Blocks', path: IPV4_CSV },
    { name: 'IPv6 Blocks', path: IPV6_CSV }
  ];
  let missing = false;
  for (const f of files) {
    if (!fs.existsSync(f.path)) {
      console.error(`❌ Missing file: ${f.path}`);
      missing = true;
    }
  }
  if (missing) {
    console.error('Startup validation failed: One or more GeoLite CSV files are missing in the repository root.');
    process.exit(1);
  }
  console.log('✅ All GeoLite CSV files found.');
}

async function getCSVHeader(filePath: string): Promise<string> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  for await (const line of rl) {
    rl.close();
    fileStream.destroy();
    return line.trim();
  }
  throw new Error(`CSV file ${filePath} is empty`);
}

async function importCSV(filePath: string, tableName: string) {
  const startTime = Date.now();
  console.log(`Starting fast COPY import for ${tableName} from ${filePath}...`);
  const client = await pool.connect();
  try {
    const columns = await getCSVHeader(filePath);

    // Option A: Truncate table before import to ensure idempotency and avoid primary key conflicts
    await client.query(`TRUNCATE TABLE ${tableName} CASCADE`);
    console.log(`Cleared existing data in ${tableName}.`);

    const stream = client.query(copyFrom(`COPY ${tableName} (${columns}) FROM STDIN WITH (FORMAT csv, HEADER true)`));
    const fileStream = fs.createReadStream(filePath);
    await pipeline(fileStream, stream);

    const countRes = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const rowCount = countRes.rows[0].count;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Completed import for ${tableName} in ${duration}s. Verified rows: ${rowCount}`);
    return rowCount;
  } finally {
    client.release();
  }
}

async function populateCityControls() {
  console.log('Populating city_controls from imported data...');
  const result = await pool.query(`
    INSERT INTO city_controls (
      geoname_id, 
      city_name, 
      state_name, 
      country_name, 
      timezone,
      latitude,
      longitude,
      created_by
    )
    SELECT DISTINCT ON (l.geoname_id)
      l.geoname_id,
      l.city_name,
      l.subdivision_1_name,
      l.country_name,
      l.time_zone,
      b.latitude,
      b.longitude,
      'system-seed'
    FROM geolite_locations l
    LEFT JOIN LATERAL (
      SELECT latitude, longitude 
      FROM geolite_blocks_ipv4 
      WHERE geoname_id = l.geoname_id 
        AND latitude IS NOT NULL 
      LIMIT 1
    ) b ON true
    WHERE l.city_name IS NOT NULL
      AND l.geoname_id IS NOT NULL
    ORDER BY l.geoname_id
    ON CONFLICT (geoname_id) DO UPDATE SET
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      timezone = EXCLUDED.timezone,
      city_name = EXCLUDED.city_name,
      state_name = EXCLUDED.state_name,
      country_name = EXCLUDED.country_name;
  `);
  console.log(`Successfully seeded/updated city_controls. Affected rows: ${result.rowCount}`);
  return result.rowCount;
}

async function main() {
  try {
    validateFiles();

    // Import Locations
    const locCount = await importCSV(LOCATIONS_CSV, 'geolite_locations');

    // Import IPv4 Blocks
    const ipv4Count = await importCSV(IPV4_CSV, 'geolite_blocks_ipv4');

    // Import IPv6 Blocks
    const ipv6Count = await importCSV(IPV6_CSV, 'geolite_blocks_ipv6');

    // Create indexes to optimize the populating query
    console.log('Creating index on geolite_blocks_ipv4(geoname_id)...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_geolite_blocks_ipv4_geoname_id ON geolite_blocks_ipv4(geoname_id)');
    console.log('Creating index on geolite_blocks_ipv6(geoname_id)...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_geolite_blocks_ipv6_geoname_id ON geolite_blocks_ipv6(geoname_id)');

    // Populate the application city_controls
    const cityControlsCount = await populateCityControls();

    console.log('\\n=========================================');
    console.log('📊 FINAL IMPORT SUMMARY');
    console.log('=========================================');
    console.log(`- geolite_locations:   ${locCount} rows`);
    console.log(`- geolite_blocks_ipv4: ${ipv4Count} rows`);
    console.log(`- geolite_blocks_ipv6: ${ipv6Count} rows`);
    console.log(`- city_controls:        ${cityControlsCount} rows updated/inserted`);
    console.log('=========================================\\n');

    console.log('🎉 Full GeoLite import process completed successfully.');
  } catch (err) {
    console.error('❌ Failed during import:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
