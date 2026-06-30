// @ts-nocheck
import prisma from '../config/prisma';
import { IForumPostTag, IR_forum_post_tags } from './IR_forum_post_tags';

export class R_forum_post_tags implements IR_forum_post_tags {
  async create(data: IForumPostTag): Promise<IForumPostTag> {
    return await prisma.forum_post_tags.create({
      data
    });
  }

  async delete(postId: string, tagId: string): Promise<boolean> {
    try {
      await prisma.forum_post_tags.delete({
        where: {
          post_id_tag_id: {
            post_id: postId,
            tag_id: tagId
          }
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  async findMany(filter?: object): Promise<IForumPostTag[]> {
    return await prisma.forum_post_tags.findMany({
      where: filter || {}
    });
  }
}
