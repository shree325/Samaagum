export interface ICollaborationMember {
  id?: string;
  tenant_id: string;

  collaboration_entity_id: string;
  user_id: string;

  role?: string;
  state?: string;

  joined_at?: Date;
  invited_by?: string | null;
  left_at?: Date | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_collaboration_members {
  create(member: ICollaborationMember): Promise<ICollaborationMember>;
  getById(id: string): Promise<ICollaborationMember | null>;
  getByCollaborationEntityId(collabEntityId: string): Promise<ICollaborationMember[]>;
  getByUserId(userId: string): Promise<ICollaborationMember[]>;
  getAll(): Promise<ICollaborationMember[]>;
  update(id: string, member: Partial<ICollaborationMember>): Promise<ICollaborationMember | null>;
  delete(id: string): Promise<boolean>;
}
