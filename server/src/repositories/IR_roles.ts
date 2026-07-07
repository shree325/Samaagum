import { IBaseRepository } from "./IBaseRepository";

export interface IRole {
    role_id?: string;
    key: string;
    name: string;
    level: number;
    phase?: string | null;
    is_reserved: boolean;
    description?: string | null;
    created_at?: Date;
    updated_at?: Date;
}

export interface IR_roles extends IBaseRepository<IRole> {
    findByKey(key: string): Promise<IRole | null>;
    getRoleKey(roleId: string): Promise<string | null>;
    getBaselineCapabilitiesByKey(key: string): Promise<any | null>;
}

