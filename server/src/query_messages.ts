import prisma from "./config/prisma";
async function main() {
  const messages = await prisma.messages.findMany({
    orderBy: { created_at: 'desc' },
    take: 5
  });
  console.log("LAST 5 MESSAGES:", messages);
}
main().catch(console.error).finally(() => prisma.$disconnect());
