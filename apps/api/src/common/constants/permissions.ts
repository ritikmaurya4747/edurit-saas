// Permission codes live in @edurit/database (rbac.ts) so the seed, tenant
// provisioning and the API guards share one catalogue.
// Usage: @RequirePermissions(PERMISSIONS.STUDENT_READ)
export { PERMISSIONS, type PermissionCodeValue } from '@edurit/database';
