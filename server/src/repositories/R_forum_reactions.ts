// @ts-nocheck
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IForumReaction, IR_forum_reactions } from './IR_forum_reactions';

export class R_forum_reactions extends PostgresBaseRepository<IForumReaction> implements IR_forum_reactions {
  constructor() {
    super('forum_reactions', 'id');
  }
}
