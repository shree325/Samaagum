import { IBaseRepository } from './IBaseRepository';

export interface IConversation {
  id?: string;
  created_by?: string | null;
  event_id?: string | null;
  type?: string;
  status?: string;
  title?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_conversations extends IBaseRepository<IConversation> {
  findByUserId(userId: string): Promise<IConversation[]>;
  findByEventId(eventId: string): Promise<IConversation[]>;
  findWithParticipants(conversationIds: string[]): Promise<any[]>;
  findDMBetweenUsers(user1: string, user2: string): Promise<any>;
  createDM(creatorId: string, targetId: string): Promise<any>;
  createGroupConversation(creatorId: string, title: string, participantIds: string[]): Promise<any>;
  updateUpdatedAt(conversationId: string): Promise<void>;
}
