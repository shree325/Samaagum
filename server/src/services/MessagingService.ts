import pool from '../config/database';
import { R_conversations } from '../repositories/R_conversations';
import { R_messages } from '../repositories/R_messages';
import { R_conversationParticipants } from '../repositories/R_conversationParticipants';

export class MessagingService {
  private convRepo: R_conversations;
  private msgRepo: R_messages;
  private participantRepo: R_conversationParticipants;

  constructor() {
    this.convRepo = new R_conversations(pool);
    this.msgRepo = new R_messages(pool);
    this.participantRepo = new R_conversationParticipants(pool);
  }

  async createConversation(data: { tenant_id: string; type?: string; created_by: string; participant_ids: string[] }) {
    const conv = await this.convRepo.create({
      tenant_id: data.tenant_id,
      type: data.type || 'dm',
      created_by: data.created_by,
    });

    for (const uid of data.participant_ids) {
      await this.participantRepo.create({
        conversation_id: conv.id,
        user_id: uid,
        role: uid === data.created_by ? 'owner' : 'member',
      });
    }

    return conv;
  }

  async sendMessage(data: { tenant_id: string; conversation_id: string; sender_user_id: string; body: string }) {
    return this.msgRepo.create(data);
  }

  async getConversations(userId: string) {
    return this.participantRepo.findAll({ user_id: userId });
  }

  async getMessages(conversationId: string) {
    return this.msgRepo.findAll({ conversation_id: conversationId });
  }
}
