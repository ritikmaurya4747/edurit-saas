import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { parseDateOnly } from '../../common/utils/date';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/transport.dto';
import { daysUntil, schoolToday } from './transport.utils';

const ENTITY = 'Vehicle';

// "ka 01 ab 1234" → "KA 01 AB 1234" (single spaces, upper case).
const normaliseRegistration = (value: string) => value.trim().replace(/\s+/g, ' ').toUpperCase();

// Optional text on update: undefined = keep, null/blank = clear.
const optionalText = (value: string | null | undefined) =>
  value === undefined ? undefined : value === null ? null : value.trim() || null;
const optionalDate = (value: string | null | undefined) =>
  value === undefined ? undefined : value ? parseDateOnly(value) : null;

const vehicleInclude = {
  routes: {
    where: { deletedAt: null },
    orderBy: { code: 'asc' },
    select: {
      id: true,
      name: true,
      code: true,
      isActive: true,
      _count: { select: { assignments: { where: { isActive: true } } } },
    },
  },
} satisfies Prisma.VehicleInclude;

type VehicleWithRoutes = Prisma.VehicleGetPayload<{ include: typeof vehicleInclude }>;

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string) {
    const [vehicles, today] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: { tenantId, deletedAt: null },
        include: vehicleInclude,
        orderBy: { registrationNumber: 'asc' },
      }),
      schoolToday(this.prisma, tenantId),
    ]);
    return vehicles.map((v) => this.toView(v, today));
  }

  async get(tenantId: string, id: string) {
    const [vehicle, today] = await Promise.all([
      this.prisma.vehicle.findFirst({ where: { id, tenantId, deletedAt: null }, include: vehicleInclude }),
      schoolToday(this.prisma, tenantId),
    ]);
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return this.toView(vehicle, today);
  }

  async create(user: AuthUser, dto: CreateVehicleDto) {
    const registrationNumber = normaliseRegistration(dto.registrationNumber);
    await this.assertRegistrationFree(user.tenantId, registrationNumber);
    const vehicle = await this.prisma.vehicle.create({
      data: {
        tenantId: user.tenantId,
        registrationNumber,
        model: dto.model?.trim() || null,
        capacity: dto.capacity,
        driverName: dto.driverName.trim(),
        driverPhone: dto.driverPhone.trim(),
        driverLicense: dto.driverLicense?.trim() || null,
        helperName: dto.helperName?.trim() || null,
        helperPhone: dto.helperPhone?.trim() || null,
        insuranceExpiry: dto.insuranceExpiry ? parseDateOnly(dto.insuranceExpiry) : null,
        fitnessExpiry: dto.fitnessExpiry ? parseDateOnly(dto.fitnessExpiry) : null,
        isActive: dto.isActive ?? true,
      },
    });
    await this.audit.log(user, 'CREATE', ENTITY, vehicle.id, { registrationNumber, capacity: vehicle.capacity });
    return this.get(user.tenantId, vehicle.id);
  }

  async update(user: AuthUser, id: string, dto: UpdateVehicleDto) {
    const vehicle = await this.findOrThrow(user.tenantId, id);
    const registrationNumber =
      dto.registrationNumber !== undefined && dto.registrationNumber !== null
        ? normaliseRegistration(dto.registrationNumber)
        : undefined;
    if (registrationNumber && registrationNumber !== vehicle.registrationNumber) {
      await this.assertRegistrationFree(user.tenantId, registrationNumber);
    }

    // Capacity may not drop below the students already riding on any one route.
    if (dto.capacity !== undefined && dto.capacity < vehicle.capacity) {
      const busiest = await this.busiestRoute(user.tenantId, id);
      if (busiest && busiest.count > dto.capacity) {
        throw new BadRequestException(
          `Route ${busiest.code} already has ${busiest.count} student(s) on this vehicle — capacity cannot be lower than that`,
        );
      }
    }

    if (dto.isActive === false && vehicle.isActive) {
      const activeRoutes = await this.prisma.transportRoute.findMany({
        where: { tenantId: user.tenantId, vehicleId: id, deletedAt: null, isActive: true },
        select: { code: true },
      });
      if (activeRoutes.length) {
        throw new BadRequestException(
          `This vehicle serves route(s) ${activeRoutes.map((r) => r.code).join(', ')}. Unassign it from those routes before marking it inactive.`,
        );
      }
    }

    await this.prisma.vehicle.update({
      where: { id },
      data: {
        registrationNumber,
        model: optionalText(dto.model),
        capacity: dto.capacity,
        driverName: dto.driverName?.trim() || undefined,
        driverPhone: dto.driverPhone?.trim() || undefined,
        driverLicense: optionalText(dto.driverLicense),
        helperName: optionalText(dto.helperName),
        helperPhone: optionalText(dto.helperPhone),
        insuranceExpiry: optionalDate(dto.insuranceExpiry),
        fitnessExpiry: optionalDate(dto.fitnessExpiry),
        isActive: dto.isActive,
      },
    });
    await this.audit.log(user, 'UPDATE', ENTITY, id, { ...dto, ...(registrationNumber && { registrationNumber }) });
    return this.get(user.tenantId, id);
  }

  // Soft delete. The registration number is suffixed so it can be re-added later.
  async remove(user: AuthUser, id: string) {
    const vehicle = await this.findOrThrow(user.tenantId, id);
    const activeRoutes = await this.prisma.transportRoute.findMany({
      where: { tenantId: user.tenantId, vehicleId: id, deletedAt: null, isActive: true },
      select: { code: true, name: true },
    });
    if (activeRoutes.length) {
      throw new BadRequestException(
        `This vehicle is assigned to route(s) ${activeRoutes.map((r) => `${r.code} (${r.name})`).join(', ')}. ` +
          'Unassign it from those routes first.',
      );
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      // Inactive / deleted routes still pointing here lose the link.
      await tx.transportRoute.updateMany({ where: { tenantId: user.tenantId, vehicleId: id }, data: { vehicleId: null } });
      await tx.vehicle.update({
        where: { id },
        data: {
          deletedAt: now,
          isActive: false,
          registrationNumber: `${vehicle.registrationNumber}~${now.getTime().toString(36)}`.slice(0, 32),
        },
      });
      await this.audit.log(user, 'DELETE', ENTITY, id, { registrationNumber: vehicle.registrationNumber }, tx);
    });
    return { id, deleted: true };
  }

  private async busiestRoute(tenantId: string, vehicleId: string) {
    const routes = await this.prisma.transportRoute.findMany({
      where: { tenantId, vehicleId, deletedAt: null },
      select: { code: true, _count: { select: { assignments: { where: { isActive: true } } } } },
    });
    return routes
      .map((r) => ({ code: r.code, count: r._count.assignments }))
      .sort((a, b) => b.count - a.count)[0];
  }

  private async assertRegistrationFree(tenantId: string, registrationNumber: string) {
    const clash = await this.prisma.vehicle.findFirst({
      where: { tenantId, registrationNumber: { equals: registrationNumber, mode: 'insensitive' } },
      select: { id: true, deletedAt: true },
    });
    if (clash) throw new ConflictException(`A vehicle with registration number ${registrationNumber} already exists`);
  }

  private async findOrThrow(tenantId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  private toView(vehicle: VehicleWithRoutes, today: Date) {
    const { routes, ...rest } = vehicle;
    const insuranceExpiresInDays = daysUntil(vehicle.insuranceExpiry, today);
    const fitnessExpiresInDays = daysUntil(vehicle.fitnessExpiry, today);
    return {
      ...rest,
      routes: routes.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        isActive: r.isActive,
        activeStudents: r._count.assignments,
      })),
      routeNames: routes.map((r) => r.name),
      assignedStudents: routes.reduce((sum, r) => sum + r._count.assignments, 0),
      insuranceExpiresInDays,
      fitnessExpiresInDays,
    };
  }
}
