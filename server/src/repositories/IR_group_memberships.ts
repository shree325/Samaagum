import { IBaseRepository } from "./IBaseRepository";

export interface IGroupMembership {
  id?: string;
  tenant_id: string;
  group_id: string;
  user_id: string;
  state: 'pending' | 'active' | 'rejected' | 'left' | 'removed';
  form_response_id?: string | null;
  joined_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
  answers?: any;
}

export interface IR_group_memberships extends IBaseRepository<IGroupMembership> {
  getByGroupAndUser(groupId: string, userId: string): Promise<IGroupMembership | null>;
  getByGroup(groupId: string): Promise<IGroupMembership[]>;
  getByUser(userId: string): Promise<IGroupMembership[]>;
  findFirstActive(userId: string, orConditions: any[]): Promise<IGroupMembership | null>;
  findFirstActiveByCategory(userId: string, cats: string[]): Promise<IGroupMembership | null>;
  getMembershipCounts(groupIds: string[]): Promise<any[]>;
  getMembershipCountsAll(): Promise<any[]>;
  deleteMembership(groupId: string, userId: string): Promise<boolean>;
  leaveGroupTx(groupId: string, userId: string): Promise<void>;
  isActiveMember(userId: string, groupId: string): Promise<boolean>;
}

