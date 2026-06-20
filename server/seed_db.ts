import prisma from './src/config/prisma';

async function main() {
  try {
    const inserted = await prisma.$executeRawUnsafe(`
      INSERT INTO city_controls (geoname_id, city_name, state_name, country_name, is_active) 
      SELECT geoname_id, city_name, subdivision_1_name, country_name, true 
      FROM geolite2_locations 
      WHERE locale_code = 'en' AND city_name IS NOT NULL 
      ON CONFLICT DO NOTHING;
    `);
    console.log('Inserted Cities:', inserted);

    const total = await prisma.$queryRawUnsafe<{count: number}[]>('SELECT COUNT(*)::int as count FROM city_controls;');
    const active = await prisma.$queryRawUnsafe<{count: number}[]>('SELECT COUNT(*)::int as count FROM city_controls WHERE is_active = true;');
    const countries = await prisma.$queryRawUnsafe<{count: number}[]>('SELECT COUNT(DISTINCT country_name)::int as count FROM city_controls;');
    
    console.log('TOTAL:', total[0].count);
    console.log('ACTIVE:', active[0].count);
    console.log('COUNTRIES:', countries[0].count);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
