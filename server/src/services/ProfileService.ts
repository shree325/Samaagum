import pool from '../config/database';
import { R_profiles } from '../repositories/R_profiles';
import { IProfile } from '../repositories/IR_profiles';

export class ProfileService {
  private profileRepo: R_profiles;

  constructor() {
    this.profileRepo = new R_profiles(pool);
  }

  async getByUserId(userId: string): Promise<IProfile | null> {
    return this.profileRepo.getByUserId(userId);
  }

  async update(userId: string, updates: Partial<IProfile>): Promise<IProfile | null> {
    return this.profileRepo.update(userId, updates);
  }
}
