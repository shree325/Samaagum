export interface IKycSubmissions {
  row_id?: string;
  [key: string]: any;
}

export interface IR_kyc_submissions {
  create(data: IKycSubmissions): Promise<IKycSubmissions>;
  getById(row_id: string): Promise<IKycSubmissions | null>;
  getAll(): Promise<IKycSubmissions[]>;
  update(row_id: string, data: Partial<IKycSubmissions>): Promise<IKycSubmissions | null>;
  delete(row_id: string): Promise<boolean>;
}
