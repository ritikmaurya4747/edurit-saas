import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { addDays, formatDateOnly } from '../../common/utils/date';
import { EXPIRY_WARNING_DAYS, daysUntil, schoolToday } from './transport.utils';

@Injectable()
export class TransportSummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(tenantId: string) {
    const today = await schoolToday(this.prisma, tenantId);
    const warnUntil = addDays(today, EXPIRY_WARNING_DAYS);

    const [vehicles, routes, studentsUsingTransport, expiring] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: { tenantId, deletedAt: null, isActive: true },
        select: { capacity: true },
      }),
      this.prisma.transportRoute.count({ where: { tenantId, deletedAt: null, isActive: true } }),
      this.prisma.studentTransport.count({
        where: { tenantId, isActive: true, route: { deletedAt: null }, student: { deletedAt: null } },
      }),
      this.prisma.vehicle.findMany({
        where: {
          tenantId,
          deletedAt: null,
          OR: [{ insuranceExpiry: { lte: warnUntil } }, { fitnessExpiry: { lte: warnUntil } }],
        },
        select: { id: true, registrationNumber: true, insuranceExpiry: true, fitnessExpiry: true },
        orderBy: { registrationNumber: 'asc' },
      }),
    ]);

    const capacity = vehicles.reduce((sum, v) => sum + v.capacity, 0);
    const expiringDocuments = expiring
      .flatMap((v) =>
        (
          [
            ['INSURANCE', v.insuranceExpiry],
            ['FITNESS', v.fitnessExpiry],
          ] as const
        )
          .filter(([, date]) => date && date <= warnUntil)
          .map(([document, date]) => {
            const daysLeft = daysUntil(date, today) ?? 0;
            return {
              vehicleId: v.id,
              registrationNumber: v.registrationNumber,
              document,
              expiryDate: formatDateOnly(date as Date),
              daysLeft,
              expired: daysLeft < 0,
            };
          }),
      )
      .sort((a, b) => a.daysLeft - b.daysLeft);

    return {
      vehicles: vehicles.length,
      routes,
      studentsUsingTransport,
      capacity,
      occupancyPercent: capacity ? Math.round((studentsUsingTransport / capacity) * 100) : 0,
      expiringDocuments,
      expiredDocuments: expiringDocuments.filter((d) => d.expired).length,
    };
  }
}
