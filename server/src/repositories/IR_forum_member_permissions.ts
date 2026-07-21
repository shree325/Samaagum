export interface IForumMemberPermission {
  id: string;
  tenant_id: string;
  group_id: string;
  user_id: string;
  perm_type: string;
}

export interface IR_forum_member_permissions {
  create(data: Partial<IForumMemberPermission>): Promise<IForumMemberPermission>;
  getById(id: string): Promise<IForumMemberPermission | null>;
  delete(id: string): Promise<boolean>;
  findMany(filter?: object): Promise<IForumMemberPermission[]>;
}
