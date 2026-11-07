export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  token: string;
  corporationId?: string;
  branchId?: string;
  effectivePermissions: string[];
  expiresAt: number;
}


export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
  isSystem: boolean;
  permissionsList: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  module: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  rolesList: Role[];
  roleGroupsList: any[];
  effectivePermissionsList: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Corporation {
  id: string;
  name: string;
  slug: string;
  description: string;
  activeUntil: string;
  maxScreens: number;
  maxBranches: number;
  subscriptionTier: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  corporationId: string;
  name: string;
  code: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ImpersonatedCorporation {
  id: string;
  name: string;
  slug: string;
}


