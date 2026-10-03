export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string; // SUPER_ADMIN, TECH_SUPPORT, BILLING_ADMIN, COMPLIANCE_OFFICER
}