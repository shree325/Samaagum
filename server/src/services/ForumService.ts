import pool from '../config/database';
import { R_forumPosts } from '../repositories/R_forumPosts';
import { R_forumComments } from '../repositories/R_forumComments';

export class ForumService {
  private postRepo: R_forumPosts;
  private commentRepo: R_forumComments;

  constructor() {
    this.postRepo = new R_forumPosts(pool);
    this.commentRepo = new R_forumComments(pool);
  }

  async createPost(data: { tenant_id: string; scope_type: string; scope_id: string; author_user_id: string; title?: string; body?: string }) {
    return this.postRepo.create(data);
  }

  async getPosts(scopeId: string) {
    return this.postRepo.findAll({ scope_id: scopeId });
  }

  async getPost(id: string) {
    return this.postRepo.getById(id);
  }

  async addComment(data: { tenant_id: string; post_id: string; author_user_id: string; body: string }) {
    return this.commentRepo.create(data);
  }

  async getComments(postId: string) {
    return this.commentRepo.findAll({ post_id: postId });
  }

  async pinPost(id: string) {
    return this.postRepo.update(id, { pinned: true });
  }

  async hidePost(id: string) {
    return this.postRepo.update(id, { status: 'hidden' });
  }
}
