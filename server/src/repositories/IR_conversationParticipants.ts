import { IBaseRepository } from './IBaseRepository';

export interface IConversationParticipant {
  id?: string;
  conversation_id: string;
  user_id: string;
  role?: string;
  last_read_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_conversationParticipants extends IBaseRepository<IConversationParticipant> {
  findByConversationId(conversationId: string): Promise<IConversationParticipant[]>;
  findByUserId(userId: string): Promise<IConversationParticipant[]>;
  findParticipants(userId: string): Promise<any[]>;
  findOtherParticipants(conversationId: string, userId: string): Promise<any[]>;
}
