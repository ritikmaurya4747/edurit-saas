export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role?: string;
  roleName?: string;
  roles: { name: string; code: string }[];
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  logoUrl?: string | null;
}