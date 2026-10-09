// Demo setup for one or more schools (tenants), so every ERP screen has data:
//  1. school settings (address, contact, affiliation…) — only empty fields are filled;
//  2. one realistic record in every core module (students, fees, exams, HR…);
//  3. demo records for calendar, transport and library;
//  4. one login per role (principal, teacher, accountant, front desk, student, parent).
//
//   pnpm db:seed:demo tulsi-manas                 one school
//   pnpm db:seed:demo tulsi-manas lavkush         several schools
//   pnpm db:seed:demo --all                       every school
//
// Safe to re-run: every step checks what already exists. The core data is
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

async function seedCoreData(slug: string) {
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
    console.log(`   core data   : already present (student ${existing.admissionNumber})`);
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

  console.log(`   core data   : created — Aarav Verma (${result.student.admissionNumber}), teacher ${result.teacher.employeeCode},`);
  console.log(`                 ${result.invoiceNumber} ₹30,000 (paid ₹10,000, ${result.receiptNumber}), exam, homework, HR, front office…`);
}

// ---------------------------------------------------------------------------
// 1. School settings — fills only fields that are still empty.
// ---------------------------------------------------------------------------
interface SchoolProfileSeed {
  city: string;
  state: string;
  pincode: string;
  area: string;
  principal: string;
  phone: string;
}

const SCHOOL_PROFILES: Record<string, SchoolProfileSeed> = {
  'tulsi-manas': { city: 'Varanasi', state: 'Uttar Pradesh', pincode: '221005', area: 'Durgakund Road, Bhelupur', principal: 'Dr. Ramakant Tripathi', phone: '0542-2310045' },
  lavkush: { city: 'Ayodhya', state: 'Uttar Pradesh', pincode: '224123', area: 'Ram Path, Naya Ghat', principal: 'Mrs. Sunita Mishra', phone: '05278-232211' },
  'shashtri-vidyalaya': { city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226010', area: 'Sector 12, Gomti Nagar', principal: 'Mr. Alok Shastri', phone: '0522-4012345' },
};
const DEFAULT_PROFILE: SchoolProfileSeed = {
  city: 'Prayagraj',
  state: 'Uttar Pradesh',
  pincode: '211001',
  area: 'Civil Lines',
  principal: 'Dr. Meena Srivastava',
  phone: '0532-2400100',
};

// Deterministic 5-digit number per school (so re-runs produce the same value).
const stableNumber = (text: string) =>
  String(Math.abs([...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % 100000).padStart(5, '0');

async function fillSchoolSettings(slug: string) {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug }, include: { settings: true } });
  const p = SCHOOL_PROFILES[slug] ?? DEFAULT_PROFILE;
  const code = slug.replace(/[^a-z0-9]/g, '').slice(0, 6).toUpperCase();

  const desired: Record<string, string> = {
    address: p.area,
    city: p.city,
    state: p.state,
    pincode: p.pincode,
    phone: p.phone,
    email: `office@${slug}.edu.in`,
    website: `https://${slug}.edurit.in`,
    affiliationBoard: 'CBSE',
    affiliationNumber: `21${stableNumber(slug)}`,
    principalName: p.principal,
    establishedYear: '1998',
  };

  const theme = (tenant.settings?.themeConfig ?? {}) as Record<string, unknown>;
  const profile: Record<string, string> = { ...((theme.profile as Record<string, string> | undefined) ?? {}) };
  const filled: string[] = tenant.legalName ? [] : ['legalName'];
  for (const [key, value] of Object.entries(desired)) {
    if (!profile[key]) {
      profile[key] = value;
      filled.push(key);
    }
  }

  await prisma.$transaction([
    ...(tenant.legalName
      ? []
      : [prisma.tenant.update({ where: { id: tenant.id }, data: { legalName: `${tenant.name} Educational Society (Regd. ${code})` } })]),
    prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: { themeConfig: { ...theme, profile } as Prisma.InputJsonObject },
      create: { tenantId: tenant.id, currency: 'INR', timezone: 'Asia/Kolkata', themeConfig: { profile } },
    }),
  ]);
  console.log(`   settings    : ${filled.length ? `filled ${filled.join(', ')}` : 'already complete'}`);
}

// ---------------------------------------------------------------------------
// 2. Calendar, transport and library demo records (each checked separately).
// ---------------------------------------------------------------------------
async function seedModuleExtras(slug: string) {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug }, include: { settings: true } });
  const tenantId = tenant.id;
  const today = todayIn(tenant.settings?.timezone ?? 'Asia/Kolkata');
  const student = await prisma.student.findFirst({
    where: { tenantId, admissionNumber: { endsWith: DEMO_ADMISSION_NO_SUFFIX }, deletedAt: null },
  });
  const done: string[] = [];

  // Calendar
  if (!(await prisma.calendarEvent.count({ where: { tenantId, deletedAt: null } }))) {
    const year = today.getUTCFullYear();
    const thisYearsDate = new Date(Date.UTC(year, 9, 2));
    const gandhiJayanti = today > thisYearsDate ? new Date(Date.UTC(year + 1, 9, 2)) : thisYearsDate;
    await prisma.calendarEvent.createMany({
      data: [
        {
          tenantId,
          title: 'Parent-Teacher Meeting',
          type: 'PTM',
          startDate: addDays(today, 5),
          endDate: addDays(today, 5),
          targetRole: 'PARENT',
          description: 'Unit Test 1 results discussion, 10 AM to 1 PM.',
        },
        {
          tenantId,
          title: 'Annual Sports Day',
          type: 'EVENT',
          startDate: addDays(today, 12),
          endDate: addDays(today, 13),
          description: 'Track and field events on the main ground.',
        },
        { tenantId, title: 'Gandhi Jayanti', type: 'HOLIDAY', isHoliday: true, startDate: gandhiJayanti, endDate: gandhiJayanti },
        {
          tenantId,
          title: 'Science Exhibition',
          type: 'ACTIVITY',
          startDate: addDays(today, 20),
          endDate: addDays(today, 20),
          description: 'Classes 5 to 10; models to be submitted a day before.',
        },
      ],
    });
    done.push('calendar');
  }

  // Transport
  let route = await prisma.transportRoute.findFirst({ where: { tenantId, deletedAt: null }, include: { stops: true } });
  if (!route) {
    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId,
        registrationNumber: 'UP65 AB 1234',
        model: 'Tata Starbus 40-seater',
        capacity: 40,
        driverName: 'Shyam Lal Yadav',
        driverPhone: '9876500010',
        driverLicense: 'UP65-2015-0012345',
        helperName: 'Mohan',
        helperPhone: '9876500011',
        insuranceExpiry: addDays(today, 200),
        fitnessExpiry: addDays(today, 10),
      },
    });
    route = await prisma.transportRoute.create({
      data: {
        tenantId,
        name: 'Route 1 - City Centre',
        code: 'R1',
        vehicleId: vehicle.id,
        monthlyFee: d(1200),
        stops: {
          create: [
            { name: 'Lanka Gate', sequence: 1, pickupTime: '07:05', dropTime: '14:20' },
            { name: 'Assi Ghat', sequence: 2, pickupTime: '07:15', dropTime: '14:10' },
            { name: 'School Campus', sequence: 3, pickupTime: '07:35', dropTime: '13:50' },
          ],
        },
      },
      include: { stops: true },
    });
    done.push('transport');
  }
  if (student && !(await prisma.studentTransport.count({ where: { tenantId, studentId: student.id, isActive: true } }))) {
    await prisma.studentTransport.create({
      data: {
        tenantId,
        studentId: student.id,
        routeId: route.id,
        stopId: route.stops.find((s) => s.sequence === 1)?.id,
        startDate: today,
      },
    });
    done.push('transport assignment');
  }

  // Library
  if (!(await prisma.libraryBook.count({ where: { tenantId, deletedAt: null } }))) {
    const [book] = await prisma.$transaction([
      prisma.libraryBook.create({
        data: {
          tenantId,
          title: 'Wings of Fire',
          author: 'A. P. J. Abdul Kalam',
          isbn: '9788173711466',
          publisher: 'Universities Press',
          category: 'Biography',
          shelfLocation: 'B-2',
          totalCopies: 3,
          availableCopies: student ? 2 : 3,
        },
      }),
      prisma.libraryBook.create({
        data: { tenantId, title: 'NCERT Mathematics - Class 5', author: 'NCERT', category: 'Textbook', shelfLocation: 'T-1', totalCopies: 10, availableCopies: 10 },
      }),
      prisma.libraryBook.create({
        data: { tenantId, title: 'Panchatantra Stories', author: 'Vishnu Sharma', category: 'Fiction', shelfLocation: 'F-4', totalCopies: 2, availableCopies: 2 },
      }),
    ]);
    if (student) {
      await prisma.bookIssue.create({
        data: { tenantId, bookId: book.id, studentId: student.id, dueDate: addDays(today, 7), remarks: 'Demo issue' },
      });
    }
    done.push('library');
  }

  console.log(`   new modules : ${done.length ? `created ${done.join(', ')}` : 'already present'}`);
}

// ---------------------------------------------------------------------------
// 3. One login per role. Staff-type users also get a Staff profile so they
//    appear in the HR directory; the student login is linked to the demo student.
// ---------------------------------------------------------------------------
interface RoleLogin {
  key: string;
  roleCode: string;
  firstName: string;
  lastName: string;
  staff?: { designation: string; department: string; salary: number; teaching: boolean };
}

const ROLE_LOGINS: RoleLogin[] = [
  { key: 'principal', roleCode: 'ADMIN', firstName: 'Ramakant', lastName: 'Tripathi', staff: { designation: 'Principal', department: 'Administration', salary: 85000, teaching: false } },
  { key: 'teacher', roleCode: 'TEACHER', firstName: 'Anjali', lastName: 'Sharma', staff: { designation: 'Class Teacher', department: 'Mathematics', salary: 42000, teaching: true } },
  { key: 'accountant', roleCode: 'ACCOUNTANT', firstName: 'Kavita', lastName: 'Bhatt', staff: { designation: 'Accountant', department: 'Accounts', salary: 32000, teaching: false } },
  { key: 'frontdesk', roleCode: 'STAFF', firstName: 'Pooja', lastName: 'Singh', staff: { designation: 'Front Office Executive', department: 'Administration', salary: 22000, teaching: false } },
  { key: 'student', roleCode: 'STUDENT', firstName: 'Aarav', lastName: 'Verma' },
  { key: 'parent', roleCode: 'PARENT', firstName: 'Rajesh', lastName: 'Verma' },
];

async function seedRoleLogins(slug: string) {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug } });
  const tenantId = tenant.id;
  const domain = `${slug}.demo`;
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const roles = await prisma.role.findMany({ where: { tenantId }, select: { id: true, code: true } });
  const roleId = (code: string) => {
    const id = roles.find((r) => r.code === code)?.id;
    if (!id) throw new Error(`Role ${code} missing for '${slug}' - run pnpm db:seed first`);
    return id;
  };
  const branch = await prisma.branch.findFirst({ where: { tenantId, deletedAt: null }, orderBy: { createdAt: 'asc' } });
  const student = await prisma.student.findFirst({
    where: { tenantId, admissionNumber: { endsWith: DEMO_ADMISSION_NO_SUFFIX }, deletedAt: null },
    include: { guardians: true },
  });

  const lines: string[] = [];
  for (const [index, login] of ROLE_LOGINS.entries()) {
    const email = `${login.key}@${domain}`;
    // Never overwrite an existing password (it may have been changed since).
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash, firstName: login.firstName, lastName: login.lastName, phone: `98765100${String(index).padStart(2, '0')}` },
    });
    const membership = await prisma.membership.upsert({
      where: { tenantId_userId: { tenantId, userId: user.id } },
      update: {},
      create: { tenantId, userId: user.id, status: 'ACTIVE' },
    });
    await prisma.membershipRole.upsert({
      where: { membershipId_roleId: { membershipId: membership.id, roleId: roleId(login.roleCode) } },
      update: {},
      create: { membershipId: membership.id, roleId: roleId(login.roleCode) },
    });

    if (login.staff && branch) {
      const existingStaff = await prisma.staff.findUnique({ where: { tenantId_userId: { tenantId, userId: user.id } } });
      if (!existingStaff) {
        const codes = await prisma.staff.findMany({ where: { tenantId }, select: { employeeCode: true } });
        await prisma.staff.create({
          data: {
            tenantId,
            userId: user.id,
            branchId: branch.id,
            employeeCode: nextNumber(codes.map((c) => c.employeeCode), 'EMP-', 4),
            designation: login.staff.designation,
            department: login.staff.department,
            basicSalary: d(login.staff.salary),
            isTeachingStaff: login.staff.teaching,
            joiningDate: new Date(Date.UTC(2020, 5, 1)),
          },
        });
      }
    }
    if (login.roleCode === 'STUDENT' && student && !student.userId) {
      await prisma.student.update({ where: { id: student.id }, data: { userId: user.id } });
    }
    if (login.roleCode === 'PARENT' && student) {
      const parent = await prisma.parent.upsert({
        where: { tenantId_userId: { tenantId, userId: user.id } },
        update: {},
        create: { tenantId, userId: user.id, occupation: 'Business' },
      });
      if (!student.guardians.some((g) => g.parentId === parent.id)) {
        await prisma.studentGuardian.create({
          data: { studentId: student.id, parentId: parent.id, relationship: 'FATHER', isPrimary: student.guardians.length === 0 },
        });
      }
    }
    lines.push(`${login.roleCode.padEnd(10)} ${email}`);
  }
  console.log(`   logins (password ${DEMO_PASSWORD}):`);
  lines.forEach((l) => console.log(`     ${l}`));
}

async function main() {
  const args = process.argv
    .slice(2)
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
  if (!args.length) throw new Error('Usage: pnpm db:seed:demo <tenant-slug> [more-slugs] | --all');
  const slugs = args.includes('--all')
    ? (await prisma.tenant.findMany({ where: { deletedAt: null }, select: { slug: true }, orderBy: { createdAt: 'asc' } })).map((t) => t.slug)
    : args;

  for (const slug of slugs) {
    console.log(`\n🏫 ${slug}`);
    await seedCoreData(slug);
    await fillSchoolSettings(slug);
    await seedModuleExtras(slug);
    await seedRoleLogins(slug);
  }
  console.log('\n✅ Demo setup complete.');
}

main()
  .catch((e) => {
    console.error('❌ Demo seed failed:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
