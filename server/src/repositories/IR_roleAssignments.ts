import { IBaseRepository } from "./IBaseRepository";

export interface IRoleAssignment {
    id?: string;
    user_id: string;
    role_id: string;
    scope_entity_id: string;
    granted_by_user_id?: string | null;
    assigned_at?: Date;
    expires_at?: Date | null;
}

export interface IR_roleAssignments extends IBaseRepository<IRoleAssignment> {
    assignRole(assignment: IRoleAssignment): Promise<IRoleAssignment>;
    removeRole(userId: string, roleId: string, scopeEntityId: string): Promise<boolean>;
    getUserRoles(userId: string): Promise<IRoleAssignment[]>;
    getEntityRoles(scopeEntityId: string): Promise<IRoleAssignment[]>;
    hasRole(userId: string, roleId: string, scopeEntityId: string): Promise<boolean>;
    getActiveRoleAssignment(userId: string): Promise<string | null>;
    getPlatformRoleKeysForUser(userId: string): Promise<string[]>;
    getDirectAssignments(userId: string, targetEntityId: string): Promise<any[]>;
    deletePlatformRoleAssignments(userId: string): Promise<void>;
    assignPlatformRole(tenantId: string, userId: string, roleId: string): Promise<void>;
}


