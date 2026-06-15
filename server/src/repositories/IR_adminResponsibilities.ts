import { IBaseRepository } from "./IBaseRepository";

export interface IAdminResponsibility {
    id?: string;
    name: string;
    display_name: string;
    description?: string | null;
    category: string;
    route_path: string;
    component_name: string;
    icon_name: string;
    is_active: boolean;
    required_features: string[];
    sort_order: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface IR_adminResponsibilities extends IBaseRepository<IAdminResponsibility> {
    findByCategory(category: string): Promise<IAdminResponsibility[]>;
    findActive(): Promise<IAdminResponsibility[]>;
    findByIds(ids: string[]): Promise<IAdminResponsibility[]>;
}
