export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  outletId?: string;
  tenantId: string;
  permissions: string[];
}

export interface Outlet {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  status: 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'EXPIRED';
  plan: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
  tenant: Tenant;
  outlets: Outlet[];
}

export interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  outlets: Outlet[];
  currentOutlet: Outlet | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

