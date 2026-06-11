import { Request, Response } from 'express';
import { MediaService } from '../services/MediaService';

const mediaService = new MediaService();

export class MediaController {
  async createAsset(req: Request, res: Response) {
    try {
      const asset = await mediaService.createAsset(req.body);
      res.status(201).json(asset);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async getAsset(req: Request, res: Response) {
    try {
      const asset = await mediaService.getAsset(req.params.id);
      if (!asset) return res.status(404).json({ error: 'Asset not found' });
      res.json(asset);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async createGallery(req: Request, res: Response) {
    try {
      const gallery = await mediaService.createGallery(req.body);
      res.status(201).json(gallery);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async getGallery(req: Request, res: Response) {
    try {
      const gallery = await mediaService.getGallery(req.params.id);
      if (!gallery) return res.status(404).json({ error: 'Gallery not found' });
      res.json(gallery);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async addToGallery(req: Request, res: Response) {
    try {
      const item = await mediaService.addToGallery({ ...req.body, gallery_id: req.params.id });
      res.status(201).json(item);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }

  async getGalleryMedia(req: Request, res: Response) {
    try {
      const media = await mediaService.getGalleryMedia(req.params.id);
      res.json(media);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  }
}
