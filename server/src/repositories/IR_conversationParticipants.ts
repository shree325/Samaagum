import { IBaseRepository } from './IBaseRepository';

export interface IConversationParticipant {
  participant_id?: string;
  conversation_id: string;
  user_id: string;
  role?: string;
  last_read_at?: Date | null;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_conversationParticipants extends IBaseRepository<IConversationParticipant> {
  findByConversationId(conversationId: string): Promise<IConversationParticipant[]>;
  findByUserId(userId: string): Promise<IConversationParticipant[]>;
}
