import fs from 'fs';
import readline from 'readline';
import path from 'path';

const basePath = path.join(__dirname, '../../GeoLite2-City-CSV_20260616/GeoLite2-City-CSV_20260616');
const blocksFile = path.join(basePath, 'GeoLite2-City-Blocks-IPv4.csv');
const locationsFile = path.join(basePath, 'GeoLite2-City-Locations-en.csv');
const outputFile = path.join(__dirname, '../src/data/cities.json');

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function processData() {
  console.log('Processing blocks to extract coordinates...');
  
  const coordinates = new Map<string, { lat: number, lng: number }>();
  
  const blocksStream = fs.createReadStream(blocksFile, 'utf8');
  const blocksReader = readline.createInterface({ input: blocksStream, crlfDelay: Infinity });
  
  let isFirstLine = true;
  let geonameIdIndex = 1;
  let latIndex = 7;
  let lngIndex = 8;

  for await (const line of blocksReader) {
    if (isFirstLine) {
      const headers = parseCsvLine(line);
      geonameIdIndex = headers.indexOf('geoname_id');
      latIndex = headers.indexOf('latitude');
      lngIndex = headers.indexOf('longitude');
      isFirstLine = false;
      continue;
    }
    
    const parts = parseCsvLine(line);
    const geonameId = parts[geonameIdIndex];
    if (geonameId && !coordinates.has(geonameId)) {
      const lat = parseFloat(parts[latIndex]);
      const lng = parseFloat(parts[lngIndex]);
      if (!isNaN(lat) && !isNaN(lng)) {
        coordinates.set(geonameId, { lat, lng });
      }
    }
  }

  console.log(`Found coordinates for ${coordinates.size} geoname_ids. Processing locations...`);
  
  const cities: Array<{ id: string, name: string, lat: number, lng: number, address: string }> = [];
  
  const locStream = fs.createReadStream(locationsFile, 'utf8');
  const locReader = readline.createInterface({ input: locStream, crlfDelay: Infinity });
  
  isFirstLine = true;
  let idIdx = 0;
  let cityIdx = 10;
  let countryIdx = 5;
  let stateIdx = 7;

  for await (const line of locReader) {
    if (isFirstLine) {
      const headers = parseCsvLine(line);
      idIdx = headers.indexOf('geoname_id');
      cityIdx = headers.indexOf('city_name');
      countryIdx = headers.indexOf('country_name');
      stateIdx = headers.indexOf('subdivision_1_name');
      isFirstLine = false;
      continue;
    }
    
    const parts = parseCsvLine(line);
    const id = parts[idIdx];
    const cityName = parts[cityIdx];
    
    if (cityName && id) {
      const coords = coordinates.get(id);
      if (coords) {
        const country = parts[countryIdx] || '';
        const state = parts[stateIdx] || '';
        
        let addressParts = [cityName];
        if (state) addressParts.push(state);
        if (country) addressParts.push(country);
        
        cities.push({
          id,
          name: cityName,
          lat: coords.lat,
          lng: coords.lng,
          address: addressParts.join(', ')
        });
      }
    }
  }

  console.log(`Processed ${cities.length} cities. Saving to JSON...`);
  
  const dataDir = path.join(__dirname, '../src/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(outputFile, JSON.stringify(cities));
  console.log('Done! Generated cities.json.');
}

processData().catch(console.error);
