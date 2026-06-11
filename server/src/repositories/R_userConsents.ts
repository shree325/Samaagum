import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IUserConsent, IR_userConsents } from './IR_userConsents';
import prisma from '../config/prisma';

export class R_userConsents extends PostgresBaseRepository<IUserConsent> implements IR_userConsents {
  constructor() {
    super('user_consents', 'consent_id');
  }

  async findByUserId(userId: string): Promise<IUserConsent[]> {
    const query = `SELECT * FROM user_consents WHERE user_id = $1`;
    const { rows } = await prisma.query(query, [userId]);
    return rows;
  }

  async findByConsentType(consentType: string): Promise<IUserConsent[]> {
    const query = `SELECT * FROM user_consents WHERE consent_type = $1`;
    const { rows } = await prisma.query(query, [consentType]);
    return rows;
  }
}
