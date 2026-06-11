import { Request, Response } from 'express';
import { FormService } from '../services/FormService';

const formService = new FormService();

export class FormController {
  async createForm(req: Request, res: Response) {
    try {
      const form = await formService.createForm(req.body);
      res.status(201).json(form);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getForm(req: Request, res: Response) {
    try {
      const form = await formService.getForm(req.params.id);
      if (!form) return res.status(404).json({ error: 'Form not found' });
      res.json(form);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async addField(req: Request, res: Response) {
    try {
      const field = await formService.addField(req.params.id, req.body);
      res.status(201).json(field);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getFields(req: Request, res: Response) {
    try {
      const fields = await formService.getFields(req.params.id);
      res.json(fields);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async submitResponse(req: Request, res: Response) {
    try {
      const response = await formService.submitResponse(req.body);
      res.status(201).json(response);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getResponses(req: Request, res: Response) {
    try {
      const responses = await formService.getResponses(req.params.id);
      res.json(responses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
