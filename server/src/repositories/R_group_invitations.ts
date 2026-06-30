import prisma from "../config/prisma";
import { PostgresBaseRepository } from "./PostgresBaseRepository";
import { IGroupInvitation, IR_group_invitations } from "./IR_group_invitations";

export class R_group_invitations extends PostgresBaseRepository<IGroupInvitation> implements IR_group_invitations {
  constructor(dbClient?: any) {
    super('group_invitations', 'id', dbClient);
  }

  async findByToken(token: string): Promise<IGroupInvitation | null> {
    return (this.dbModel as any).findUnique({
      where: { token }
    });
  }

  async findByTokenWithRelations(token: string): Promise<any | null> {
    return (this.dbModel as any).findUnique({
      where: { token },
      include: { groups: true, users: true }
    });
  }
}
