import { PrismaClient } from '@prisma/client';
import type { event_kind, event_status, location_type, registration_mode } from '@prisma/client';
import { IEvent, IR_events } from './IR_events';

export class R_events implements IR_events {
  constructor(private prisma: PrismaClient) {}

  async create(event: IEvent): Promise<IEvent> {
    const result = await this.prisma.events.create({
      data: {
        tenant_id: event.tenant_id,
        hosted_by_entity_id: event.hosted_by_entity_id,
        parent_event_id: event.parent_event_id,
        event_kind: (event.event_kind as event_kind) ?? 'standalone',
        title: event.title,
        description: event.description,
        status: (event.status as event_status) ?? 'draft',
        starts_at: event.starts_at ? new Date(event.starts_at) : null,
        ends_at: event.ends_at ? new Date(event.ends_at) : null,
        venue_timezone: event.venue_timezone,
        location_type: (event.location_type as location_type) ?? 'venue',
        venue: event.venue ? (event.venue as any) : null,
        online_link: event.online_link,
        capacity_total: event.capacity_total,
        registration_mode: (event.registration_mode as registration_mode) ?? 'paid',
        approval_required: event.approval_required ?? false,
        registration_form_id: event.registration_form_id,
        cash_enabled: event.cash_enabled ?? false,
        financial_locked_at: event.financial_locked_at ? new Date(event.financial_locked_at) : null,
      }
    });
    return result as unknown as IEvent;
  }

  async getById(id: string): Promise<IEvent | null> {
    const result = await this.prisma.events.findUnique({ where: { id } });
    return result as unknown as IEvent | null;
  }

  async getByHostEntity(entityId: string): Promise<IEvent[]> {
    const result = await this.prisma.events.findMany({
      where: { hosted_by_entity_id: entityId },
      orderBy: { starts_at: 'desc' }
    });
    return result as unknown as IEvent[];
  }

  async getByStatus(tenantId: string, status: string): Promise<IEvent[]> {
    const result = await this.prisma.events.findMany({
      where: {
        tenant_id: tenantId,
        status: status as event_status
      },
      orderBy: { starts_at: 'desc' }
    });
    return result as unknown as IEvent[];
  }

  async getAll(tenantId: string): Promise<IEvent[]> {
    const result = await this.prisma.events.findMany({
      where: { tenant_id: tenantId },
      orderBy: { starts_at: 'desc' }
    });
    return result as unknown as IEvent[];
  }

  async update(id: string, event: Partial<IEvent>): Promise<IEvent | null> {
    const result = await this.prisma.events.update({
      where: { id },
      data: {
        title: event.title,
        description: event.description,
        status: event.status as event_status | undefined,
        starts_at: event.starts_at ? new Date(event.starts_at) : undefined,
        ends_at: event.ends_at ? new Date(event.ends_at) : undefined,
        capacity_total: event.capacity_total,
        cash_enabled: event.cash_enabled,
        registration_mode: event.registration_mode as registration_mode | undefined,
        approval_required: event.approval_required,
        location_type: event.location_type as location_type | undefined,
        venue: event.venue !== undefined ? (event.venue as any) : undefined,
        online_link: event.online_link,
      }
    });
    return result as unknown as IEvent | null;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.events.delete({ where: { id } });
      return true;
    } catch (e) {
      return false;
    }
  }
}