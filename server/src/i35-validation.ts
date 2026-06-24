import dotenv from "dotenv";
import prisma from "./config/prisma";

dotenv.config();

const { io } = require("socket.io-client");

type CheckStatus = "PASS" | "FAIL" | "MANUAL";

type CheckResult = {
  id: number;
  name: string;
  status: CheckStatus;
  details: string;
};

type TestSocket = {
  id?: string;
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, payload?: unknown, ack?: (response: any) => void) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler?: (...args: any[]) => void) => void;
};

const API_BASE = process.env.I35_API_BASE || `http://localhost:${process.env.PORT || 3000}`;
const CHAT_URL = process.env.I35_CHAT_URL || `${API_BASE}/chat`;
const TENANT_ID = "00000000-0000-0000-0000-000000000000";
const USERS = {
  a: "00000000-0000-0000-0000-000000003501",
  b: "00000000-0000-0000-0000-000000003502",
  c: "00000000-0000-0000-0000-000000003503",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uniqueRunId() {
  return `i35-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitFor<T>(label: string, fn: () => T | Promise<T>, timeoutMs = 5000, intervalMs = 100): Promise<T> {
  const started = Date.now();
  let lastError: unknown;
  while (Date.now() - started < timeoutMs) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(intervalMs);
  }
  const suffix = lastError instanceof Error ? ` Last error: ${lastError.message}` : "";
  throw new Error(`Timed out waiting for ${label}.${suffix}`);
}

async function api(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    throw new Error(`${init?.method || "GET"} ${path} failed: ${body.error || response.statusText}`);
  }
  return body.data ?? body;
}

async function ensureTestData() {
  await prisma.$executeRawUnsafe(
    `INSERT INTO tenants (id, slug, name, status, default_currency, default_locale)
     VALUES ($1, $2, $3, 'active', 'INR', 'en')
     ON CONFLICT (id) DO NOTHING`,
    TENANT_ID,
    "default",
    "Default Tenant"
  );

  for (const [key, userId] of Object.entries(USERS)) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO users (id, tenant_id, primary_email, email_verified, state, locale)
       VALUES ($1, $2, $3, true, 'active', 'en')
       ON CONFLICT (id) DO UPDATE SET state = 'active', primary_email = EXCLUDED.primary_email`,
      userId,
      TENANT_ID,
      `i35-${key}@samaagum.test`
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO presences (user_id, status, active_connections, last_seen_at, updated_at)
       VALUES ($1, 'OFFLINE', 0, NULL, now())
       ON CONFLICT (user_id) DO UPDATE
       SET status = 'OFFLINE', active_connections = 0, last_seen_at = NULL, updated_at = now()`,
      userId
    );
  }
}

function connectUser(userId: string, label: string): Promise<TestSocket> {
  return new Promise((resolve, reject) => {
    const socket: TestSocket = io(CHAT_URL, {
      auth: { token: userId },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 5000,
    });
    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error(`${label} did not connect to ${CHAT_URL}`));
    }, 6000);
    socket.on("connect", () => {
      clearTimeout(timeout);
      resolve(socket);
    });
    socket.on("connect_error", (error: Error) => {
      clearTimeout(timeout);
      socket.disconnect();
      reject(new Error(`${label} connect_error: ${error.message}`));
    });
  });
}

function joinConversation(socket: TestSocket, conversationId: string) {
  return new Promise<void>((resolve, reject) => {
    socket.emit("conversation.join", { conversationId }, (ack: any) => {
      if (ack?.success) resolve();
      else reject(new Error(`conversation.join failed for ${conversationId}: ${ack?.error || "missing ack"}`));
    });
  });
}

function sendSocketMessage(socket: TestSocket, conversationId: string, content: string) {
  return new Promise<void>((resolve, reject) => {
    socket.emit("message.send", { conversationId, content }, (ack: any) => {
      if (ack?.success) resolve();
      else reject(new Error(`message.send failed: ${ack?.error || "missing ack"}`));
    });
  });
}

function captureMessages(socket: TestSocket) {
  const events: any[] = [];
  const handler = (payload: any) => events.push(payload);
  socket.on("message.created", handler);
  return {
    events,
    stop: () => socket.off("message.created", handler),
  };
}

async function getPresence(userId: string) {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT user_id, active_connections, status, last_seen_at FROM presences WHERE user_id = $1`,
    userId
  );
  return rows[0];
}

async function createDirect(creatorId: string, targetId: string) {
  return api("/api/test/conversations/direct", {
    method: "POST",
    body: JSON.stringify({ creatorId, targetId }),
  });
}

async function createGroup(creatorId: string, title: string, participantIds: string[]) {
  return api("/api/test/conversations/group", {
    method: "POST",
    body: JSON.stringify({ creatorId, title, participantIds }),
  });
}

async function getConversations(userId: string) {
  return api(`/api/test/conversations?userId=${userId}`);
}

async function getMessages(actorId: string, conversationId: string) {
  return api(`/api/test/messages/${conversationId}?actorId=${actorId}&limit=100`);
}

async function countMessages(conversationId: string, prefix: string) {
  const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS count FROM messages WHERE conversation_id = $1 AND body LIKE $2`,
    conversationId,
    `${prefix}%`
  );
  return Number(rows[0]?.count || 0);
}

async function participantAudit(conversationId?: string) {
  if (conversationId) {
    return prisma.$queryRawUnsafe<any[]>(
      `SELECT conversation_id, COUNT(*)::int AS count
       FROM conversation_participants
       WHERE conversation_id = $1
       GROUP BY conversation_id`,
      conversationId
    );
  }
  return prisma.$queryRawUnsafe<any[]>(
    `SELECT conversation_id, COUNT(*)::int AS count
     FROM conversation_participants
     GROUP BY conversation_id
     ORDER BY conversation_id`
  );
}

async function presenceAudit() {
  return prisma.$queryRawUnsafe<any[]>(
    `SELECT user_id, active_connections, status FROM presences WHERE user_id IN ($1, $2, $3) ORDER BY user_id`,
    USERS.a,
    USERS.b,
    USERS.c
  );
}

async function withSockets<T>(sockets: TestSocket[], fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } finally {
    for (const socket of sockets) {
      if (socket.connected) socket.disconnect();
    }
    await sleep(250);
  }
}

async function scenario1(runId: string) {
  const conversation = await createDirect(USERS.a, USERS.b);
  const socketA = await connectUser(USERS.a, "scenario1/a");
  const socketB = await connectUser(USERS.b, "scenario1/b");
  return withSockets([socketA, socketB], async () => {
    await joinConversation(socketA, conversation.id);
    await joinConversation(socketB, conversation.id);
    const aEvents = captureMessages(socketA);
    const bEvents = captureMessages(socketB);
    await sendSocketMessage(socketA, conversation.id, `${runId}-s1-a-to-b`);
    await waitFor("User B realtime DM receive", () => bEvents.events.some((e) => e.content === `${runId}-s1-a-to-b`));
    await sendSocketMessage(socketB, conversation.id, `${runId}-s1-b-to-a`);
    await waitFor("User A realtime DM receive", () => aEvents.events.some((e) => e.content === `${runId}-s1-b-to-a`));
    const history = await getMessages(USERS.a, conversation.id);
    assert(history.some((m: any) => m.content === `${runId}-s1-a-to-b` || m.body === `${runId}-s1-a-to-b`), "DM history did not include A message");
    assert(history.some((m: any) => m.content === `${runId}-s1-b-to-a` || m.body === `${runId}-s1-b-to-a`), "DM history did not include B message");
    aEvents.stop();
    bEvents.stop();
  });
}

async function scenario2(runId: string) {
  const title = `${runId} group`;
  const group = await createGroup(USERS.a, title, [USERS.b, USERS.c]);
  const [forB, forC] = await Promise.all([getConversations(USERS.b), getConversations(USERS.c)]);
  assert(forB.some((c: any) => c.id === group.id), "User B cannot see group after refresh");
  assert(forC.some((c: any) => c.id === group.id), "User C cannot see group after refresh");

  const socketA = await connectUser(USERS.a, "scenario2/a");
  const socketB = await connectUser(USERS.b, "scenario2/b");
  const socketC = await connectUser(USERS.c, "scenario2/c");
  return withSockets([socketA, socketB, socketC], async () => {
    await Promise.all([socketA, socketB, socketC].map((socket) => joinConversation(socket, group.id)));
    const captures = [captureMessages(socketA), captureMessages(socketB), captureMessages(socketC)];
    await sendSocketMessage(socketA, group.id, `${runId}-s2-from-a`);
    await sendSocketMessage(socketB, group.id, `${runId}-s2-from-b`);
    await sendSocketMessage(socketC, group.id, `${runId}-s2-from-c`);
    for (const capture of captures) {
      await waitFor("all group participants receive three messages", () => {
        const contents = capture.events.map((e) => e.content);
        return [`${runId}-s2-from-a`, `${runId}-s2-from-b`, `${runId}-s2-from-c`].every((content) => contents.includes(content));
      });
      capture.stop();
    }
    const history = await getMessages(USERS.b, group.id);
    assert(history.filter((m: any) => String(m.content || m.body).startsWith(`${runId}-s2-`)).length >= 3, "Group history did not reload all messages");
  });
}

async function scenario3() {
  const sockets = [
    await connectUser(USERS.a, "scenario3/a1"),
    await connectUser(USERS.a, "scenario3/a2"),
    await connectUser(USERS.a, "scenario3/a3"),
  ];
  try {
    await waitFor("activeConnections = 3", async () => (await getPresence(USERS.a))?.active_connections === 3);
    sockets[0].disconnect();
    await waitFor("activeConnections = 2", async () => {
      const p = await getPresence(USERS.a);
      return p?.active_connections === 2 && p.status === "ONLINE";
    });
    sockets[1].disconnect();
    await waitFor("activeConnections = 1", async () => {
      const p = await getPresence(USERS.a);
      return p?.active_connections === 1 && p.status === "ONLINE";
    });
    sockets[2].disconnect();
    await waitFor("offline after final tab closes", async () => {
      const p = await getPresence(USERS.a);
      return p?.active_connections === 0 && p.status === "OFFLINE" && !!p.last_seen_at;
    });
  } finally {
    sockets.forEach((socket) => socket.connected && socket.disconnect());
  }
}

async function scenario4(runId: string) {
  const conversation = await createDirect(USERS.a, USERS.b);
  const socketB = await connectUser(USERS.b, "scenario4/b");
  let socketA = await connectUser(USERS.a, "scenario4/a1");
  return withSockets([socketB], async () => {
    await joinConversation(socketA, conversation.id);
    await joinConversation(socketB, conversation.id);
    socketA.disconnect();
    await waitFor("A offline after disconnect", async () => (await getPresence(USERS.a))?.status === "OFFLINE");
    socketA = await connectUser(USERS.a, "scenario4/a2");
    try {
      await joinConversation(socketA, conversation.id);
      const aEvents = captureMessages(socketA);
      await sendSocketMessage(socketB, conversation.id, `${runId}-s4-after-reconnect`);
      await waitFor("A receives after reconnect", () => aEvents.events.some((e) => e.content === `${runId}-s4-after-reconnect`));
      aEvents.stop();
    } finally {
      if (socketA.connected) socketA.disconnect();
    }
  });
}

async function scenario5(runId: string) {
  const conversation = await createDirect(USERS.a, USERS.b);
  const socketB = await connectUser(USERS.b, "scenario5/b");
  let socketA = await connectUser(USERS.a, "scenario5/a1");
  return withSockets([socketB], async () => {
    await joinConversation(socketA, conversation.id);
    await joinConversation(socketB, conversation.id);
    await sendSocketMessage(socketB, conversation.id, `${runId}-s5-before-refresh`);
    socketA.disconnect();
    const conversations = await getConversations(USERS.a);
    assert(conversations.some((c: any) => c.id === conversation.id), "Conversation list did not reload after refresh");
    const history = await getMessages(USERS.a, conversation.id);
    assert(history.some((m: any) => String(m.content || m.body) === `${runId}-s5-before-refresh`), "Message history did not reload after refresh");
    socketA = await connectUser(USERS.a, "scenario5/a2");
    try {
      await joinConversation(socketA, conversation.id);
      const aEvents = captureMessages(socketA);
      await sendSocketMessage(socketB, conversation.id, `${runId}-s5-after-refresh`);
      await waitFor("A receives after refresh", () => aEvents.events.filter((e) => e.content === `${runId}-s5-after-refresh`).length === 1);
      aEvents.stop();
    } finally {
      if (socketA.connected) socketA.disconnect();
    }
  });
}

async function scenario6(runId: string) {
  const conversation = await createDirect(USERS.a, USERS.b);
  const socketA = await connectUser(USERS.a, "scenario6/a");
  const socketB = await connectUser(USERS.b, "scenario6/b");
  return withSockets([socketA, socketB], async () => {
    await joinConversation(socketA, conversation.id);
    await joinConversation(socketB, conversation.id);
    const bEvents = captureMessages(socketB);
    const prefix = `${runId}-s6-burst-`;
    for (let i = 0; i < 20; i += 1) {
      await sendSocketMessage(socketA, conversation.id, `${prefix}${String(i).padStart(2, "0")}`);
    }
    await waitFor("20 burst events", () => bEvents.events.filter((e) => String(e.content).startsWith(prefix)).length === 20, 8000);
    assert(await countMessages(conversation.id, prefix) === 20, "Rapid burst did not persist exactly 20 messages");
    const received = bEvents.events.filter((e) => String(e.content).startsWith(prefix)).map((e) => e.content);
    assert(new Set(received).size === 20, "Rapid burst delivered duplicates");
    bEvents.stop();
  });
}

async function scenario7() {
  const first = await createDirect(USERS.a, USERS.b);
  const second = await createDirect(USERS.a, USERS.b);
  assert(first.id === second.id, `Duplicate DM returned different ids: ${first.id} vs ${second.id}`);
}

async function scenario9() {
  const sockets = [
    await connectUser(USERS.a, "scenario9/a1"),
    await connectUser(USERS.a, "scenario9/a2"),
    await connectUser(USERS.a, "scenario9/a3"),
    await connectUser(USERS.b, "scenario9/b1"),
    await connectUser(USERS.b, "scenario9/b2"),
    await connectUser(USERS.c, "scenario9/c1"),
  ];
  try {
    await waitFor("presence matrix 3/2/1", async () => {
      const rows = await presenceAudit();
      const map = new Map(rows.map((row) => [row.user_id, row]));
      return map.get(USERS.a)?.active_connections === 3
        && map.get(USERS.b)?.active_connections === 2
        && map.get(USERS.c)?.active_connections === 1
        && rows.every((row) => row.status === "ONLINE");
    });
  } finally {
    sockets.forEach((socket) => socket.connected && socket.disconnect());
  }
  await waitFor("presence matrix offline", async () => {
    const rows = await presenceAudit();
    return rows.every((row) => row.active_connections === 0 && row.status === "OFFLINE");
  });
}

async function scenario10(runId: string) {
  const conversation = await createDirect(USERS.a, USERS.b);
  const socketA = await connectUser(USERS.a, "scenario10/a");
  const socketB = await connectUser(USERS.b, "scenario10/b");
  return withSockets([socketA, socketB], async () => {
    await joinConversation(socketA, conversation.id);
    await joinConversation(socketB, conversation.id);
    const bEvents = captureMessages(socketB);
    const prefix = `${runId}-s10-event-`;
    for (let i = 0; i < 10; i += 1) {
      await sendSocketMessage(socketA, conversation.id, `${prefix}${i}`);
    }
    await waitFor("exact 10 event duplication audit events", () => bEvents.events.filter((e) => String(e.content).startsWith(prefix)).length === 10);
    assert(await countMessages(conversation.id, prefix) === 10, "Event duplication audit DB count was not 10");
    assert(new Set(bEvents.events.filter((e) => String(e.content).startsWith(prefix)).map((e) => e.messageId)).size === 10, "Socket event ids were duplicated");
    bEvents.stop();
  });
}

async function scenario11(runId: string) {
  const conversation = await createDirect(USERS.a, USERS.b);
  const socketA = await connectUser(USERS.a, "scenario11/a");
  const socketB = await connectUser(USERS.b, "scenario11/b");
  return withSockets([socketA, socketB], async () => {
    await joinConversation(socketA, conversation.id);
    await joinConversation(socketA, conversation.id);
    await joinConversation(socketA, conversation.id);
    await joinConversation(socketB, conversation.id);
    const aEvents = captureMessages(socketA);
    await sendSocketMessage(socketB, conversation.id, `${runId}-s11-room-leak`);
    await sleep(500);
    const count = aEvents.events.filter((e) => e.content === `${runId}-s11-room-leak`).length;
    assert(count === 1, `Expected exactly one room event, got ${count}`);
    aEvents.stop();
  });
}

async function scenario12(runId: string) {
  const convAB = await createDirect(USERS.a, USERS.b);
  const convAC = await createDirect(USERS.a, USERS.c);
  const socketA = await connectUser(USERS.a, "scenario12/a");
  const socketB = await connectUser(USERS.b, "scenario12/b");
  const socketC = await connectUser(USERS.c, "scenario12/c");
  return withSockets([socketA, socketB, socketC], async () => {
    await joinConversation(socketA, convAB.id);
    await joinConversation(socketB, convAB.id);
    await joinConversation(socketC, convAC.id);
    const bEvents = captureMessages(socketB);
    const cEvents = captureMessages(socketC);
    await sendSocketMessage(socketA, convAB.id, `${runId}-s12-isolation`);
    await waitFor("B receives isolated message", () => bEvents.events.some((e) => e.content === `${runId}-s12-isolation`));
    await sleep(500);
    assert(!cEvents.events.some((e) => e.content === `${runId}-s12-isolation`), "User C received message from unrelated conversation");
    bEvents.stop();
    cEvents.stop();
  });
}

async function scenarioDatabaseAudits() {
  const participants = await participantAudit();
  const presences = await presenceAudit();
  const duplicatePresenceRows = await prisma.$queryRawUnsafe<Array<{ user_id: string; count: bigint }>>(
    `SELECT user_id, COUNT(*)::bigint AS count
     FROM presences
     WHERE user_id IN ($1, $2, $3)
     GROUP BY user_id
     HAVING COUNT(*) > 1`,
    USERS.a,
    USERS.b,
    USERS.c
  );
  const orphanParticipants = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS count
     FROM conversation_participants cp
     LEFT JOIN conversations c ON c.id = cp.conversation_id
     LEFT JOIN users u ON u.id = cp.user_id
     WHERE c.id IS NULL OR u.id IS NULL`
  );
  assert(Array.isArray(participants), "Participant count audit failed");
  assert(presences.length === 3, "Presence count audit did not return all I3.5 users");
  assert(duplicatePresenceRows.length === 0, "Duplicate presence rows found");
  assert(Number(orphanParticipants[0]?.count || 0) === 0, "Orphan participant records found");
}

async function runScenario(id: number, name: string, fn: () => Promise<void>): Promise<CheckResult> {
  process.stdout.write(`I3.5.${id} ${name} ... `);
  try {
    await fn();
    console.log("PASS");
    return { id, name, status: "PASS", details: "Passed" };
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    console.log(`FAIL\n  ${details}`);
    return { id, name, status: "FAIL", details };
  }
}

function printSummary(results: CheckResult[]) {
  const passed = results.filter((result) => result.status === "PASS").length;
  const failed = results.filter((result) => result.status === "FAIL").length;
  const manual = results.filter((result) => result.status === "MANUAL").length;

  console.log("\nPhase I3.5 Sign-off Summary");
  console.log(`PASS: ${passed}  FAIL: ${failed}  MANUAL: ${manual}`);
  for (const result of results) {
    console.log(`[${result.status}] ${result.id}. ${result.name} - ${result.details}`);
  }
}

async function main() {
  console.log(`Phase I3.5 validation against ${API_BASE}`);
  await api("/health");
  await ensureTestData();

  const runId = uniqueRunId();
  const results: CheckResult[] = [];

  results.push(await runScenario(1, "Direct Message Stability", () => scenario1(runId)));
  results.push(await runScenario(2, "Group Conversation Room Verification", () => scenario2(runId)));
  results.push(await runScenario(3, "Multi-Tab Connection Tracking", () => scenario3()));
  results.push(await runScenario(4, "Disconnect & Reconnection", () => scenario4(runId)));
  results.push(await runScenario(5, "Browser Refresh Recovery", () => scenario5(runId)));
  results.push(await runScenario(6, "Rapid Message Burst", () => scenario6(runId)));
  results.push(await runScenario(7, "Duplicate Conversation Protection", () => scenario7()));
  results.push({
    id: 8,
    name: "Server Restart Recovery",
    status: "MANUAL",
    details: "Requires restarting the running backend while playground clients are open; see docs/I3.5-validation.md.",
  });
  console.log("I3.5.8 Server Restart Recovery ... MANUAL");
  results.push(await runScenario(9, "Presence Consistency Audit", () => scenario9()));
  results.push(await runScenario(10, "Event Duplication Audit", () => scenario10(runId)));
  results.push(await runScenario(11, "Orphaned Room Membership Audit", () => scenario11(runId)));
  results.push(await runScenario(12, "Cross-Conversation Isolation", () => scenario12(runId)));
  results.push(await runScenario(13, "Participant & Presence Database Audits", () => scenarioDatabaseAudits()));

  printSummary(results);

  await prisma.$disconnect();

  if (results.some((result) => result.status === "FAIL")) {
    process.exit(1);
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
