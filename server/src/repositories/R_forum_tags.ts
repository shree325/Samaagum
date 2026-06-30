// @ts-nocheck
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IForumTag, IR_forum_tags } from './IR_forum_tags';

export class R_forum_tags extends PostgresBaseRepository<IForumTag> implements IR_forum_tags {
  constructor() {
    super('forum_tags', 'id');
  }
}
