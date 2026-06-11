import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Simple parser for provided-schema.sql
function parseProvidedSchema(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const tables: Record<string, string[]> = {};
  
  // Basic regex to find table definitions
  // Matches: CREATE TABLE name ( ... );
  const createTableRegex = /CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)\);/gi;
  let match;
  
  while ((match = createTableRegex.exec(content)) !== null) {
    const tableName = match[1].toLowerCase();
    const body = match[2];
    
    // Parse columns in body
    const lines = body.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const columns: string[] = [];
    
    for (const line of lines) {
      // Skip lines that are constraints or keys
      if (
        line.startsWith('PRIMARY KEY') || 
        line.startsWith('UNIQUE') || 
        line.startsWith('CONSTRAINT') || 
        line.startsWith('FOREIGN KEY')
      ) {
        continue;
      }
      
      // Extract the column name (first word)
      const colMatch = /^(\w+)\s+(\w+)/i.exec(line);
      if (colMatch) {
        const columnName = colMatch[1].toLowerCase();
        columns.push(columnName);
      }
    }
    
    tables[tableName] = columns;
  }
  
  return tables;
}

async function getDatabaseSchema() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Lucent',
    database: process.env.DB_NAME || 'samaagum',
  });

  const dbSchema: Record<string, string[]> = {};
  try {
    await client.connect();
    
    const query = `
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;
    
    const res = await client.query(query);
    for (const row of res.rows) {
      const tName = row.table_name.toLowerCase();
      const colName = row.column_name.toLowerCase();
      if (!dbSchema[tName]) {
        dbSchema[tName] = [];
      }
      dbSchema[tName].push(colName);
    }
  } catch (err: any) {
    console.error('❌ Failed to connect/read database schema:', err.message);
  } finally {
    await client.end();
  }
  
  return dbSchema;
}

async function main() {
  const sqlPath = path.join(__dirname, 'provided-schema.sql');
  const provided = parseProvidedSchema(sqlPath);
  const actual = await getDatabaseSchema();
  
  console.log(`\n======================================================`);
  console.log(`Schema Comparison: Provided Context vs. Actual Database`);
  console.log(`======================================================\n`);
  
  const providedTableNames = Object.keys(provided).sort();
  const actualTableNames = Object.keys(actual).sort();
  
  // 1. Missing / Extra tables
  const missingTables = providedTableNames.filter(t => !actual.hasOwnProperty(t));
  const extraTables = actualTableNames.filter(t => !provided.hasOwnProperty(t));
  
  if (missingTables.length > 0) {
    console.log(`❌ Missing Tables (Defined in provided SQL but not in DB):`);
    console.log(missingTables.map(t => `  - ${t}`).join('\n'));
    console.log();
  } else {
    console.log(`✅ No missing tables.`);
  }

  if (extraTables.length > 0) {
    console.log(`➕ Extra Tables (Exists in DB but not in provided SQL):`);
    console.log(extraTables.map(t => `  - ${t}`).join('\n'));
    console.log();
  }
  
  // 2. Compare Columns for common tables
  const commonTables = providedTableNames.filter(t => actual.hasOwnProperty(t));
  let totalDifferences = 0;
  
  console.log(`🔍 Column Differences in Common Tables:`);
  console.log(`------------------------------------------------------`);
  
  for (const table of commonTables) {
    const provCols = provided[table];
    const actCols = actual[table];
    
    const missingCols = provCols.filter(c => !actCols.includes(c));
    const extraCols = actCols.filter(c => !provCols.includes(c));
    
    if (missingCols.length > 0 || extraCols.length > 0) {
      totalDifferences++;
      console.log(`Table: "${table}"`);
      if (missingCols.length > 0) {
        console.log(`  ❌ Missing Columns (in context but NOT in DB): ${missingCols.join(', ')}`);
      }
      if (extraCols.length > 0) {
        console.log(`  ➕ Extra Columns (in DB but NOT in context): ${extraCols.join(', ')}`);
      }
      console.log();
    }
  }
  
  if (totalDifferences === 0) {
    console.log(`✅ All common tables have matching column structures!`);
  }
  
  console.log(`\n======================================================`);
}

main();
