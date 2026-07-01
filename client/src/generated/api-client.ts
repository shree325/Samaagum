// @ts-nocheck
// Auto-generated type-safe API client for Samaagum Admin Services

class AdminApiClient {
  private apiBase: string;

  constructor(apiBase: string = '') {
    if (!apiBase && typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      this.apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
    } else {
      this.apiBase = apiBase || 'http://localhost:3000';
    }
  }

  private getHeaders(hasBody: boolean = true): HeadersInit {
    const headers: Record<string, string> = {};
    if (hasBody) {
      headers['Content-Type'] = 'application/json';
    }
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('samaagum_admin_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.apiBase}${path}`;
    const hasBody = options.body !== undefined && options.body !== null;
    const headers = {
      ...this.getHeaders(hasBody),
      ...options.headers,
    };
    if (!options.body) {
      delete headers['Content-Type'];
    }
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data as T;
  }

  // ── RBAC endpoints ────────────────────────────────────────────────────────
  public rbac = {
    getRoles: () => this.request<{ success: boolean; data: any[] }>('/api/admin/rbac/roles'),
    
    saveRole: (payload: any, id?: string) => {
      const path = id ? `/api/admin/rbac/roles/${id}` : '/api/admin/rbac/roles';
      const method = id ? 'PUT' : 'POST';
      return this.request<{ success: boolean }> (path, {
        method,
        body: JSON.stringify(payload),
      });
    },

    deleteRole: (id: string) => this.request<{ success: boolean }>(`/api/admin/rbac/roles/${id}`, {
      method: 'DELETE',
    }),

    getResponsibilities: () => this.request<{ success: boolean; data: any[] }>('/api/admin/rbac/responsibilities'),

    saveResponsibility: (payload: any, id?: string) => {
      const path = id ? `/api/admin/rbac/responsibilities/${id}` : '/api/admin/rbac/responsibilities';
      const method = id ? 'PUT' : 'POST';
      return this.request<{ success: boolean }>(path, {
        method,
        body: JSON.stringify(payload),
      });
    },

    deleteResponsibility: (id: string) => this.request<{ success: boolean }>(`/api/admin/rbac/responsibilities/${id}`, {
      method: 'DELETE',
    }),

    getPositions: () => this.request<{ success: boolean; data: any[] }>('/api/admin/rbac/positions'),

    savePosition: (payload: any, id?: string) => {
      const path = id ? `/api/admin/rbac/positions/${id}` : '/api/admin/rbac/positions';
      const method = id ? 'PUT' : 'POST';
      return this.request<{ success: boolean }>(path, {
        method,
        body: JSON.stringify(payload),
      });
    },

    deletePosition: (id: string) => this.request<{ success: boolean }>(`/api/admin/rbac/positions/${id}`, {
      method: 'DELETE',
    }),
  };

  // ── Subscription Plans endpoints ──────────────────────────────────────────
  public plans = {
    getPlans: () => this.request<{ success: boolean; data: { plans: any[] } }>('/api/admin/plans'),
    
    savePlan: (payload: any, id?: string) => {
      const path = id ? `/api/admin/plans/${id}` : '/api/admin/plans';
      const method = id ? 'PUT' : 'POST';
      return this.request<{ success: boolean }>(path, {
        method,
        body: JSON.stringify(payload),
      });
    },

    deletePlan: (id: string) => this.request<{ success: boolean }>(`/api/admin/plans/${id}`, {
      method: 'DELETE',
    }),

    getAvailableRoles: () => this.request<{ success: boolean; data: { roles: any[] } }>('/api/admin/plans/roles/available'),
    getAvailablePositions: () => this.request<{ success: boolean; data: { positions: any[] } }>('/api/admin/plans/positions/available'),
  };

  // ── Coupons endpoints ─────────────────────────────────────────────────────
  public coupons = {
    getCoupons: () => this.request<{ success: boolean; data: { coupons: any[] } }>('/api/admin/coupons'),

    saveCoupon: (payload: any, id?: string) => {
      const path = id ? `/api/admin/coupons/${id}` : '/api/admin/coupons';
      const method = id ? 'PUT' : 'POST';
      return this.request<{ success: boolean }>(path, {
        method,
        body: JSON.stringify(payload),
      });
    },

    deleteCoupon: (id: string) => this.request<{ success: boolean }>(`/api/admin/coupons/${id}`, {
      method: 'DELETE',
    }),
  };

  // ── Categories endpoints ──────────────────────────────────────────────────
  public categories = {
    getCategories: () => this.request<{ success: boolean; data: any[] }>('/api/admin/categories'),

    saveCategory: (payload: any, id?: string) => {
      const path = id ? `/api/admin/categories/${id}` : '/api/admin/categories';
      const method = id ? 'PUT' : 'POST';
      return this.request<{ success: boolean; data: any }>(path, {
        method,
        body: JSON.stringify(payload),
      });
    },

    deleteCategory: (id: string) => this.request<{ success: boolean }>(`/api/admin/categories/${id}`, {
      method: 'DELETE',
    }),
  };

  // ── Tags endpoints ────────────────────────────────────────────────────────
  public tags = {
    getTags: () => this.request<{ success: boolean; data: any[] }>('/api/admin/tags'),

    saveTag: (payload: any, id?: string) => {
      const path = id ? `/api/admin/tags/${id}` : '/api/admin/tags';
      const method = id ? 'PUT' : 'POST';
      return this.request<{ success: boolean; data: any }>(path, {
        method,
        body: JSON.stringify(payload),
      });
    },

    deleteTag: (id: string) => this.request<{ success: boolean }>(`/api/admin/tags/${id}`, {
      method: 'DELETE',
    }),
  };

  // ── Cities endpoints ───────────────────────────────────────────────────────
  public cities = {
    getCities: (params?: { page?: number; limit?: number; search?: string; status?: string; state?: string; country?: string; sort?: string; order?: string }) => {
      const qs = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
      }
      const queryStr = qs.toString();
      return this.request<{ success: boolean; data: any[]; total: number; page: number; limit: number; totalPages: number }>(
        `/api/admin/cities${queryStr ? '?' + queryStr : ''}`
      );
    },

    getStats: () => this.request<{ success: boolean; data: { total: number; active: number; inactive: number; countries: number; states: number } }>('/api/admin/cities/stats'),

    getFilters: (country?: string) => {
      const qs = country ? `?country=${encodeURIComponent(country)}` : '';
      return this.request<{ success: boolean; data: { countries: string[]; states: string[] } }>(`/api/admin/cities/filters${qs}`);
    },

    toggleCity: (geonameId: number, isActive: boolean) => this.request<{ success: boolean; data: any; message: string }>(`/api/admin/cities/${geonameId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

    bulkToggle: (body: { geonameIds?: number[]; state?: string; country?: string; isActive: boolean }) =>
      this.request<{ success: boolean; affected: number; message: string }>('/api/admin/cities/bulk-toggle', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    checkCity: (geonameId: number, entityType?: string) => {
      const qs = entityType ? `?entityType=${entityType}` : '';
      return this.request<{ success: boolean; allowed: boolean; message?: string }>(`/api/admin/cities/check/${geonameId}${qs}`);
    },

    detectLocation: () => this.request<{ success: boolean; data: any }>('/api/admin/cities/detect'),
  };
  // ── Users endpoints ───────────────────────────────────────────────────────
  public users = {
    getUsers: () => this.request<{ success: boolean; data: any[] }>('/api/admin/users'),
    saveUser: (payload: any) => this.request<{ success: boolean }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    deleteUser: (id: string) => this.request<{ success: boolean }>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    }),
    inviteUser: (payload: { email: string; role: string }) => this.request<{ success: boolean }>('/api/admin/users/invite', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  };

  // ── KYC endpoints ─────────────────────────────────────────────────────────
  public kyc = {
    getKycRecords: () => this.request<{ success: boolean; data: any[] }>('/api/admin/kyc'),
    saveKyc: (payload: any) => this.request<{ success: boolean }>('/api/admin/kyc', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  };

  // ── Disputes endpoints ────────────────────────────────────────────────────
  public disputes = {
    getDisputes: () => this.request<{ success: boolean; data: any[] }>('/api/admin/disputes'),
    saveDispute: (payload: any) => this.request<{ success: boolean }>('/api/admin/disputes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  };

  // ── Moderation endpoints ──────────────────────────────────────────────────
  public moderation = {
    getModerationItems: () => this.request<{ success: boolean; data: any[] }>('/api/admin/moderation'),
    saveModeration: (payload: any) => this.request<{ success: boolean }>('/api/admin/moderation', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  };

  // ── Tenants endpoints ─────────────────────────────────────────────────────
  public tenants = {
    getTenants: () => this.request<{ success: boolean; data: any[] }>('/api/admin/tenants'),
    saveTenant: (payload: any) => this.request<{ success: boolean }>('/api/admin/tenants', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  };

  // ── Audit logs endpoints ──────────────────────────────────────────────────
  public audit = {
    getAuditLogs: () => this.request<{ success: boolean; data: any[] }>('/api/admin/audit'),
    addLog: (payload: any) => this.request<{ success: boolean }>('/api/admin/audit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  };

  // ── Feature Flags endpoints ───────────────────────────────────────────────
  public featureFlags = {
    getFeatureFlags: () => this.request<{ success: boolean; data: any[] }>('/api/admin/feature-flags'),
    saveFeatureFlags: (payload: any[]) => this.request<{ success: boolean }>('/api/admin/feature-flags', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  };

  // ── Settings endpoints ────────────────────────────────────────────────────
  public settings = {
    getAuthSettings: () => this.request<{ success: boolean; data: any }>('/api/admin/settings/auth'),
    saveAuthSettings: (payload: any) => this.request<{ success: boolean; message: string }>('/api/admin/settings/auth', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    getCommunicationSettings: () => this.request<{ success: boolean; data: any }>('/api/admin/settings/communication'),
    saveCommunicationSettings: (payload: any) => this.request<{ success: boolean; message: string }>('/api/admin/settings/communication', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    testCommunication: (payload: { email: string }) => this.request<{ success: boolean; message: string }>('/api/admin/settings/communication/test', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    getChatSettings: () => this.request<{ success: boolean; data: any }>('/api/admin/settings/chat'),
    saveChatSettings: (payload: any) => this.request<{ success: boolean; message: string }>('/api/admin/settings/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  };

  // ── Auth endpoint (public — no token required) ─────────────────────────────
  public async adminLogin(email: string, accessKey: string): Promise<{ success: boolean; token?: string; user?: any; message?: string }> {
    const url = `${this.apiBase}/api/admin/auth/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, accessKey }),
    });
    return response.json();
  }
}

if (typeof window !== 'undefined') {
  window.AdminApiClient = AdminApiClient;
}
