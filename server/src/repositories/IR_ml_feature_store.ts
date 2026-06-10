export interface IMlFeatureStore {
  row_id?: string;
  bu_id: string;
  entity_type: string;
  entity_id: string;
  feature_name: string;
  feature_value: Record<string, unknown>;

  created?: Date;
  created_by?: string | null;
  last_upd?: Date;
  last_upd_by?: string | null;
  modification_num?: number;
  conflict_id?: string;
  db_last_upd?: Date;
  db_last_upd_src?: string;
}

export interface IR_ml_feature_store {
  create(feature: IMlFeatureStore): Promise<IMlFeatureStore>;
  getById(rowId: string): Promise<IMlFeatureStore | null>;
  getByEntityAndFeature(entityType: string, entityId: string, featureName: string): Promise<IMlFeatureStore | null>;
  getByEntity(entityType: string, entityId: string): Promise<IMlFeatureStore[]>;
  getAll(buId: string): Promise<IMlFeatureStore[]>;
  update(rowId: string, feature: Partial<IMlFeatureStore>): Promise<IMlFeatureStore | null>;
  delete(rowId: string): Promise<boolean>;
}
