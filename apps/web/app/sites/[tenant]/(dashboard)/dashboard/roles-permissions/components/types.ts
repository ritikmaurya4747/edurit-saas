export interface PermissionItem {
  id: string;
  code: string;
  description: string | null;
}

export interface PermissionGroup {
  module: string;
  permissions: PermissionItem[];
}

export interface RoleRecord {
  id: string;
  name: string;
  code: string;
  isSystem: boolean;
  memberCount: number;
  permissionCodes: string[];
}

export type MemberStatus = "INVITED" | "ACTIVE" | "SUSPENDED";
export type ProfileType = "STAFF" | "PARENT" | "STUDENT" | "USER";

export interface MemberRecord {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  status: MemberStatus;
  roles: { code: string; name: string }[];
  profileType: ProfileType;
  createdAt: string;
}

export const ADMIN_ROLE_CODE = "ADMIN";

// Query keys: everything on this page lives under the "roles" domain.
export const ROLES_KEYS = {
  roles: ["roles", "list"],
  permissions: ["roles", "permissions"],
  members: ["roles", "members"],
} as const;

export const toRoleCode = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
