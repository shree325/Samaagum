import { Request, Response } from 'express';
import { ForumService } from '../services/ForumService';
import { AuthenticatedRequest } from '../middlewares/auth';

const forumService = new ForumService();

export class ForumController {
  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const post = await forumService.createPost({
        ...req.body,
        author_user_id: req.user?.id || req.body.author_user_id,
      });
      res.status(201).json(post);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async getPosts(req: Request, res: Response) {
    try {
      const posts = await forumService.getPosts(req.params.scopeId);
      res.json(posts);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async getPost(req: Request, res: Response) {
    try {
      const post = await forumService.getPost(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      res.json(post);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async addComment(req: AuthenticatedRequest, res: Response) {
    try {
      const comment = await forumService.addComment({
        ...req.body,
        post_id: req.params.id,
        author_user_id: req.user?.id || req.body.author_user_id,
      });
      res.status(201).json(comment);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async getComments(req: Request, res: Response) {
    try {
      const comments = await forumService.getComments(req.params.id);
      res.json(comments);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async pinPost(req: Request, res: Response) {
    try {
      const post = await forumService.pinPost(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      res.json(post);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }
}
