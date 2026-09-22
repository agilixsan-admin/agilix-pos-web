export interface User {
  id: string;
  name: string;
  email: string;
  roleId?: string;
  roleName?: string;
  role?: {
    id: string;
    name: string;
    permissions?: string[];
    menuAccess?: string[];
  } | null;
  isSuperAdmin?: boolean;
  outletId?: string;
  tenantId: string;
  permissions?: string[];
  menuAccess?: string[];
}

export interface Outlet {
  id: string;
  tenantId: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  businessName?: string;
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

export interface InvitationVerification {
  valid: boolean;
  email: string;
  name: string;
  businessName: string;
  outletName?: string;
  roleName?: string;
}

export interface SetPasswordPayload {
  token: string;
  password: string;
}


