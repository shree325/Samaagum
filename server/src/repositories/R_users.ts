import { PrismaClient } from '@prisma/client';
import type { user_state } from '@prisma/client';
import { IUser, IR_users } from './IR_users';

export class R_users implements IR_users {
  constructor(private prisma: PrismaClient) {}

  async create(user: IUser): Promise<IUser> {
    const result = await this.prisma.users.create({
      data: {
        tenant_id: user.tenant_id,
        primary_email: user.primary_email,
        email_verified: user.email_verified ?? false,
        state: (user.state as user_state) ?? 'provisional',
        locale: user.locale ?? 'en',
        preferred_currency: user.preferred_currency,
        gender: user.gender,
        dob: user.dob ? new Date(user.dob) : null,
        phone_e164: user.phone_e164,
        profile_completed: user.profile_completed ?? false,
      }
    });
    return result as unknown as IUser;
  }

  async getById(id: string): Promise<IUser | null> {
    const result = await this.prisma.users.findUnique({ where: { id } });
    return result as unknown as IUser | null;
  }

  async getByEmail(tenantId: string, email: string): Promise<IUser | null> {
    const result = await this.prisma.users.findUnique({
      where: {
        tenant_id_primary_email: {
          tenant_id: tenantId,
          primary_email: email
        }
      }
    });
    return result as unknown as IUser | null;
  }

  async getByTenant(tenantId: string): Promise<IUser[]> {
    const result = await this.prisma.users.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' }
    });
    return result as unknown as IUser[];
  }

  async update(id: string, user: Partial<IUser>): Promise<IUser | null> {
    const result = await this.prisma.users.update({
      where: { id },
      data: {
        primary_email: user.primary_email,
        email_verified: user.email_verified,
        state: user.state as user_state | undefined,
        locale: user.locale,
        preferred_currency: user.preferred_currency,
        gender: user.gender,
        dob: user.dob ? new Date(user.dob) : undefined,
        phone_e164: user.phone_e164,
        profile_completed: user.profile_completed,
      }
    });
    return result as unknown as IUser | null;
  }

  async softDelete(id: string): Promise<IUser | null> {
    const result = await this.prisma.users.update({
      where: { id },
      data: {
        state: 'deleted',
        deleted_at: new Date()
      }
    });
    return result as unknown as IUser | null;
  }

  async activate(id: string): Promise<IUser | null> {
    const result = await this.prisma.users.update({
      where: { id },
      data: {
        state: 'active',
        activated_at: new Date(),
        profile_completed: true
      }
    });
    return result as unknown as IUser | null;
  }
}
