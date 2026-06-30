export interface IForumVote {
  id: string;
  tenant_id: string;
  user_id: string;
  target_id: string;
  target_type: string;
  vote: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_forum_votes {
  create(data: Partial<IForumVote>): Promise<IForumVote>;
  delete(id: string): Promise<boolean>;
  findMany(filter?: object): Promise<IForumVote[]>;
}
