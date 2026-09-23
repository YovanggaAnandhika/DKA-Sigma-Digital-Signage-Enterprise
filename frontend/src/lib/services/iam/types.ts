export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  token: string;
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

