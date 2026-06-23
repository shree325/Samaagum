import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    console.log('Fetching unique timezones...');
    const res = await pool.query('SELECT DISTINCT time_zone FROM geolite_locations WHERE time_zone IS NOT NULL');
    const timezones = res.rows.map(row => row.time_zone);
    console.log(`Found ${timezones.length} unique timezones.`);

    const date = new Date();
    let updatedCount = 0;

    for (const tz of timezones) {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' });
        const str = formatter.format(date);
        let utcOffset = '';
        const match = str.match(/GMT([+-]\d{2}:\d{2})/);
        if (match) {
          utcOffset = `UTC${match[1]}`;
        } else if (str.includes('GMT')) {
          utcOffset = 'UTC+00:00';
        }

        if (utcOffset) {
          const updateRes = await pool.query('UPDATE geolite_locations SET utc_offset = $1 WHERE time_zone = $2', [utcOffset, tz]);
          updatedCount += updateRes.rowCount || 0;
        }
      } catch (e: any) {
        console.error(`Failed to calculate offset for ${tz}:`, e.message);
      }
    }
    console.log(`Successfully updated ${updatedCount} records with utc_offset.`);
  } catch (err) {
    console.error('Error during backfill:', err);
  } finally {
    await pool.end();
  }
}

run();
