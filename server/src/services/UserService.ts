import pool from '../config/database';
import { R_users } from '../repositories/R_users';
import { R_profiles } from '../repositories/R_profiles';
import { IUser } from '../repositories/IR_users';

export class UserService {
  private userRepo: R_users;
  private profileRepo: R_profiles;

  constructor() {
    this.userRepo = new R_users(pool);
    this.profileRepo = new R_profiles(pool);
  }

  async register(tenantId: string, email: string, provider: string): Promise<IUser> {
    const existing = await this.userRepo.getByEmail(tenantId, email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const user = await this.userRepo.create({
      tenant_id: tenantId,
      primary_email: email,
      state: 'provisional',
    });

    // Auto-create empty profile
    await this.profileRepo.create({
      user_id: user.id!,
      tenant_id: tenantId,
    });

    return user;
  }

  async getById(id: string): Promise<IUser | null> {
    return this.userRepo.getById(id);
  }

  async getByEmail(tenantId: string, email: string): Promise<IUser | null> {
    return this.userRepo.getByEmail(tenantId, email);
  }

  async getByTenant(tenantId: string): Promise<IUser[]> {
    return this.userRepo.getByTenant(tenantId);
  }

  async updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    return this.userRepo.update(id, updates);
  }

  async activateUser(id: string): Promise<IUser | null> {
    return this.userRepo.activate(id);
  }

  async deactivateUser(id: string): Promise<IUser | null> {
    return this.userRepo.softDelete(id);
  }

  async completeProfile(userId: string, data: { display_name: string; bio?: string }): Promise<IUser | null> {
    await this.profileRepo.update(userId, {
      display_name: data.display_name,
      bio: data.bio,
    });
    return this.userRepo.update(userId, { profile_completed: true });
  }
}
