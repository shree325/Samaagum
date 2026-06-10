import { IBaseRepository } from './IBaseRepository';

export interface IMessage {
  message_id?: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  deleted_at?: Date | null;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_messages extends IBaseRepository<IMessage> {
  findByConversationId(conversationId: string): Promise<IMessage[]>;
  findBySenderUserId(senderUserId: string): Promise<IMessage[]>;
}
