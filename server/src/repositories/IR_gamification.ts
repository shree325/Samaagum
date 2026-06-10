export interface IGamification {
  row_id?: string;
  bu_id: string;
  user_id: string;

  points: number;
  level: number;
  badge_count: number;
  x_data?: Record<string, unknown> | null;

  created?: Date;
  created_by?: string | null;
  last_upd?: Date;
  last_upd_by?: string | null;
  modification_num?: number;
  conflict_id?: string;
  db_last_upd?: Date;
  db_last_upd_src?: string;
}

export interface IR_gamification {
  create(gamification: IGamification): Promise<IGamification>;
  getById(rowId: string): Promise<IGamification | null>;
  getByUserId(userId: string): Promise<IGamification | null>;
  getAll(buId: string): Promise<IGamification[]>;
  update(rowId: string, gamification: Partial<IGamification>): Promise<IGamification | null>;
  delete(rowId: string): Promise<boolean>;
}
