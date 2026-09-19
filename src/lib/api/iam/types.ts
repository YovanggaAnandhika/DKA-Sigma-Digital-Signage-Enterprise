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
  permissions: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  module: string;
}
