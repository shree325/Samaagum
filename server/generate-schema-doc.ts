import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Lucent',
    database: process.env.DB_NAME || 'samaagum',
  });

  try {
    await client.connect();
    
    // Query tables and columns
    const query = `
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;
    
    const res = await client.query(query);
    
    // Group columns by table
    const tables: Record<string, any[]> = {};
    for (const row of res.rows) {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push(row);
    }
    
    // Generate markdown content
    let md = `# Database Schema Reference\n\n`;
    md += `This document lists all **${Object.keys(tables).length} tables** currently created in the PostgreSQL database \`${client.database}\` on port \`${client.port}\`.\n\n`;
    
    for (const tableName of Object.keys(tables).sort()) {
      md += `## ${tableName}\n\n`;
      md += `| Column | Data Type | Nullable | Default |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      for (const col of tables[tableName]) {
        const def = col.column_default ? `\`${col.column_default}\`` : '-';
        md += `| **${col.column_name}** | \`${col.data_type}\` | ${col.is_nullable} | ${def} |\n`;
      }
      md += `\n`;
    }
    
    const artifactPath = 'C:/Users/Prathmesh/.gemini/antigravity-ide/brain/53a8f1c9-bca2-4fab-8faa-06e92481e552/database_schema_reference.md';
    fs.writeFileSync(artifactPath, md, 'utf8');
    console.log(`✅ Schema reference written to ${artifactPath}`);
  } catch (err: any) {
    console.error('❌ Failed to generate schema reference:', err.message);
  } finally {
    await client.end();
  }
}

main();
