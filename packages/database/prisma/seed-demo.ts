// Demo data for ONE school (tenant): creates one realistic record in every ERP
// module so each dashboard screen has something to show.
//
//   pnpm db:seed:demo <tenant-slug>        e.g. pnpm db:seed:demo tulsi-manas
//
// Safe to re-run: it stops if the demo student already exists. Everything is
// written in a single transaction, so a failure leaves no partial data.
import { PrismaClient, Prisma } from '../generated/client';
import * as bcrypt from 'bcrypt';
import { DEFAULT_ROLE_PERMISSIONS, SYSTEM_ROLES } from '../src/index';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo@12345';
const DEMO_ADMISSION_NO_SUFFIX = 'DEMO';

const d = (n: number | string) => new Prisma.Decimal(n);

// Calendar date in the school's timezone, as a UTC-midnight Date (Postgres DATE).
function todayIn(timeZone: string) {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
  return new Date(`${ymd}T00:00:00.000Z`);
}
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);

// Next number after the highest existing one matching `prefix<digits>`.
function nextNumber(existing: (string | null)[], prefix: string, width: number) {
  const max = existing.reduce((m, value) => {
    const match = value?.startsWith(prefix) ? /^(\d+)$/.exec(value.slice(prefix.length)) : null;
    return match ? Math.max(m, Number(match[1])) : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
}

async function main() {
  const slug = (process.argv[2] ?? process.env.DEMO_TENANT_SLUG ?? '').trim().toLowerCase();
  if (!slug) throw new Error('Usage: pnpm db:seed:demo <tenant-slug>');

  const tenant = await prisma.tenant.findUnique({ where: { slug }, include: { settings: true } });
  if (!tenant) throw new Error(`School '${slug}' not found`);
  const tenantId = tenant.id;
  const timeZone = tenant.settings?.timezone ?? 'Asia/Kolkata';
  const today = todayIn(timeZone);
  const now = new Date();
  const year = today.getUTCFullYear();
  const emailDomain = `${slug}.demo`;

  const existing = await prisma.student.findFirst({
    where: { tenantId, admissionNumber: { endsWith: DEMO_ADMISSION_NO_SUFFIX } },
  });
  if (existing) {
    console.log(`ℹ️  Demo data already exists for '${slug}' (student ${existing.admissionNumber}). Nothing to do.`);
    return;
  }

  // Role lookups (provisioned tenants have these; create any missing system role).
  const permissions = await prisma.permission.findMany();
  const permissionIdByCode = new Map(permissions.map((p) => [p.code, p.id]));
  const roleIdByCode = new Map<string, string>();
  for (const systemRole of SYSTEM_ROLES) {
    const role = await prisma.role.upsert({
      where: { tenantId_code: { tenantId, code: systemRole.code } },
      update: {},
      create: { tenantId, code: systemRole.code, name: systemRole.name, isSystem: true },
      include: { _count: { select: { permissions: true } } },
    });
    if (role._count.permissions === 0) {
      const data = (DEFAULT_ROLE_PERMISSIONS[systemRole.code] ?? [])
        .map((code) => permissionIdByCode.get(code))
        .filter((id): id is string => Boolean(id))
        .map((permissionId) => ({ roleId: role.id, permissionId }));
      if (data.length) await prisma.rolePermission.createMany({ data, skipDuplicates: true });
    }
    roleIdByCode.set(systemRole.code, role.id);
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Existing numbering, so the app's auto-numbering continues after the demo rows.
  const [staffCodes, invoiceNumbers, receiptNumbers] = await Promise.all([
    prisma.staff.findMany({ where: { tenantId }, select: { employeeCode: true } }),
    prisma.studentInvoice.findMany({ where: { tenantId }, select: { invoiceNumber: true } }),
    prisma.feePayment.findMany({ where: { tenantId }, select: { receiptNumber: true } }),
  ]);
  const teacherCode = nextNumber(staffCodes.map((s) => s.employeeCode), 'EMP-', 4);
  const invoiceNumber = nextNumber(invoiceNumbers.map((i) => i.invoiceNumber), `INV-${year}-`, 5);
  const receiptNumber = nextNumber(receiptNumbers.map((r) => r.receiptNumber), `RCT-${year}-`, 5);

  const result = await prisma.$transaction(
    async (tx) => {
      // ---------- Academic structure ----------
      const branch =
        (await tx.branch.findFirst({ where: { tenantId, deletedAt: null }, orderBy: { createdAt: 'asc' } })) ??
        (await tx.branch.create({ data: { tenantId, name: 'Main Campus', code: 'MAIN' } }));

      let academicYear = await tx.academicYear.findFirst({ where: { tenantId, isCurrent: true, deletedAt: null } });
      if (!academicYear) {
        const startYear = today.getUTCMonth() >= 3 ? year : year - 1;
        academicYear = await tx.academicYear.create({
          data: {
            tenantId,
            name: `${startYear}-${String(startYear + 1).slice(-2)}`,
            startDate: new Date(Date.UTC(startYear, 3, 1)),
            endDate: new Date(Date.UTC(startYear + 1, 2, 31)),
            isCurrent: true,
          },
        });
      }

      const cls =
        (await tx.class.findFirst({ where: { tenantId, branchId: branch.id, code: 'C5', deletedAt: null } })) ??
        (await tx.class.create({ data: { tenantId, branchId: branch.id, name: 'Class 5', code: 'C5' } }));
      const section =
        (await tx.section.findFirst({ where: { tenantId, classId: cls.id, name: 'A', deletedAt: null } })) ??
        (await tx.section.create({ data: { tenantId, classId: cls.id, name: 'A', capacity: 40 } }));
      const subject =
        (await tx.subject.findFirst({ where: { tenantId, code: 'MATH', deletedAt: null } })) ??
        (await tx.subject.create({ data: { tenantId, name: 'Mathematics', code: 'MATH' } }));

      // ---------- Staff (teacher with login) ----------
      const teacherUser = await tx.user.upsert({
        where: { email: `teacher@${emailDomain}` },
        update: {},
        create: { email: `teacher@${emailDomain}`, phone: '9876500001', passwordHash, firstName: 'Anjali', lastName: 'Sharma' },
      });
      const teacherMembership = await tx.membership.upsert({
        where: { tenantId_userId: { tenantId, userId: teacherUser.id } },
        update: { status: 'ACTIVE' },
        create: { tenantId, userId: teacherUser.id, status: 'ACTIVE' },
      });
      await tx.membershipRole.upsert({
        where: { membershipId_roleId: { membershipId: teacherMembership.id, roleId: roleIdByCode.get('TEACHER')! } },
        update: {},
        create: { membershipId: teacherMembership.id, roleId: roleIdByCode.get('TEACHER')! },
      });
      const teacher = await tx.staff.create({
        data: {
          tenantId,
          userId: teacherUser.id,
          branchId: branch.id,
          employeeCode: teacherCode,
          designation: 'Class Teacher',
          department: 'Mathematics',
          specialization: 'Mathematics',
          joiningDate: new Date(Date.UTC(year - 2, 5, 1)),
          basicSalary: d(42000),
          isTeachingStaff: true,
        },
      });

      // ---------- Parent + student ----------
      const parentUser = await tx.user.upsert({
        where: { email: `parent@${emailDomain}` },
        update: {},
        create: { email: `parent@${emailDomain}`, phone: '9876500002', passwordHash, firstName: 'Rajesh', lastName: 'Verma' },
      });
      const parentMembership = await tx.membership.upsert({
        where: { tenantId_userId: { tenantId, userId: parentUser.id } },
        update: { status: 'ACTIVE' },
        create: { tenantId, userId: parentUser.id, status: 'ACTIVE' },
      });
      await tx.membershipRole.upsert({
        where: { membershipId_roleId: { membershipId: parentMembership.id, roleId: roleIdByCode.get('PARENT')! } },
        update: {},
        create: { membershipId: parentMembership.id, roleId: roleIdByCode.get('PARENT')! },
      });
      const parent = await tx.parent.upsert({
        where: { tenantId_userId: { tenantId, userId: parentUser.id } },
        update: {},
        create: { tenantId, userId: parentUser.id, occupation: 'Business' },
      });

      const student = await tx.student.create({
        data: {
          tenantId,
          branchId: branch.id,
          admissionNumber: `ADM-${year}-${DEMO_ADMISSION_NO_SUFFIX}`,
          firstName: 'Aarav',
          lastName: 'Verma',
          dob: new Date(Date.UTC(year - 10, 4, 14)),
          gender: 'MALE',
          bloodGroup: 'B+',
          phone: '9876500002',
          address: '12, Gandhi Nagar, Varanasi, UP',
          admissionDate: academicYear.startDate,
        },
      });
      await tx.studentEnrollment.create({
        data: { tenantId, studentId: student.id, academicYearId: academicYear.id, sectionId: section.id, rollNumber: 1 },
      });
      await tx.studentGuardian.create({
        data: { studentId: student.id, parentId: parent.id, relationship: 'FATHER', isPrimary: true },
      });

      // ---------- Timetable: Monday, period 1 ----------
      await tx.timetable.create({
        data: {
          tenantId,
          academicYearId: academicYear.id,
          sectionId: section.id,
          subjectId: subject.id,
          staffId: teacher.id,
          dayOfWeek: 1,
          periodNumber: 1,
          startTime: '08:00',
          endTime: '08:40',
          roomNumber: '101',
        },
      });

      // ---------- Attendance (today) + a pending student leave ----------
      const session = await tx.attendanceSession.create({
        data: { tenantId, sectionId: section.id, staffId: teacher.id, attendanceDate: today, periodNumber: 0 },
      });
      await tx.attendanceRecord.create({ data: { sessionId: session.id, studentId: student.id, status: 'PRESENT' } });
      await tx.studentLeave.create({
        data: {
          tenantId,
          studentId: student.id,
          startDate: addDays(today, 3),
          endDate: addDays(today, 4),
          reason: 'Family function in Prayagraj',
        },
      });

      // ---------- Homework + graded submission ----------
      const homework = await tx.homework.create({
        data: {
          tenantId,
          sectionId: section.id,
          subjectId: subject.id,
          staffId: teacher.id,
          title: 'Fractions — Exercise 3.2',
          description: 'Solve questions 1 to 10 in your notebook.',
          dueDate: addDays(now, 2),
          maxMarks: d(10),
        },
      });
      await tx.homeworkSubmission.create({
        data: { homeworkId: homework.id, studentId: student.id, content: 'Completed in notebook', marks: d(9), feedback: 'Well done!', gradedAt: now },
      });

      // ---------- Exam, marks, report card, seat ----------
      const exam = await tx.exam.create({
        data: { tenantId, academicYearId: academicYear.id, name: 'Unit Test 1', startDate: today, endDate: addDays(today, 5) },
      });
      const examSubject = await tx.examSubject.create({
        data: { examId: exam.id, subjectId: subject.id, examDate: today, maxMarks: d(50), passingMarks: d(17) },
      });
      await tx.examMark.create({ data: { examSubjectId: examSubject.id, studentId: student.id, marksObtained: d(44) } });
      await tx.reportCard.create({
        data: { tenantId, examId: exam.id, studentId: student.id, overallPercent: d(88), grade: 'A2', remarks: 'Very good performance.' },
      });
      await tx.examSeat.create({
        data: { tenantId, examId: exam.id, studentId: student.id, roomNumber: 'Hall 1', seatNumber: 'A-01' },
      });

      // ---------- Fees: structure, invoice, part payment ----------
      const feeStructure = await tx.feeStructure.create({
        data: { tenantId, academicYearId: academicYear.id, name: 'Class 5 — Annual Fee' },
      });
      const tuition = await tx.feeComponent.create({ data: { feeStructureId: feeStructure.id, name: 'Tuition Fee', amount: d(24000) } });
      const transport = await tx.feeComponent.create({ data: { feeStructureId: feeStructure.id, name: 'Transport Fee', amount: d(6000) } });
      const invoice = await tx.studentInvoice.create({
        data: {
          tenantId,
          studentId: student.id,
          academicYearId: academicYear.id,
          invoiceNumber,
          subtotal: d(30000),
          totalAmount: d(30000),
          paidAmount: d(10000),
          balanceAmount: d(20000),
          status: 'PARTIALLY_PAID',
          dueDate: addDays(today, 15),
          items: {
            create: [
              { feeComponentId: tuition.id, title: 'Tuition Fee', unitAmount: d(24000), totalAmount: d(24000) },
              { feeComponentId: transport.id, title: 'Transport Fee', unitAmount: d(6000), totalAmount: d(6000) },
            ],
          },
        },
      });
      const payment = await tx.feePayment.create({
        data: {
          tenantId,
          idempotencyKey: `demo-${tenantId}-${student.id}`,
          receiptNumber,
          amount: d(10000),
          paymentMethod: 'UPI',
          gatewayRef: 'UPI-DEMO-001',
          remarks: 'First instalment',
        },
      });
      await tx.feePaymentAllocation.create({ data: { paymentId: payment.id, invoiceId: invoice.id, allocatedAmount: d(10000) } });

      // ---------- HR: staff leave, staff attendance, payroll, appraisal ----------
      await tx.staffLeave.create({
        data: {
          tenantId,
          staffId: teacher.id,
          leaveType: 'CASUAL',
          startDate: addDays(today, 7),
          endDate: addDays(today, 7),
          reason: 'Personal work',
        },
      });
      await tx.staffAttendance.create({
        data: { tenantId, staffId: teacher.id, attendanceDate: today, checkIn: now, status: 'PRESENT' },
      });
      await tx.payrollRecord.create({
        data: {
          tenantId,
          staffId: teacher.id,
          month: today.getUTCMonth() + 1,
          year,
          basicSalary: d(42000),
          allowances: d(3000),
          deductions: d(1500),
          netSalary: d(43500),
        },
      });
      await tx.staffAppraisal.create({
        data: { tenantId, staffId: teacher.id, period: academicYear.name, status: 'PENDING' },
      });

      // ---------- Admissions, notice, front office ----------
      await tx.admissionEnquiry.create({
        data: {
          tenantId,
          studentName: 'Diya Mishra',
          parentName: 'Sunil Mishra',
          phone: '9876500003',
          email: `enquiry@${emailDomain}`,
          classApplied: 'Class 5',
          source: 'WALK_IN',
          stage: 'ENQUIRY',
          notes: 'Wants transport facility.',
        },
      });
      await tx.notice.create({
        data: {
          tenantId,
          title: 'Parent-Teacher Meeting on Saturday',
          content: 'PTM for all classes on Saturday, 10 AM to 1 PM. Please collect the Unit Test 1 report.',
          targetRole: 'ALL',
          priority: 'EVENT',
          status: 'PUBLISHED',
        },
      });
      await tx.visitor.create({ data: { tenantId, name: 'Ramesh Gupta', phone: '9876500004', purpose: 'Book supplier meeting' } });
      await tx.infirmaryVisit.create({
        data: { tenantId, studentId: student.id, complaint: 'Mild headache', treatment: 'Rested for 30 minutes, given water' },
      });
      await tx.inventoryItem.create({
        data: { tenantId, sku: 'STAT-CHALK-01', name: 'White chalk (box of 100)', quantity: 4, reorderLevel: 5 },
      });
      await tx.complianceRecord.create({
        data: { tenantId, title: 'Fire Safety NOC renewal', complianceType: 'FIRE_SAFETY', dueDate: addDays(today, 20), status: 'PENDING' },
      });

      return { student, teacher, invoiceNumber, receiptNumber };
    },
    { maxWait: 10_000, timeout: 60_000 },
  );

  console.log(`✅ Demo data created for '${slug}':`);
  console.log(`   Student  : Aarav Verma (${result.student.admissionNumber}), Class 5 - A, roll 1`);
  console.log(`   Teacher  : Anjali Sharma (${result.teacher.employeeCode})`);
  console.log(`   Fees     : ${result.invoiceNumber} ₹30,000 — paid ₹10,000 (${result.receiptNumber})`);
  console.log('   + timetable, attendance, leave, homework, exam/marks/report card/seat,');
  console.log('     payroll, staff leave & attendance, appraisal, admission enquiry, notice,');
  console.log('     visitor, infirmary visit, inventory item, compliance record');
  console.log(`   Logins   : teacher@${emailDomain} / ${DEMO_PASSWORD}   parent@${emailDomain} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Demo seed failed:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
