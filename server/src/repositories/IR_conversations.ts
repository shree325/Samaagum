import { IBaseRepository } from './IBaseRepository';

export interface IConversation {
  conversation_id?: string;
  created_by_user_id?: string | null;
  event_id?: string | null;
  type?: string;
  status?: string;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_conversations extends IBaseRepository<IConversation> {
  findByUserId(userId: string): Promise<IConversation[]>;
  findByEventId(eventId: string): Promise<IConversation[]>;
}
