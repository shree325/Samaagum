export interface IUserBadges {
  row_id?: string;
  [key: string]: any;
}

export interface IR_user_badges {
  create(data: IUserBadges): Promise<IUserBadges>;
  getById(row_id: string): Promise<IUserBadges | null>;
  getAll(): Promise<IUserBadges[]>;
  update(row_id: string, data: Partial<IUserBadges>): Promise<IUserBadges | null>;
  delete(row_id: string): Promise<boolean>;
}
