import { PrismaClient } from "@prisma/client";
import { IKycReviews, IR_kyc_reviews } from "./IR_kyc_reviews";

export class R_kyc_reviews implements IR_kyc_reviews {
  constructor(private db: PrismaClient) {}

  async create(data: IKycReviews): Promise<IKycReviews> {
    return this.db.kyc_reviews.create({ data: data as any }) as any;
  }

  async getById(row_id: string): Promise<IKycReviews | null> {
    return this.db.kyc_reviews.findUnique({
      where: { id: row_id }
    }) as any;
  }

  async getAll(): Promise<IKycReviews[]> {
    return this.db.kyc_reviews.findMany() as any;
  }

  async update(row_id: string, data: Partial<IKycReviews>): Promise<IKycReviews | null> {
    return this.db.kyc_reviews.update({
      where: { id: row_id },
      data: data as any
    }) as any;
  }

  async delete(row_id: string): Promise<boolean> {
    try {
      await this.db.kyc_reviews.delete({
        where: { id: row_id }
      });
      return true;
    } catch {
      return false;
    }
  }
}
