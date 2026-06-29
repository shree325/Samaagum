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
}

export interface IR_group_memberships {
  create(membership: IGroupMembership): Promise<IGroupMembership>;
  getById(id: string): Promise<IGroupMembership | null>;
  getByGroupAndUser(groupId: string, userId: string): Promise<IGroupMembership | null>;
  getByGroup(groupId: string): Promise<IGroupMembership[]>;
  getByUser(userId: string): Promise<IGroupMembership[]>;
  update(id: string, membership: Partial<IGroupMembership>): Promise<IGroupMembership | null>;
  delete(id: string): Promise<boolean>;
}
