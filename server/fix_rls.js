const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
    const c = new Client({ connectionString: 'postgresql://postgres:0000@localhost:5432/samaagum' });
    await c.connect();
    
    const { rows } = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' EXCEPT SELECT table_name FROM information_schema.columns WHERE column_name = 'tenant_id' AND table_schema = 'public'");
    const noTenantIdTables = rows.map(r => r.table_name);
    console.log("Tables without tenant_id:", noTenantIdTables);

    const rlsFile = path.join(__dirname, 'src/db/migrations/902_rls_policies.sql');
    let content = fs.readFileSync(rlsFile, 'utf8');

    for (const t of noTenantIdTables) {
        content = content.replace(new RegExp(`'${t}',?`, 'g'), '');
    }
    
    // Cleanup any empty quotes or commas that might be left
    content = content.replace(/,,/g, ',');
    content = content.replace(/,\s*]/g, ']');
    content = content.replace(/\[\s*,/g, '[');

    fs.writeFileSync(rlsFile, content);
    console.log("Updated 902_rls_policies.sql");
    await c.end();
}

main().catch(console.error);
