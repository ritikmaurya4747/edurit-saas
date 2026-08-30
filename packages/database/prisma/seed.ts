import { PrismaClient, PlatformRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const MASTER_PERMISSIONS = [
  // Academic & Branch
  { code: 'branch:create', module: 'Branch', description: 'Create branch' },
  { code: 'branch:read', module: 'Branch', description: 'View branches' },
  { code: 'branch:update', module: 'Branch', description: 'Update branch' },
  { code: 'branch:delete', module: 'Branch', description: 'Delete branch' },
  { code: 'class:manage', module: 'Academic', description: 'Manage classes and sections' },
  { code: 'subject:manage', module: 'Academic', description: 'Manage subjects' },

  // Students
  { code: 'students:create', module: 'Students', description: 'Admit new student' },
  { code: 'students:read', module: 'Students', description: 'View student profiles' },
  { code: 'students:update', module: 'Students', description: 'Update student record' },
  { code: 'students:delete', module: 'Students', description: 'Archive/Delete student' },

  // Staff
  { code: 'staff:create', module: 'Staff', description: 'Add new employee/teacher' },
  { code: 'staff:read', module: 'Staff', description: 'View staff directory' },
  { code: 'staff:update', module: 'Staff', description: 'Update staff record' },
  { code: 'staff:delete', module: 'Staff', description: 'Archive/Delete staff' },

  // Attendance
  { code: 'attendance:mark', module: 'Attendance', description: 'Take class attendance' },
  { code: 'attendance:read', module: 'Attendance', description: 'View attendance analytics' },
  { code: 'attendance:approve_leave', module: 'Attendance', description: 'Approve student leaves' },

  // Fees & Invoicing
  { code: 'fees:structure_manage', module: 'Billing', description: 'Configure fee components' },
  { code: 'invoices:create', module: 'Billing', description: 'Issue student invoices' },
  { code: 'invoices:read', module: 'Billing', description: 'View fee ledger and invoices' },
  { code: 'payments:collect', module: 'Billing', description: 'Collect and record fee payments' },

  // Examinations
  { code: 'exams:create', module: 'Examination', description: 'Create exams' },
  { code: 'marks:entry', module: 'Examination', description: 'Enter subject marks' },
  { code: 'report_cards:generate', module: 'Examination', description: 'Generate and publish report cards' },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Master Permissions
  for (const perm of MASTER_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }
  console.log(`✅ Seeded ${MASTER_PERMISSIONS.length} master permissions.`);

  // 2. Seed Default Subscription Plans
  await prisma.subscriptionPlan.upsert({
    where: { code: 'FREE_TRIAL' },
    update: {},
    create: {
      code: 'FREE_TRIAL',
      name: '14-Day Free Trial',
      maxStudents: 50,
      maxStaff: 10,
      pricePerYear: 0.00,
      featuresJson: { lms: true, billing: true, exams: true },
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { code: 'PRO_STANDARD' },
    update: {},
    create: {
      code: 'PRO_STANDARD',
      name: 'Pro Standard School',
      maxStudents: 1000,
      maxStaff: 100,
      pricePerYear: 49999.00,
      featuresJson: { lms: true, billing: true, exams: true, customDomain: true },
    },
  });
  console.log('✅ Seeded default subscription plans.');

  // 3. Seed Platform SuperAdmin
  const passwordHash = await bcrypt.hash('Admin@123456', 10);
  
  await prisma.platformUser.upsert({
    where: { email: 'superadmin@edurit.com' },
    update: {},
    create: {
      email: 'superadmin@edurit.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: PlatformRole.SUPER_ADMIN, 
    },
  });
  console.log('✅ Super Admin created: superadmin@edurit.com / Admin@123456');

  console.log('🌾 Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });