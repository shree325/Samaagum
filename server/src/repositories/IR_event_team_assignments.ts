export interface IEventTeamAssignment {
  id?: string;
  tenant_id: string;

  event_id: string;
  user_id: string;
  role_id: string;
  granted_by?: string | null;

  assigned_at?: Date;
  expires_at?: Date | null;
  revoked_at?: Date | null;

  status?: string;
  notes?: string | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_event_team_assignments {
  create(assignment: IEventTeamAssignment): Promise<IEventTeamAssignment>;
  getById(id: string): Promise<IEventTeamAssignment | null>;
  getByEventId(eventId: string): Promise<IEventTeamAssignment[]>;
  getByUserId(userId: string): Promise<IEventTeamAssignment[]>;
  getAll(): Promise<IEventTeamAssignment[]>;
  update(id: string, assignment: Partial<IEventTeamAssignment>): Promise<IEventTeamAssignment | null>;
  delete(id: string): Promise<boolean>;
}
