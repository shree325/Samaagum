import prisma from "./config/prisma";

async function main() {
  const conversationId = "73f59348-c597-40cc-9120-951358cc64e9";
  const messages = await prisma.messages.findMany({
    where: { conversation_id: conversationId },
    orderBy: { created_at: "asc" },
  });
  console.log("Query returned:", JSON.stringify(messages, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
