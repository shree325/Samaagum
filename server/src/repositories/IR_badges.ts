export interface IBadges {
  row_id?: string;
  [key: string]: any;
}

export interface IR_badges {
  create(data: IBadges): Promise<IBadges>;
  getById(row_id: string): Promise<IBadges | null>;
  getAll(): Promise<IBadges[]>;
  update(row_id: string, data: Partial<IBadges>): Promise<IBadges | null>;
  delete(row_id: string): Promise<boolean>;
}
