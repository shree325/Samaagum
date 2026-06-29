import { PrismaClient } from '@prisma/client';
import { IGroupMembership, IR_group_memberships } from "./IR_group_memberships";

export class R_group_memberships implements IR_group_memberships {
  constructor(private db: PrismaClient) {}

  async create(gm: IGroupMembership): Promise<IGroupMembership> {
    const data: any = {
      tenant_id: gm.tenant_id,
      group_id: gm.group_id,
      user_id: gm.user_id,
      state: gm.state || 'pending',
      form_response_id: gm.form_response_id || null,
      joined_at: gm.joined_at || null,
    };
    return (this.db.group_memberships as any).create({ data });
  }

  async getById(id: string): Promise<IGroupMembership | null> {
    return (this.db.group_memberships as any).findUnique({ where: { id } });
  }

  async getByGroupAndUser(group_id: string, user_id: string): Promise<IGroupMembership | null> {
    return (this.db.group_memberships as any).findUnique({
      where: {
        group_id_user_id: { group_id, user_id }
      }
    });
  }

  async getByGroup(group_id: string): Promise<IGroupMembership[]> {
    return (this.db.group_memberships as any).findMany({
      where: { group_id },
      orderBy: { created_at: 'desc' }
    });
  }

  async getByUser(user_id: string): Promise<IGroupMembership[]> {
    return (this.db.group_memberships as any).findMany({
      where: { user_id },
      orderBy: { created_at: 'desc' }
    });
  }

  async update(id: string, gm: Partial<IGroupMembership>): Promise<IGroupMembership | null> {
    return (this.db.group_memberships as any).update({
      where: { id },
      data: gm
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await (this.db.group_memberships as any).delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
