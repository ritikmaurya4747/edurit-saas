export type RoleType = 'System' | 'Custom';

export interface PermissionNode {
  key: string;
  label: string;
}

export interface PermissionModule {
  moduleName: string;
  permissions: PermissionNode[];
}

export interface RoleRecord {
  id: string;
  name: string;
  type: RoleType;
  assignedUsers: number;
  permissions: string[]; // Array of permission keys
}

// Master list of all available permissions in the ERP
export const PERMISSION_MODULES: PermissionModule[] = [
  {
    moduleName: 'Notice Board',
    permissions: [
      { key: 'VIEW_NOTICES', label: 'View Notices' },
      { key: 'CREATE_NOTICES', label: 'Create & Publish Notices' },
      { key: 'DELETE_NOTICES', label: 'Delete & Archive Notices' },
    ]
  },
  {
    moduleName: 'Fee Management',
    permissions: [
      { key: 'VIEW_FEES', label: 'View Fee Records' },
      { key: 'COLLECT_FEES', label: 'Collect Payments & Generate Receipts' },
      { key: 'MANAGE_STRUCTURES', label: 'Edit Fee Structures & EMI Plans' },
      { key: 'PROCESS_REFUNDS', label: 'Approve & Process Refunds' },
    ]
  },
  {
    moduleName: 'Staff & HR',
    permissions: [
      { key: 'VIEW_STAFF', label: 'View Staff Directory' },
      { key: 'MANAGE_STAFF', label: 'Add/Edit Staff Records' },
      { key: 'APPROVE_LEAVES', label: 'Approve/Reject Leave Requests' },
      { key: 'PROCESS_PAYROLL', label: 'Process Payroll & Payslips' },
    ]
  },
  {
    moduleName: 'Desk Slips',
    permissions: [
      { key: 'VIEW_SLIPS', label: 'View Desk Slips' },
      { key: 'GENERATE_SLIPS', label: 'Generate & Assign Seating' },
    ]
  }
];

export const initialRoles: RoleRecord[] = [
  {
    id: 'r_001',
    name: 'Super Admin / Principal',
    type: 'System',
    assignedUsers: 2,
    permissions: [
      'VIEW_NOTICES', 'CREATE_NOTICES', 'DELETE_NOTICES',
      'VIEW_FEES', 'COLLECT_FEES', 'MANAGE_STRUCTURES', 'PROCESS_REFUNDS',
      'VIEW_STAFF', 'MANAGE_STAFF', 'APPROVE_LEAVES', 'PROCESS_PAYROLL',
      'VIEW_SLIPS', 'GENERATE_SLIPS'
    ]
  },
  {
    id: 'r_002',
    name: 'Teacher',
    type: 'System',
    assignedUsers: 45,
    permissions: ['VIEW_NOTICES', 'CREATE_NOTICES', 'VIEW_STAFF']
  },
  {
    id: 'r_003',
    name: 'Accountant',
    type: 'Custom',
    assignedUsers: 3,
    permissions: ['VIEW_NOTICES', 'VIEW_FEES', 'COLLECT_FEES', 'PROCESS_PAYROLL']
  }
];