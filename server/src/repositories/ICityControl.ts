// ─── ICityControl ─────────────────────────────────────────────────────
// TypeScript interface for the city_controls table
// Uses raw SQL — NOT a Prisma model (GeoLite tables use CIDR/GIST)

export interface ICityControl {
  geoname_id: number;
  city_name: string;
  state_name: string | null;
  country_name: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  timezone: string | null;
  is_active: boolean;
  created_at: Date;
  created_by: string | null;
  updated_at: Date;
  updated_by: string | null;
  modification_num: number;
}

export interface ICityControlListOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  state?: string;
  country?: string;
  sort?: 'city_name' | 'state_name' | 'country_name';
  order?: 'asc' | 'desc';
}

export interface ICityControlListResult {
  data: ICityControl[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
