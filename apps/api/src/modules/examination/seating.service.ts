import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { ExamsService } from './exams.service';
import { GenerateSeatingDto, MarkPrintedDto, SeatingQueryDto, UpdateExamSeatDto } from './dto/examination.dto';

const SEATS_PER_ROW = 10;

// 0 → "A-01", 9 → "A-10", 10 → "B-01" …
export const seatLabel = (index: number) =>
  `${String.fromCharCode(65 + Math.floor(index / SEATS_PER_ROW))}-${String((index % SEATS_PER_ROW) + 1).padStart(2, '0')}`;

interface Candidate {
  studentId: string;
  name: string;
  rollNumber: number | null;
  sectionId: string;
}

@Injectable()
export class SeatingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly exams: ExamsService,
  ) {}

  async generate(user: AuthUser, examId: string, dto: GenerateSeatingDto) {
    const exam = await this.exams.findExamOrThrow(user.tenantId, examId);

    const sectionIds = [...new Set(dto.sectionIds)];
    const sections = await this.prisma.section.findMany({
      where: { id: { in: sectionIds }, tenantId: user.tenantId, deletedAt: null },
      select: { id: true },
    });
    if (sections.length !== sectionIds.length) throw new NotFoundException('One or more selected sections were not found');

    const rooms = dto.rooms.map((r) => ({ roomNumber: r.roomNumber.trim(), capacity: r.capacity }));
    const roomNames = new Set<string>();
    for (const room of rooms) {
      if (!room.roomNumber) throw new BadRequestException('Every room needs a name or number');
      const key = room.roomNumber.toLowerCase();
      if (roomNames.has(key)) throw new BadRequestException(`Room ${room.roomNumber} is listed twice`);
      roomNames.add(key);
    }

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        tenantId: user.tenantId,
        academicYearId: exam.academicYearId,
        sectionId: { in: sectionIds },
        student: { deletedAt: null },
      },
      include: { student: { select: { firstName: true, lastName: true } } },
    });
    if (!enrollments.length) throw new BadRequestException('No students are enrolled in the selected sections');

    // Per-section queues ordered by roll number, in the order sections were chosen.
    const queues = sectionIds.map((sectionId) =>
      enrollments
        .filter((e) => e.sectionId === sectionId)
        .map<Candidate>((e) => ({
          studentId: e.studentId,
          name: `${e.student.firstName} ${e.student.lastName}`.trim(),
          rollNumber: e.rollNumber,
          sectionId,
        }))
        .sort(
          (a, b) =>
            (a.rollNumber ?? Number.MAX_SAFE_INTEGER) - (b.rollNumber ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name),
        ),
    );

    const ordered: Candidate[] = [];
    if (dto.interleave ?? true) {
      // Round-robin: neighbouring seats go to students of different sections.
      const longest = Math.max(...queues.map((q) => q.length));
      for (let i = 0; i < longest; i++) for (const q of queues) if (q[i]) ordered.push(q[i]);
    } else {
      queues.forEach((q) => ordered.push(...q));
    }
    const studentIds = ordered.map((c) => c.studentId);

    const result = await this.prisma.$transaction(
      async (tx) => {
        await tx.examSeat.deleteMany({ where: { tenantId: user.tenantId, examId, studentId: { in: studentIds } } });

        // Seats still held by other students of this exam stay untouched.
        const occupied = await tx.examSeat.findMany({
          where: { tenantId: user.tenantId, examId, roomNumber: { in: rooms.map((r) => r.roomNumber) } },
          select: { roomNumber: true, seatNumber: true },
        });
        const occupiedByRoom = new Map<string, Set<string>>();
        for (const seat of occupied) {
          if (!occupiedByRoom.has(seat.roomNumber)) occupiedByRoom.set(seat.roomNumber, new Set());
          occupiedByRoom.get(seat.roomNumber)!.add(seat.seatNumber);
        }

        const freeSeats = rooms.map((room) => {
          const taken = occupiedByRoom.get(room.roomNumber) ?? new Set<string>();
          const labels: string[] = [];
          for (let i = 0; i < room.capacity; i++) {
            const label = seatLabel(i);
            if (!taken.has(label)) labels.push(label);
          }
          return { roomNumber: room.roomNumber, labels };
        });

        const capacity = freeSeats.reduce((sum, r) => sum + r.labels.length, 0);
        if (capacity < ordered.length) {
          throw new BadRequestException(
            `Not enough seats: ${ordered.length} students but only ${capacity} free seat(s) in the selected rooms. Add rooms or increase capacity.`,
          );
        }

        const data: { tenantId: string; examId: string; studentId: string; roomNumber: string; seatNumber: string }[] = [];
        const perRoom: { roomNumber: string; assigned: number }[] = [];
        let cursor = 0;
        for (const room of freeSeats) {
          let assigned = 0;
          for (const label of room.labels) {
            if (cursor >= ordered.length) break;
            data.push({
              tenantId: user.tenantId,
              examId,
              studentId: ordered[cursor].studentId,
              roomNumber: room.roomNumber,
              seatNumber: label,
            });
            cursor++;
            assigned++;
          }
          perRoom.push({ roomNumber: room.roomNumber, assigned });
        }

        await tx.examSeat.createMany({ data });
        await this.audit.log(
          user,
          'GENERATE',
          'ExamSeat',
          examId,
          { exam: exam.name, sectionIds, assigned: data.length, rooms: perRoom },
          tx,
        );
        return { assigned: data.length, rooms: perRoom };
      },
      { timeout: 30_000 },
    );

    return result;
  }

  async list(tenantId: string, examId: string, query: SeatingQueryDto) {
    const exam = await this.exams.findExamOrThrow(tenantId, examId);

    let studentFilter: string[] | undefined;
    if (query.sectionId) {
      await this.exams.findSectionOrThrow(tenantId, query.sectionId);
      const enrolled = await this.prisma.studentEnrollment.findMany({
        where: { tenantId, academicYearId: exam.academicYearId, sectionId: query.sectionId },
        select: { studentId: true },
      });
      studentFilter = enrolled.map((e) => e.studentId);
    }

    const seats = await this.prisma.examSeat.findMany({
      where: {
        tenantId,
        examId,
        ...(query.roomNumber && { roomNumber: query.roomNumber }),
        ...(studentFilter && { studentId: { in: studentFilter } }),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            enrollments: {
              where: { academicYearId: exam.academicYearId },
              select: { rollNumber: true, sectionId: true, section: { select: { name: true, class: { select: { name: true } } } } },
              take: 1,
            },
          },
        },
      },
    });

    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    return seats
      .map((seat) => {
        const enrollment = seat.student.enrollments[0];
        return {
          id: seat.id,
          roomNumber: seat.roomNumber,
          seatNumber: seat.seatNumber,
          status: seat.status,
          student: {
            id: seat.student.id,
            name: `${seat.student.firstName} ${seat.student.lastName}`.trim(),
            admissionNumber: seat.student.admissionNumber,
            rollNumber: enrollment?.rollNumber ?? null,
          },
          sectionId: enrollment?.sectionId ?? null,
          sectionLabel: enrollment ? `${enrollment.section.class.name} - ${enrollment.section.name}` : null,
        };
      })
      .sort((a, b) => collator.compare(a.roomNumber, b.roomNumber) || collator.compare(a.seatNumber, b.seatNumber));
  }

  async update(user: AuthUser, id: string, dto: UpdateExamSeatDto) {
    const seat = await this.prisma.examSeat.findFirst({
      where: { id, tenantId: user.tenantId, exam: { deletedAt: null } },
    });
    if (!seat) throw new NotFoundException('Seat not found');

    const roomNumber = dto.roomNumber?.trim() || seat.roomNumber;
    const seatNumber = dto.seatNumber?.trim().toUpperCase() || seat.seatNumber;
    if (roomNumber !== seat.roomNumber || seatNumber !== seat.seatNumber) {
      const clash = await this.prisma.examSeat.findFirst({
        where: { examId: seat.examId, roomNumber, seatNumber, NOT: { id } },
        include: { student: { select: { firstName: true, lastName: true } } },
      });
      if (clash) {
        throw new ConflictException(
          `Seat ${seatNumber} in ${roomNumber} is already taken by ${`${clash.student.firstName} ${clash.student.lastName}`.trim()}`,
        );
      }
    }

    const updated = await this.prisma.examSeat.update({
      where: { id },
      data: { roomNumber, seatNumber, ...(dto.status && { status: dto.status }) },
    });
    await this.audit.log(user, 'UPDATE', 'ExamSeat', id, { ...dto });
    return updated;
  }

  async markPrinted(user: AuthUser, examId: string, dto: MarkPrintedDto) {
    await this.exams.findExamOrThrow(user.tenantId, examId);
    const { count } = await this.prisma.examSeat.updateMany({
      where: { tenantId: user.tenantId, examId, ...(dto.seatIds?.length && { id: { in: dto.seatIds } }) },
      data: { status: 'PRINTED' },
    });
    await this.audit.log(user, 'PRINT', 'ExamSeat', examId, { printed: count });
    return { updated: count };
  }

  async clear(user: AuthUser, examId: string) {
    const exam = await this.exams.findExamOrThrow(user.tenantId, examId);
    const { count } = await this.prisma.examSeat.deleteMany({ where: { tenantId: user.tenantId, examId } });
    await this.audit.log(user, 'DELETE', 'ExamSeat', examId, { exam: exam.name, removed: count });
    return { deleted: count };
  }
}
