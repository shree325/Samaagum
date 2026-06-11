export interface IKycReviews {
  row_id?: string;
  [key: string]: any;
}

export interface IR_kyc_reviews {
  create(data: IKycReviews): Promise<IKycReviews>;
  getById(row_id: string): Promise<IKycReviews | null>;
  getAll(): Promise<IKycReviews[]>;
  update(row_id: string, data: Partial<IKycReviews>): Promise<IKycReviews | null>;
  delete(row_id: string): Promise<boolean>;
}
