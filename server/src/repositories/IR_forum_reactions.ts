export interface IForumReaction {
  id: string;
  tenant_id: string;
  user_id: string;
  target_id: string;
  target_type: string;
  emoji: string;
  created_at?: Date;
}

export interface IR_forum_reactions {
  create(data: Partial<IForumReaction>): Promise<IForumReaction>;
  delete(id: string): Promise<boolean>;
  findMany(filter?: object): Promise<IForumReaction[]>;
}
