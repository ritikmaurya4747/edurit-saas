export interface SessionUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role?: string;
  roleName?: string;
  roles: { name: string; code: string }[];
  permissions: string[];
  isAdmin: boolean;
  staffId: string | null;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  logoUrl?: string | null;
  currency: string;
  timezone: string;
}
