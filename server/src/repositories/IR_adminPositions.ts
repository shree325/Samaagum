import { IBaseRepository } from "./IBaseRepository";

export interface IAdminPosition {
    id?: string;
    name: string;
    display_name: string;
    description?: string | null;
    hierarchy_level: number;
    data_access_level: string;
    custom_conditions: object[];
    is_active: boolean;
    data_access_limits: object;
    created_at?: Date;
    updated_at?: Date;
}

export interface IR_adminPositions extends IBaseRepository<IAdminPosition> {
    findActive(): Promise<IAdminPosition[]>;
}
