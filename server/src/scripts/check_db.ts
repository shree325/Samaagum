import prisma from '../config/prisma';

async function run() {
  console.log("=== Checking specific tables ===");
  const tables = ['presences', 'messaging_requests', 'notification_log', 'messages', 'conversations'];
  for (const table of tables) {
    try {
      const res = await prisma.$queryRawUnsafe(`SELECT count(*) FROM "${table}"`);
      console.log(`✅ Table "${table}" exists:`, res);
    } catch (e: any) {
      console.error(`❌ Table "${table}" DOES NOT EXIST or is broken:`, e.message);
    }
  }

  // Let's run a test query on counts as well to see why it fails
  try {
    const userId = "5024f18b-f32c-443c-a322-99a15904678c"; // Shree
    const participations = await prisma.conversation_participants.findMany({
      where: { user_id: userId },
      select: { conversation_id: true }
    });
    console.log("Participations found:", participations);
    const conversationIds = participations.map(p => p.conversation_id);

    const unreadMessages = await prisma.messages.findMany({
      where: {
        conversation_id: { in: conversationIds },
        sender_user_id: { not: userId },
        is_deleted: false,
        OR: [
          { message_receipts: { none: { user_id: userId } } },
          { message_receipts: { some: { user_id: userId, seen_at: null } } }
        ]
      },
      select: { sender_user_id: true }
    });
    console.log("Unread messages:", unreadMessages);

    const pendingRequests = await prisma.messaging_requests.count({
      where: { receiver_id: userId, status: 'PENDING' }
    });
    console.log("Pending requests count:", pendingRequests);
  } catch (err: any) {
    console.error("❌ Test query failed:", err.message);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
