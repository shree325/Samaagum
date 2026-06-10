export interface IGroupMembership {
  row_id?: string;
  bu_id: string;
  par_row_id: string; // Group ID
  user_id: string;
  role?: string;
  status?: string;
  x_data?: Record<string, unknown> | null;

  created?: Date;
  created_by?: string | null;
  last_upd?: Date;
  last_upd_by?: string | null;
  modification_num?: number;
  conflict_id?: string;
  db_last_upd?: Date;
  db_last_upd_src?: string;
}

export interface IR_group_memberships {
  create(membership: IGroupMembership): Promise<IGroupMembership>;
  getById(rowId: string): Promise<IGroupMembership | null>;
  getByGroupAndUser(groupId: string, userId: string): Promise<IGroupMembership | null>;
  getByGroup(groupId: string): Promise<IGroupMembership[]>;
  getByUser(userId: string): Promise<IGroupMembership[]>;
  update(rowId: string, membership: Partial<IGroupMembership>): Promise<IGroupMembership | null>;
  delete(rowId: string): Promise<boolean>;
}
