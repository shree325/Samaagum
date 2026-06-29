import { IBaseRepository } from './IBaseRepository';

export interface IConnection {
  connection_id?: string;
  requester_user_id: string;
  addressee_user_id: string;
  state?: string;
  accepted_at?: Date | null;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_connections extends IBaseRepository<IConnection> {
  findByRequesterId(requesterId: string): Promise<IConnection[]>;
  findByAddresseeId(addresseeId: string): Promise<IConnection[]>;
  countPending(userId: string): Promise<number>;
}

