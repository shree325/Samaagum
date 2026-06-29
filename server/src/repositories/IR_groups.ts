import { IBaseRepository } from "./IBaseRepository";

export interface IGroup {
    entity_id: string;
    name: string;
    slug: string | null;
    description?: string | null;
    category?: string | null;
    icon?: string | null;
    cover?: string | null;
    banner?: string | null;
    join_mode: 'open' | 'approval' | 'invite_only';
    join_form_id?: string | null;
    listed: 'listed' | 'unlisted';
}

export interface IR_groups extends IBaseRepository<IGroup> {
    findBySlug(slug: string): Promise<IGroup | null>;
    getPublicGroups(): Promise<IGroup[]>;
}
