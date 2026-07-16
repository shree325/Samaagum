import { EventExportService } from '../services/EventExportService';
import { EventService } from '../services/EventService';
import prisma from '../config/prisma';

export class EventExportController {
  
  static async summary(request: any, reply: any) {
    try {
      if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
      const { id } = request.params as any;
      const isAdmin = await EventService.verifyEventAdmin(request.user.id, id);
      if (!isAdmin) return reply.status(403).send({ success: false, message: 'Forbidden' });

      const summary = await EventExportService.getExportSummary(id);
      if (!summary) return reply.status(404).send({ success: false, message: 'Event not found' });

      return reply.send({ success: true, data: summary });
    } catch (e: any) {
      request.server.log.error(e, 'Export summary failed');
      return reply.status(500).send({ success: false, message: 'Failed to fetch export summary' });
    }
  }

  static async export(request: any, reply: any) {
    try {
      if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
      const { id } = request.params as any;
      const { type, filter, format } = request.query as any;

      if (format !== 'csv') {
        return reply.status(400).send({ success: false, message: 'Only csv format is supported currently.' });
      }

      const isAdmin = await EventService.verifyEventAdmin(request.user.id, id);
      if (!isAdmin) return reply.status(403).send({ success: false, message: 'Forbidden' });

      const event = await prisma.events.findUnique({
        where: { id },
        include: { ticket_types: true }
      });
      if (!event) return reply.status(404).send({ success: false, message: 'Event not found' });

      const tz = (event.settings as any)?.timezone || 'UTC';
      const eventNameSafe = event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${eventNameSafe}_${type}_${dateStr}.csv`;

      let generator: AsyncGenerator<string>;
      
      switch(type) {
        case 'ticketSales':
        case 'ticket-sales':
          generator = EventExportService.exportTicketSales(id);
          break;
        case 'attendees':
          generator = EventExportService.exportAttendees(id, tz);
          break;
        case 'approvals':
          generator = EventExportService.exportApprovals(id, tz);
          break;
        case 'waitlist':
          generator = EventExportService.exportWaitlist(id, tz);
          break;
        case 'checkins':
          generator = EventExportService.exportCheckins(id, tz);
          break;
        case 'customFields':
        case 'custom-fields':
          generator = EventExportService.exportCustomFields(id, filter || 'confirmed', tz);
          break;
        case 'revenue':
          const isFree = !event.ticket_types.some((t: any) => t.price_amount_minor && Number(t.price_amount_minor) > 0);
          if (isFree) return reply.status(409).send({ success: false, message: 'Revenue export is not applicable for free events.' });
          generator = EventExportService.exportRevenue(id, tz);
          break;
        default:
          return reply.status(400).send({ success: false, message: 'Invalid export type.' });
      }

      // Log the export action
      await prisma.audit_log.create({
        data: {
          tenant_id: event.tenant_id,
          actor_user_id: request.user.id,
          action: 'event_data_export',
          target_type: 'events',
          target_id: id,
          after: { exportType: type, format, filter, ip: request.ip }
        }
      });

      // Stream the response
      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      
      const stream = require('stream');
      const readable = new stream.Readable({
        read() {}
      });

      // Push BOM
      readable.push('\uFEFF');

      // Process generator async
      (async () => {
        try {
          for await (const chunk of generator) {
            readable.push(chunk);
          }
          readable.push(null); // End stream
        } catch (err) {
          request.server.log.error(err, 'CSV generation error');
          readable.destroy(err as Error);
        }
      })();

      return reply.send(readable);

    } catch (e: any) {
      request.server.log.error(e, 'Export generation failed');
      return reply.status(500).send({ success: false, message: 'Failed to generate export' });
    }
  }
}
