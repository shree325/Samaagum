// @ts-nocheck
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IGroupGallery, IR_group_gallery } from './IR_group_gallery';

export class R_group_gallery extends PostgresBaseRepository<IGroupGallery> implements IR_group_gallery {
  constructor() {
    super('group_gallery', 'id');
  }
}
