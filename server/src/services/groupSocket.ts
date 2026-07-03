import { Server, Socket } from "socket.io";

export const startGroupsSocket = async (io: Server) => {
    const nsp = io.of('/groups');
    nsp.on('connection', (socket: Socket) => {
        socket.on('join_group', (groupId: string) => {
            socket.join(`group_${groupId}`);
        });
        socket.on('leave_group', (groupId: string) => {
            socket.leave(`group_${groupId}`);
        });
        socket.on('join_event', (eventId: string) => {
            socket.join(`event_${eventId}`);
        });
        socket.on('leave_event', (eventId: string) => {
            socket.leave(`event_${eventId}`);
        });
    });
};
