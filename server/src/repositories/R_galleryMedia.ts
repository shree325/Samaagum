import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IGalleryMedia, IR_galleryMedia } from './IR_galleryMedia';
import prisma from '../config/prisma';

export class R_galleryMedia extends PostgresBaseRepository<IGalleryMedia> implements IR_galleryMedia {
  constructor() {
    super('gallery_media', 'media_id');
  }

  async findByGalleryId(galleryId: string): Promise<IGalleryMedia[]> {
    const query = `SELECT * FROM gallery_media WHERE gallery_id = $1`;
    const { rows } = await prisma.query(query, [galleryId]);
    return rows;
  }

  async findByAssetId(assetId: string): Promise<IGalleryMedia[]> {
    const query = `SELECT * FROM gallery_media WHERE asset_id = $1`;
    const { rows } = await prisma.query(query, [assetId]);
    return rows;
  }
}
