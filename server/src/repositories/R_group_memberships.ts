import { PostgresBaseRepository } from "./PostgresBaseRepository";
import { IGroupMembership, IR_group_memberships } from "./IR_group_memberships";

import prisma from '../config/prisma';

export class R_group_memberships extends PostgresBaseRepository<IGroupMembership> implements IR_group_memberships {
  constructor(dbClient?: any) {
    super('group_memberships', 'id', dbClient);
  }

  async getByGroupAndUser(group_id: string, user_id: string): Promise<IGroupMembership | null> {
    return (this.dbModel as any).findFirst({
      where: { group_id, user_id }
    });
  }

  async getByGroup(group_id: string): Promise<IGroupMembership[]> {
    return (this.dbModel as any).findMany({
      where: { group_id },
      orderBy: { created_at: 'desc' }
    });
  }

  async getByUser(user_id: string): Promise<IGroupMembership[]> {
    return (this.dbModel as any).findMany({
      where: { user_id },
      orderBy: { created_at: 'desc' }
    });
  }

  async findFirstActive(userId: string, orConditions: any[]): Promise<IGroupMembership | null> {
    return await prisma.group_memberships.findFirst({
      where: { user_id: userId, state: 'active', OR: orConditions }
    });
  }

  async findFirstActiveByCategory(userId: string, cats: string[]): Promise<IGroupMembership | null> {
    return await prisma.group_memberships.findFirst({
      where: { user_id: userId, state: 'active', entities: { groups: { is: { category: { in: cats } } } } }
    });
  }

  async getMembershipCounts(groupIds: string[]): Promise<any[]> {
    return await (prisma.group_memberships.groupBy as any)({
      by: ['group_id'],
      where: { group_id: { in: groupIds }, state: 'active' },
      _count: { _all: true }
    });
  }

  async getMembershipCountsAll(): Promise<any[]> {
    return await (prisma.group_memberships.groupBy as any)({
      by: ['group_id'],
      where: { state: 'active' },
      _count: { _all: true }
    });
  }

  async getOnlineCounts(groupIds: string[]): Promise<any[]> {
    if (groupIds.length === 0) return [];
    return await prisma.$queryRawUnsafe<any[]>(`
      SELECT gm.group_id, count(p.user_id)::int as count
      FROM group_memberships gm
      JOIN presences p ON p.user_id = gm.user_id
      WHERE gm.group_id IN (${groupIds.map((_, i) => `$${i + 1}::uuid`).join(', ')})
        AND p.active_connections > 0
        AND gm.state = 'active'
      GROUP BY gm.group_id
    `, ...groupIds);
  }

  async getOnlineCountsAll(): Promise<any[]> {
    return await prisma.$queryRawUnsafe<any[]>(`
      SELECT gm.group_id, count(p.user_id)::int as count
      FROM group_memberships gm
      JOIN presences p ON p.user_id = gm.user_id
      WHERE p.active_connections > 0
        AND gm.state = 'active'
      GROUP BY gm.group_id
    `);
  }

  async deleteMembership(groupId: string, userId: string): Promise<boolean> {
    try {
      await prisma.group_memberships.deleteMany({
        where: { group_id: groupId, user_id: userId }
      });
      return true;
    } catch {
      return false;
    }
  }

  async leaveGroupTx(groupId: string, userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.role_assignments.deleteMany({
        where: { user_id: userId, scope_entity_id: groupId }
      });
      await tx.group_memberships.deleteMany({
        where: { group_id: groupId, user_id: userId }
      });
    });
  }
}
