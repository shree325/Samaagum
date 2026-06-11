import pool from '../config/database';
import { R_connections } from '../repositories/R_connections';

export class ConnectionService {
  private connRepo: R_connections;
  constructor() { this.connRepo = new R_connections(pool); }

  async sendRequest(data: { tenant_id: string; requester_user_id: string; addressee_user_id: string }) {
    return this.connRepo.create({ ...data, state: 'requested' });
  }

  async accept(id: string) { return this.connRepo.update(id, { state: 'accepted' }); }
  async decline(id: string) { return this.connRepo.update(id, { state: 'declined' }); }
  async block(id: string) { return this.connRepo.update(id, { state: 'blocked' }); }

  async getConnections(userId: string) {
    return this.connRepo.findAll({ requester_user_id: userId });
  }
}
