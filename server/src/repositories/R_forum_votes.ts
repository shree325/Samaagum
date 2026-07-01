// @ts-nocheck
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IForumVote, IR_forum_votes } from './IR_forum_votes';

export class R_forum_votes extends PostgresBaseRepository<IForumVote> implements IR_forum_votes {
  constructor() {
    super('forum_votes', 'id');
  }
}
