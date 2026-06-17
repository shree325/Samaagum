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

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('samaagum_admin_token') || 'mock-admin-jwt-token';
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.apiBase}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
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

  // ── Users endpoints ───────────────────────────────────────────────────────
  public users = {
    getUsers: () => this.request<{ success: boolean; data: any[] }>('/api/admin/users'),
    saveUser: (payload: any) => this.request<{ success: boolean }>('/api/admin/users', {
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
  };
}

if (typeof window !== 'undefined') {
  window.AdminApiClient = AdminApiClient;
}
