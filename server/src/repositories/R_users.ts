// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { IUser, IR_users } from './IR_users';

export class R_users implements IR_users {
  constructor(private db: PrismaClient) {}

  async create(user: IUser): Promise<IUser> {
    const data = {
      tenant_id: user.tenant_id,
      primary_email: user.primary_email,
      email_verified: user.email_verified ?? false,
      state: (user.state ?? 'provisional') as any,
      locale: user.locale ?? 'en',
      preferred_currency: user.preferred_currency,
      gender: user.gender,
      dob: user.dob,
      phone_e164: user.phone_e164,
      profile_completed: user.profile_completed ?? false,
    };
    return this.db.users.create({ data }) as any;
  }

  async getById(id: string): Promise<IUser | null> {
    return this.db.users.findUnique({
      where: { id }
    }) as any;
  }

  async getByEmail(tenantId: string, email: string): Promise<IUser | null> {
    return this.db.users.findFirst({
      where: {
        tenant_id: tenantId,
        primary_email: email
      }
    }) as any;
  }

  async getByTenant(tenantId: string): Promise<IUser[]> {
    return this.db.users.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' }
    }) as any;
  }

  async update(id: string, user: Partial<IUser>): Promise<IUser | null> {
    return this.db.users.update({
      where: { id },
      data: {
        primary_email: user.primary_email,
        email_verified: user.email_verified,
        state: user.state as any,
        locale: user.locale,
        preferred_currency: user.preferred_currency,
        gender: user.gender,
        dob: user.dob,
        phone_e164: user.phone_e164,
        profile_completed: user.profile_completed,
      }
    }) as any;
  }

  async softDelete(id: string): Promise<IUser | null> {
    return this.db.users.update({
      where: { id },
      data: {
        state: 'deleted' as any,
        deleted_at: new Date()
      }
    }) as any;
  }

  async activate(id: string): Promise<IUser | null> {
    return this.db.users.update({
      where: { id },
      data: {
        state: 'active' as any,
        activated_at: new Date(),
        profile_completed: true
      }
    }) as any;
  }

  async findByUsernamePrefixWithProfile(usernamePrefix: string): Promise<any | null> {
    return this.db.users.findFirst({
      where: {
        primary_email: {
          startsWith: `${usernamePrefix}@`
        }
      },
      include: {
        profiles: true,
        profile_links: true,
      }
    });
  }

  async findAll(filter?: any): Promise<any[]> {
    return this.db.users.findMany({
      where: filter || {}
    });
  }

  async findOne(filter?: any): Promise<any | null> {
    return this.db.users.findFirst({
      where: filter
    });
  }

  async getUserState(userId: string): Promise<string | null> {
    const row = await this.db.users.findUnique({
      where: { id: userId },
      select: { state: true }
    });
    return row?.state || null;
  }
}

