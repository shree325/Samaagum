import { Server, Socket } from "socket.io";

export const startGroupsSocket = async (io: Server) => {
    const nsp = io.of('/groups');

    // groupId → Set of unique userIds currently viewing the group
    const groupUsers = new Map<string, Set<string>>();
    // socketId → { groupId, userId } so we can clean up on disconnect
    const socketMeta = new Map<string, { groupId: string; userId: string }>();

    const broadcastOnlineCount = (groupId: string) => {
        const count = groupUsers.get(groupId)?.size ?? 0;
        nsp.to(`group_${groupId}`).emit('online_count', { groupId, count });
    };

    nsp.on('connection', (socket: Socket) => {

        socket.on('join_group', ({ groupId, userId }: { groupId: string; userId: string }) => {
            if (!groupId) return;
            const uid = userId || `anon_${socket.id}`; // fallback for unauthenticated
            socket.join(`group_${groupId}`);
            socketMeta.set(socket.id, { groupId, userId: uid });
            if (!groupUsers.has(groupId)) groupUsers.set(groupId, new Set());
            groupUsers.get(groupId)!.add(uid);
            broadcastOnlineCount(groupId);
        });

        socket.on('leave_group', (groupId: string) => {
            const meta = socketMeta.get(socket.id);
            if (!meta || meta.groupId !== groupId) return;
            socket.leave(`group_${groupId}`);
            socketMeta.delete(socket.id);
            groupUsers.get(groupId)?.delete(meta.userId);
            broadcastOnlineCount(groupId);
        });

        socket.on('disconnect', () => {
            const meta = socketMeta.get(socket.id);
            if (!meta) return;
            socketMeta.delete(socket.id);
            groupUsers.get(meta.groupId)?.delete(meta.userId);
            broadcastOnlineCount(meta.groupId);
        });
        socket.on('join_event', (eventId: string) => {
            socket.join(`event_${eventId}`);
        });

        socket.on('join_user', (userId: string) => {
            if (userId) socket.join(`user_${userId}`);
        });

        socket.on('join_discover', () => {
            socket.join('discover');
        });

        socket.on('leave_event', (eventId: string) => {
            socket.leave(`event_${eventId}`);
        });
    });
};
