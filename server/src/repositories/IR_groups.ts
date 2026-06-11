import { IBaseRepository } from "./IBaseRepository";

export interface IGroup {
    entity_id: string;
    join_mode: 'open' | 'approval_required' | 'invite_only';
    join_form_id?: string | null;
    listed: boolean;
    subtype: 'community' | 'org' | 'group';
    created_at?: Date;
    updated_at?: Date;
}

export interface IR_groups extends IBaseRepository<IGroup> {
    findByJoinMode(joinMode: 'open' | 'approval_required' | 'invite_only'): Promise<IGroup[]>;
    getListedGroups(): Promise<IGroup[]>;
}
