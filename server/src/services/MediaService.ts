import pool from '../config/database';
import { R_mediaAssets } from '../repositories/R_mediaAssets';
import { R_galleries } from '../repositories/R_galleries';
import { R_galleryMedia } from '../repositories/R_galleryMedia';

export class MediaService {
  private assetRepo: R_mediaAssets;
  private galleryRepo: R_galleries;
  private galleryMediaRepo: R_galleryMedia;

  constructor() {
    this.assetRepo = new R_mediaAssets(pool);
    this.galleryRepo = new R_galleries(pool);
    this.galleryMediaRepo = new R_galleryMedia(pool);
  }

  async createAsset(data: { tenant_id: string; owner_entity_id?: string; owner_user_id?: string; storage_key: string; mime?: string }) {
    return this.assetRepo.create(data);
  }

  async getAsset(id: string) {
    return this.assetRepo.getById(id);
  }

  async createGallery(data: { tenant_id: string; owner_entity_id: string; event_id?: string; title?: string }) {
    return this.galleryRepo.create(data);
  }

  async getGallery(id: string) {
    return this.galleryRepo.getById(id);
  }

  async addToGallery(data: { gallery_id: string; asset_id: string; caption?: string; position?: number }) {
    return this.galleryMediaRepo.create(data);
  }

  async getGalleryMedia(galleryId: string) {
    return this.galleryMediaRepo.findAll({ gallery_id: galleryId });
  }
}
