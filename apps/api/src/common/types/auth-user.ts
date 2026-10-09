// Shape of `request.user` for tenant-scoped (school) requests.
// Built by JwtStrategy.validate() from the DB on every request, so roles and
// permissions are always current (not taken from the possibly stale JWT).
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  membershipId: string;
  roles: string[];
  permissions: string[];
  isAdmin: boolean;
  staffId: string | null;
}
