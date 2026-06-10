import { IBaseRepository } from "./IBaseRepository";

export interface IGroup {
    entity_id: string;
    name: string;
    slug: string;
    join_mode: 'open' | 'approval_required' | 'invite_only';
    join_form_id?: string | null;
    listed: boolean;
    subtype: 'community' | 'org' | 'group';
    scope: 'public' | 'private';
    created_at?: Date;
    updated_at?: Date;
}

export interface IR_groups extends IBaseRepository<IGroup> {
    findBySlug(slug: string): Promise<IGroup | null>;
    getPublicGroups(): Promise<IGroup[]>;
}
