import prisma from '../config/prisma';

async function run() {
  console.log("Fetching latest subscription orders...");
  const orders = await prisma.subscription_orders.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    include: {
      admin_subscription_plans: true,
      users: true
    }
  });

  console.log("LATEST ORDERS:");
  for (const o of orders) {
    console.log(`Order: ${o.order_number}, ID: ${o.id}, Status: ${o.status}, SubStatus: ${o.subscription_status}, Total: ${o.total}, Plan: ${o.admin_subscription_plans?.name}, User: ${o.users?.primary_email}`);
  }

  console.log("\nFetching latest notification logs...");
  const logs = await prisma.notification_log.findMany({
    orderBy: { created_at: 'desc' },
    take: 10
  });

  console.log("LATEST NOTIFICATION LOGS:");
  for (const l of logs) {
    console.log(`Log ID: ${l.id}, User ID: ${l.user_id}, Key: ${l.template_key}, Status: ${l.status}, CreatedAt: ${l.created_at}`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
