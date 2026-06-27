import prisma from '../config/prisma';

async function run() {
  const targetUserId = '057ca5af-05ba-449f-9537-6bd4a6e7b915';
  console.log(`Searching for user ID: ${targetUserId}`);

  // Query database to find all foreign keys referencing table 'users' on column 'id'
  const fkRelations: any = await prisma.$queryRaw`
    SELECT DISTINCT
        tc.table_name, 
        kcu.column_name
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND ccu.table_name = 'users'
      AND ccu.column_name = 'id'
  `;

  for (const rel of fkRelations) {
    const tableName = rel.table_name;
    const columnName = rel.column_name;
    try {
      const result: any = await prisma.$queryRawUnsafe(
        `SELECT count(*) as count FROM "${tableName}" WHERE "${columnName}" = $1`,
        targetUserId
      );
      const count = Number(result[0].count);
      if (count > 0) {
        console.log(`FOUND: Table "${tableName}" Column "${columnName}" has ${count} records`);
      }
    } catch (e: any) {
      // Ignore errors
    }
  }

  // Check if user exists in the users table
  const userCount: any = await prisma.$queryRaw`SELECT count(*) as count FROM "users" WHERE "id" = ${targetUserId}`;
  console.log(`User exists in "users" table: ${Number(userCount[0].count) > 0}`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
