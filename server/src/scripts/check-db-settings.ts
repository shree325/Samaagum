import prisma from "../config/prisma";

async function main() {
  const row = await prisma.platform_settings.findFirst({
    where: { scope_tenant_id: null, key: 'chat_settings' }
  });
  console.log("ACTIVE CHAT SETTINGS ROW IN DB:", JSON.stringify(row, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
