import prisma from '../config/prisma';
import { sendNotificationToUser } from './messagingSocket';

export class GroupNotificationService {
  /**
   * Helper to retrieve sender's name
   */
  private static async getActorName(actorId: string): Promise<string> {
    try {
      const user = await prisma.users.findUnique({
        where: { id: actorId },
        include: { profiles: true }
      });
      if (user) {
        return user.profiles?.display_name || user.primary_email?.split('@')[0] || 'Someone';
      }
    } catch (e) {
      console.error('Error fetching actor name:', e);
    }
    return 'Someone';
  }

  /**
   * Helper to get group members excluding the actor
   */
  private static async getGroupMembers(groupId: string, excludeActorId: string): Promise<string[]> {
    const memberships = await prisma.group_memberships.findMany({
      where: {
        group_id: groupId,
        state: 'active',
        user_id: { not: excludeActorId }
      },
      select: { user_id: true }
    });
    return memberships.map(m => m.user_id);
  }

  /**
   * 2. New discussion post created -> Notify all group members
   */
  static async notifyNewPost(groupId: string, groupName: string, postId: string, postTitle: string, actorId: string): Promise<void> {
    try {
      const actorName = await this.getActorName(actorId);
      const text = `New discussion <b>"${postTitle}"</b> created in <b>${groupName}</b> by <b>${actorName}</b>`;
      const memberIds = await this.getGroupMembers(groupId, actorId);

      if (memberIds.length === 0) return;

      const notificationsData = memberIds.map(userId => ({
        tenant_id: '00000000-0000-0000-0000-000000000000',
        user_id: userId,
        channel: 'socket',
        template_key: 'group_new_post',
        status: 'sent',
        provider_ref: postId
      }));

      await prisma.notification_log.createMany({
        data: notificationsData,
        skipDuplicates: true
      });

      for (const userId of memberIds) {
        sendNotificationToUser(userId, 'group.notification', {
          type: 'group_new_post',
          text,
          groupId,
          postId
        });
      }
    } catch (e) {
      console.error('Error notifying new post:', e);
    }
  }

  /**
   * 3. Comment, Reaction, or Reply -> Notify all group members
   */
  static async notifyPostActivity(groupId: string, groupName: string, postId: string, actorId: string, activityType: 'comment' | 'reaction' | 'reply'): Promise<void> {
    try {
      const actorName = await this.getActorName(actorId);
      let text = '';
      if (activityType === 'comment') {
        text = `<b>${actorName}</b> commented on a discussion post in <b>${groupName}</b>`;
      } else if (activityType === 'reaction') {
        text = `<b>${actorName}</b> reacted to a discussion post in <b>${groupName}</b>`;
      } else {
        text = `<b>${actorName}</b> replied to a comment in <b>${groupName}</b>`;
      }

      const memberIds = await this.getGroupMembers(groupId, actorId);
      if (memberIds.length === 0) return;

      const notificationsData = memberIds.map(userId => ({
        tenant_id: '00000000-0000-0000-0000-000000000000',
        user_id: userId,
        channel: 'socket',
        template_key: 'group_post_activity',
        status: 'sent',
        provider_ref: postId
      }));

      await prisma.notification_log.createMany({
        data: notificationsData,
        skipDuplicates: true
      });

      for (const userId of memberIds) {
        sendNotificationToUser(userId, 'group.notification', {
          type: 'group_post_activity',
          text,
          groupId,
          postId
        });
      }
    } catch (e) {
      console.error('Error notifying post activity:', e);
    }
  }

  /**
   * Notify when a user joins a group (Open/Public join)
   */
  static async notifyUserJoined(groupId: string, groupName: string, actorId: string): Promise<void> {
    try {
      const actorName = await this.getActorName(actorId);
      const text = `<b>${actorName}</b> has joined the group <b>${groupName}</b>`;

      // Get owner
      const groupEntity = await prisma.entities.findUnique({
        where: { id: groupId },
        select: { user_id: true }
      });
      const ownerId = groupEntity?.user_id;

      // Get admins
      const rolesDef = await prisma.roles.findMany({
        where: { key: 'group_admin' },
        select: { id: true }
      });
      const roleIds = rolesDef.map(r => r.id);
      const assignments = await prisma.role_assignments.findMany({
        where: { scope_entity_id: groupId, role_id: { in: roleIds } },
        select: { user_id: true }
      });

      const recipientIds = new Set<string>();
      if (ownerId) recipientIds.add(ownerId);
      assignments.forEach(a => recipientIds.add(a.user_id));
      recipientIds.add(actorId); // Include the user themselves

      if (recipientIds.size === 0) return;

      const providerRef = JSON.stringify({
        joinedUserId: actorId,
        joinedUserName: actorName,
        groupName: groupName
      });

      const notificationsData = Array.from(recipientIds).map(userId => ({
        tenant_id: '00000000-0000-0000-0000-000000000000',
        user_id: userId,
        channel: 'socket',
        template_key: 'group_user_joined',
        status: 'sent',
        provider_ref: providerRef
      }));

      await prisma.notification_log.createMany({
        data: notificationsData,
        skipDuplicates: true
      });

      for (const userId of recipientIds) {
        sendNotificationToUser(userId, 'group.notification', {
          type: 'group_user_joined',
          text,
          groupId,
          targetUserId: actorId
        });
      }
    } catch (e) {
      console.error('Error notifying user joined:', e);
    }
  }

  /**
   * Notify when a user join request is approved (Restricted/Approval join)
   */
  static async notifyJoinRequestApproved(groupId: string, groupName: string, joinedUserId: string, approverId: string): Promise<void> {
    try {
      const joinedUserName = await this.getActorName(joinedUserId);
      const approverName = await this.getActorName(approverId);
      const text = `<b>${approverName}</b> approved <b>${joinedUserName}</b>'s request to join <b>${groupName}</b>`;

      // Get owner
      const groupEntity = await prisma.entities.findUnique({
        where: { id: groupId },
        select: { user_id: true }
      });
      const ownerId = groupEntity?.user_id;

      // Get admins
      const rolesDef = await prisma.roles.findMany({
        where: { key: 'group_admin' },
        select: { id: true }
      });
      const roleIds = rolesDef.map(r => r.id);
      const assignments = await prisma.role_assignments.findMany({
        where: { scope_entity_id: groupId, role_id: { in: roleIds } },
        select: { user_id: true }
      });

      const recipientIds = new Set<string>();
      if (ownerId) recipientIds.add(ownerId);
      assignments.forEach(a => recipientIds.add(a.user_id));
      recipientIds.add(joinedUserId); // Include the user themselves
      recipientIds.delete(approverId); // Do not notify the approver themselves

      if (recipientIds.size === 0) return;

      const providerRef = JSON.stringify({
        joinedUserId: joinedUserId,
        joinedUserName: joinedUserName,
        groupName: groupName,
        approverName: approverName
      });

      const notificationsData = Array.from(recipientIds).map(userId => ({
        tenant_id: '00000000-0000-0000-0000-000000000000',
        user_id: userId,
        channel: 'socket',
        template_key: 'group_user_joined',
        status: 'sent',
        provider_ref: providerRef
      }));

      await prisma.notification_log.createMany({
        data: notificationsData,
        skipDuplicates: true
      });

      for (const userId of recipientIds) {
        sendNotificationToUser(userId, 'group.notification', {
          type: 'group_user_joined',
          text,
          groupId,
          targetUserId: joinedUserId
        });
      }
    } catch (e) {
      console.error('Error notifying join request approved:', e);
    }
  }

  /**
   * Notify when a user join request is rejected (declined)
   */
  static async notifyJoinRequestRejected(groupId: string, groupName: string, targetUserId: string): Promise<void> {
    try {
      const text = `Your request to join the group <b>${groupName}</b> was declined`;

      const providerRef = JSON.stringify({
        groupId,
        groupName
      });

      await prisma.notification_log.create({
        data: {
          tenant_id: '00000000-0000-0000-0000-000000000000',
          user_id: targetUserId,
          channel: 'socket',
          template_key: 'group_join_declined',
          status: 'sent',
          provider_ref: providerRef
        }
      });

      sendNotificationToUser(targetUserId, 'group.notification', {
        type: 'group_join_declined',
        text,
        groupId
      });
    } catch (e) {
      console.error('Error notifying join request rejected:', e);
    }
  }
}
