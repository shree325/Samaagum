import dotenv from "dotenv";
import prisma from "./config/prisma";

dotenv.config();

const { io } = require("socket.io-client");

const API_BASE = `http://localhost:${process.env.PORT || 3000}`;
const CHAT_URL = `${API_BASE}/chat`;
const TENANT_ID = "00000000-0000-0000-0000-000000000000";
const USERS = {
  a: "00000000-0000-0000-0000-000000003501",
  b: "00000000-0000-0000-0000-000000003502",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log("🚀 Starting Read Receipts integration tests...");

  // Setup / Clean database receipts
  await prisma.$executeRawUnsafe("DELETE FROM message_versions");
  await prisma.$executeRawUnsafe("DELETE FROM message_visibilities");
  await prisma.$executeRawUnsafe("DELETE FROM reactions");
  await prisma.$executeRawUnsafe("DELETE FROM message_receipts");
  await prisma.$executeRawUnsafe("DELETE FROM messages");
  await prisma.$executeRawUnsafe("DELETE FROM conversation_participants");
  await prisma.$executeRawUnsafe("DELETE FROM conversations");

  // Create a conversation between user A and user B
  const conversation = await prisma.conversations.create({
    data: {
      tenant_id: TENANT_ID,
      type: "dm",
      conversation_participants: {
        createMany: {
          data: [
            { user_id: USERS.a, role: "member" },
            { user_id: USERS.b, role: "member" },
          ],
        },
      },
    },
  });

  console.log(`Created test DM conversation: ${conversation.id}`);

  // 1. Live double-delivery/seen test (both online)
  const clientA = io(CHAT_URL, { auth: { token: USERS.a }, transports: ["websocket"] });
  const clientB = io(CHAT_URL, { auth: { token: USERS.b }, transports: ["websocket"] });

  await new Promise((resolve) => clientA.on("connect", resolve));
  await new Promise((resolve) => clientB.on("connect", resolve));
  console.log("Sockets connected for User A and User B");

  // Join the conversation room
  await new Promise((resolve) => clientA.emit("conversation.join", { conversationId: conversation.id }, resolve));
  await new Promise((resolve) => clientB.emit("conversation.join", { conversationId: conversation.id }, resolve));
  console.log("Joined conversation room");

  // Hook event listener on A to watch for receipt updates
  let receiptUpdatesA: any[] = [];
  clientA.on("receipt.updated", (data: any) => {
    console.log("User A received receipt.updated:", data);
    receiptUpdatesA.push(...data);
  });

  // User A sends a message
  const msg1Payload: any = await new Promise((resolve) => {
    clientA.emit("message.send", { conversationId: conversation.id, content: "Hello B!" }, (ack: any) => {
      console.log("message.send ack:", ack);
      resolve(ack ? ack.data : null);
    });
  });

  console.log("Message sent from A:", msg1Payload.id);

  // Since B is online, the message should immediately be delivered
  await sleep(500);
  const receipt1 = await prisma.message_receipts.findFirst({
    where: { message_id: msg1Payload.id, user_id: USERS.b },
  });

  if (!receipt1 || !receipt1.delivered_at) {
    throw new Error("FAIL: Message was not marked as delivered immediately for online user B");
  }
  console.log("PASS: Message marked as delivered immediately (1 tick)");

  // User B reads the conversation
  clientB.emit("conversation.read", { conversationId: conversation.id });
  await sleep(500);

  const receipt2 = await prisma.message_receipts.findFirst({
    where: { message_id: msg1Payload.id, user_id: USERS.b },
  });

  if (!receipt2 || !receipt2.seen_at) {
    throw new Error("FAIL: Message was not marked as seen after conversation.read");
  }
  console.log("PASS: Message marked as seen after reading (2 ticks)");

  // User A should have received a socket event for 'seen'
  const seenUpdate = receiptUpdatesA.find((u) => u.messageId === msg1Payload.id && u.seenAt !== null);
  if (!seenUpdate) {
    throw new Error("FAIL: User A did not receive receipt.updated live broadcast for seen status");
  }
  console.log("PASS: User A received live socket update for seen status");

  // 2. Offline delivery catch-up test
  clientB.disconnect();
  await sleep(300);

  // User A sends message while B is offline
  const msg2Payload: any = await new Promise((resolve) => {
    clientA.emit("message.send", { conversationId: conversation.id, content: "Are you there?" }, (ack: any) => {
      resolve(ack.data);
    });
  });

  await sleep(300);
  const receipt3 = await prisma.message_receipts.findFirst({
    where: { message_id: msg2Payload.id, user_id: USERS.b },
  });

  if (receipt3 && receipt3.delivered_at) {
    throw new Error("FAIL: Message should not be delivered to offline user B");
  }
  console.log("PASS: Message remains undelivered when recipient is offline");

  // User B connects again (should trigger delivery catch-up)
  const clientB2 = io(CHAT_URL, { auth: { token: USERS.b }, transports: ["websocket"] });
  await new Promise((resolve) => clientB2.on("connect", resolve));
  await sleep(800);

  const receipt4 = await prisma.message_receipts.findFirst({
    where: { message_id: msg2Payload.id, user_id: USERS.b },
  });

  if (!receipt4 || !receipt4.delivered_at) {
    throw new Error("FAIL: Offline user B reconnect did not trigger delivery catch-up");
  }
  console.log("PASS: Catch-up successfully marked message as delivered upon connection");

  // Cleanup connections
  clientA.disconnect();
  clientB2.disconnect();

  console.log("🎉 ALL READ RECEIPT TESTS PASSED CLEANLY!");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("❌ TEST RUN FAILED:", err);
  process.exit(1);
});
