import prisma from '../config/prisma';

async function run() {
  const users = await prisma.users.findMany({
    select: {
      id: true,
      primary_email: true,
      first_name: true,
      last_name: true,
      admin_roles: {
        select: {
          name: true
        }
      }
    }
  });
  console.log("USERS:", JSON.stringify(users, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
