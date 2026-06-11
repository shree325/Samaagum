export interface ISupportCases {
  row_id?: string;
  [key: string]: any;
}

export interface IR_support_cases {
  create(data: ISupportCases): Promise<ISupportCases>;
  getById(row_id: string): Promise<ISupportCases | null>;
  getAll(): Promise<ISupportCases[]>;
  update(row_id: string, data: Partial<ISupportCases>): Promise<ISupportCases | null>;
  delete(row_id: string): Promise<boolean>;
}
