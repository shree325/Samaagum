export interface IForumTag {
  id: string;
  tenant_id: string;
  scope_id: string;
  scope_type: string;
  name: string;
  color: string;
}

export interface IR_forum_tags {
  create(data: Partial<IForumTag>): Promise<IForumTag>;
  delete(id: string): Promise<boolean>;
  findMany(filter?: object): Promise<IForumTag[]>;
}
