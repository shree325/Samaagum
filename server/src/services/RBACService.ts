import { R_roles } from '../repositories/R_roles';
import { R_roleAssignments } from '../repositories/R_roleAssignments';
import { IRole } from '../repositories/IR_roles';
import { IRoleAssignment } from '../repositories/IR_roleAssignments';

export class RBACService {
    private roleRepo: R_roles;
    private assignmentRepo: R_roleAssignments;

    constructor() {
        this.roleRepo = new R_roles();
        this.assignmentRepo = new R_roleAssignments();
    }

    async createRole(role: Partial<IRole>): Promise<IRole> {
        return this.roleRepo.create(role);
    }

    async assignRole(userId: string, roleId: string, scopeEntityId: string, grantedBy?: string): Promise<IRoleAssignment> {
        return this.assignmentRepo.assignRole({
            user_id: userId,
            role_id: roleId,
            scope_entity_id: scopeEntityId,
            granted_by_user_id: grantedBy || null
        });
    }

    async removeRole(userId: string, roleId: string, scopeEntityId: string): Promise<boolean> {
        return this.assignmentRepo.removeRole(userId, roleId, scopeEntityId);
    }

    async getUserRoles(userId: string): Promise<IRoleAssignment[]> {
        return this.assignmentRepo.getUserRoles(userId);
    }

    async hasPermission(userId: string, roleKey: string, scopeEntityId: string): Promise<boolean> {
        const role = await this.roleRepo.findByKey(roleKey);
        if (!role || !role.role_id) return false;

        return this.assignmentRepo.hasRole(userId, role.role_id, scopeEntityId);
    }
}
