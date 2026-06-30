export interface IForumPostTag {
  post_id: string;
  tag_id: string;
}

export interface IR_forum_post_tags {
  create(data: IForumPostTag): Promise<IForumPostTag>;
  delete(postId: string, tagId: string): Promise<boolean>;
  findMany(filter?: object): Promise<IForumPostTag[]>;
}
