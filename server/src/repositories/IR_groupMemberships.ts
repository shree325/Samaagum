import { IBaseRepository } from "./IBaseRepository";

export interface IGroupMembership {
    id?: string;
    group_id: string;
    user_id: string;
    state: 'pending' | 'active' | 'rejected' | 'left' | 'removed';
    joined_at?: Date | null;
    form_response_id?: string | null;
    invited_by_user_id?: string | null;
    responded_at?: Date | null;
}

export interface IR_groupMemberships extends IBaseRepository<IGroupMembership> {
    joinGroup(membership: IGroupMembership): Promise<IGroupMembership>;
    leaveGroup(groupId: string, userId: string): Promise<boolean>;
    approveMembership(groupId: string, userId: string): Promise<IGroupMembership | null>;
    rejectMembership(groupId: string, userId: string): Promise<IGroupMembership | null>;
    getGroupMembers(groupId: string): Promise<IGroupMembership[]>;
    getUserGroups(userId: string): Promise<IGroupMembership[]>;
    isMember(groupId: string, userId: string): Promise<boolean>;
}
