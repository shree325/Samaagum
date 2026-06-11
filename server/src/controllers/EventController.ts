import { Request, Response } from 'express';
import { EventService } from '../services/EventService';

const eventService = new EventService();

export class EventController {
  async create(req: Request, res: Response) {
    try {
      const event = await eventService.create(req.body);
      res.status(201).json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const event = await eventService.getById(req.params.id);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getByHostEntity(req: Request, res: Response) {
    try {
      const events = await eventService.getByHostEntity(req.params.entityId);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPublished(req: Request, res: Response) {
    try {
      const events = await eventService.getPublished(req.params.tenantId);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const event = await eventService.update(req.params.id, req.body);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async publish(req: Request, res: Response) {
    try {
      const event = await eventService.publish(req.params.id);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const event = await eventService.cancel(req.params.id);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteEvent(req: Request, res: Response) {
    try {
      const success = await eventService.delete(req.params.id);
      if (!success) return res.status(404).json({ error: 'Event not found' });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
