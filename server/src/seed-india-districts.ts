import prisma from './config/prisma';
import fs from 'fs';
import path from 'path';

async function seed() {
  const geojsonPath = path.join(__dirname, '../../client/public/india_district_simplified.geojson');
  console.log(`Reading GeoJSON boundary data from ${geojsonPath}...`);
  
  if (!fs.existsSync(geojsonPath)) {
    throw new Error(`GeoJSON source file not found at ${geojsonPath}`);
  }
  
  const rawData = fs.readFileSync(geojsonPath, 'utf8');
  const geojsonData = JSON.parse(rawData);

  console.log(`Saving GeoJSON data to platform_settings under key 'india_districts_geojson'...`);

  // We find or create the setting
  const existing = await prisma.platform_settings.findFirst({
    where: { key: 'india_districts_geojson' }
  });

  if (existing) {
    await prisma.platform_settings.update({
      where: { id: existing.id },
      data: {
        value: geojsonData,
        updated_at: new Date()
      }
    });
  } else {
    await prisma.platform_settings.create({
      data: {
        key: 'india_districts_geojson',
        value: geojsonData,
        updated_at: new Date()
      }
    });
  }

  console.log("✅ Seeded India Districts GeoJSON successfully!");
}

seed().catch(console.error).finally(() => prisma.$disconnect());
