import { R_groups } from '../repositories/R_groups';
import { R_groupMemberships } from '../repositories/R_groupMemberships';
import { IGroup } from '../repositories/IR_groups';
import { IGroupMembership } from '../repositories/IR_groupMemberships';

export class GroupService {
    private groupRepo: R_groups;
    private membershipRepo: R_groupMemberships;

    constructor() {
        this.groupRepo = new R_groups();
        this.membershipRepo = new R_groupMemberships();
    }

    async createGroup(group: Partial<IGroup>): Promise<IGroup> {
        return this.groupRepo.create(group as IGroup);
    }

    async joinGroup(groupId: string, userId: string, state: 'active' | 'pending' | 'rejected' | 'left' | 'removed' = 'pending'): Promise<IGroupMembership> {
        return this.membershipRepo.joinGroup({
            group_id: groupId,
            user_id: userId,
            state,
        } as IGroupMembership);
    }

    async leaveGroup(groupId: string, userId: string): Promise<boolean> {
        return this.membershipRepo.leaveGroup(groupId, userId);
    }

    async approveMembership(groupId: string, userId: string): Promise<IGroupMembership | null> {
        return this.membershipRepo.approveMembership(groupId, userId);
    }

    async rejectMembership(groupId: string, userId: string): Promise<IGroupMembership | null> {
        return this.membershipRepo.rejectMembership(groupId, userId);
    }

    async listMembers(groupId: string): Promise<IGroupMembership[]> {
        return this.membershipRepo.getGroupMembers(groupId);
    }
}
