import pool from '../config/database';
import { R_forms } from '../repositories/R_forms';
import { R_formFields } from '../repositories/R_formFields';
import { R_formResponses } from '../repositories/R_formResponses';
import { R_formResponseValues } from '../repositories/R_formResponseValues';

export class FormService {
  private formRepo: R_forms;
  private fieldRepo: R_formFields;
  private responseRepo: R_formResponses;
  private valueRepo: R_formResponseValues;

  constructor() {
    this.formRepo = new R_forms(pool);
    this.fieldRepo = new R_formFields(pool);
    this.responseRepo = new R_formResponses(pool);
    this.valueRepo = new R_formResponseValues(pool);
  }

  async createForm(data: { tenant_id: string; owner_entity_id: string; purpose: string }) {
    return this.formRepo.create(data);
  }

  async getForm(id: string) {
    return this.formRepo.getById(id);
  }

  async addField(formId: string, field: { field_type: string; label: string; required?: boolean; options?: any; position?: number }) {
    return this.fieldRepo.create({ form_id: formId, ...field });
  }

  async getFields(formId: string) {
    return this.fieldRepo.findAll({ form_id: formId });
  }

  async submitResponse(data: { tenant_id: string; form_id: string; respondent_user_id?: string; context_ref?: string; values: { field_id: string; value: any }[] }) {
    const response = await this.responseRepo.create({
      tenant_id: data.tenant_id,
      form_id: data.form_id,
      respondent_user_id: data.respondent_user_id,
      context_ref: data.context_ref,
    });

    for (const v of data.values) {
      await this.valueRepo.create({
        response_id: response.id,
        field_id: v.field_id,
        value: v.value,
      });
    }

    return response;
  }

  async getResponses(formId: string) {
    return this.responseRepo.findAll({ form_id: formId });
  }
}
