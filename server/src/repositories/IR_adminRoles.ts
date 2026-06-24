import { IBaseRepository } from "./IBaseRepository";

export interface IAdminRole {
    id?: string;
    name: string;
    display_name: string;
    description?: string | null;
    tenant_id?: string | null;
    is_system_role: boolean;
    is_active: boolean;
    is_default: boolean;
    hierarchy_level: number;
    responsibility_ids: string[];
    default_position_id?: string | null;
    created_by?: string | null;
    created_at?: Date;
    updated_at?: Date;
}

export interface IR_adminRoles extends IBaseRepository<IAdminRole> {
    findByTenant(tenantId: string | null): Promise<IAdminRole[]>;
    findDefault(tenantId?: string | null): Promise<IAdminRole | null>;
    countUsersWithRole(roleId: string): Promise<number>;
    clearDefaultForTenant(excludeRoleId: string, tenantId: string | null): Promise<void>;
}
