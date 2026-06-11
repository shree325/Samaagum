export interface IModerationReports {
  row_id?: string;
  [key: string]: any;
}

export interface IR_moderation_reports {
  create(data: IModerationReports): Promise<IModerationReports>;
  getById(row_id: string): Promise<IModerationReports | null>;
  getAll(): Promise<IModerationReports[]>;
  update(row_id: string, data: Partial<IModerationReports>): Promise<IModerationReports | null>;
  delete(row_id: string): Promise<boolean>;
}
