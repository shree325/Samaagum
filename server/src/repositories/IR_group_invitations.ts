import { IBaseRepository } from "./IBaseRepository";

export interface IGroupInvitation {
  id?: string;
  group_id: string;
  email?: string | null;
  username?: string | null;
  token: string;
  status: string;
  link_type: string;
  max_uses?: number | null;
  uses_count: number;
  expires_at?: Date | null;
  accepted_at?: Date | null;
  invited_by?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_group_invitations extends IBaseRepository<IGroupInvitation> {
  findByToken(token: string): Promise<IGroupInvitation | null>;
  findByTokenWithRelations(token: string): Promise<any | null>;
}
