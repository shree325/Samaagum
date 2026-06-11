import { PrismaClient } from "@prisma/client";
import { IKycSubmissions, IR_kyc_submissions } from "./IR_kyc_submissions";

export class R_kyc_submissions implements IR_kyc_submissions {
  constructor(private db: PrismaClient) {}

  async create(data: IKycSubmissions): Promise<IKycSubmissions> {
    return this.db.kyc_submissions.create({ data: data as any }) as any;
  }

  async getById(row_id: string): Promise<IKycSubmissions | null> {
    return this.db.kyc_submissions.findUnique({
      where: { id: row_id }
    }) as any;
  }

  async getAll(): Promise<IKycSubmissions[]> {
    return this.db.kyc_submissions.findMany() as any;
  }

  async update(row_id: string, data: Partial<IKycSubmissions>): Promise<IKycSubmissions | null> {
    return this.db.kyc_submissions.update({
      where: { id: row_id },
      data: data as any
    }) as any;
  }

  async delete(row_id: string): Promise<boolean> {
    try {
      await this.db.kyc_submissions.delete({
        where: { id: row_id }
      });
      return true;
    } catch {
      return false;
    }
  }
}
