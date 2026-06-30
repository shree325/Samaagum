// @ts-nocheck
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IForumMemberPermission, IR_forum_member_permissions } from './IR_forum_member_permissions';

export class R_forum_member_permissions extends PostgresBaseRepository<IForumMemberPermission> implements IR_forum_member_permissions {
  constructor() {
    super('forum_member_permissions', 'id');
  }
}
