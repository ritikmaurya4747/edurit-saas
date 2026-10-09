import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { AuthUser } from '../../common/types/auth-user';
import { decimal } from '../../common/utils/money';
import { CreateRouteDto, ReplaceStopsDto, RouteListQueryDto, RouteStopInputDto, UpdateRouteDto } from './dto/transport.dto';
import { studentView, transportStudentSelect } from './transport.utils';

const ENTITY = 'TransportRoute';
const normaliseCode = (code: string) => code.trim().toUpperCase();

const vehicleSelect = {
  id: true,
  registrationNumber: true,
  model: true,
  capacity: true,
  driverName: true,
  driverPhone: true,
  helperName: true,
  helperPhone: true,
  isActive: true,
} satisfies Prisma.VehicleSelect;

const routeInclude = {
  vehicle: { select: vehicleSelect },
  stops: { orderBy: { sequence: 'asc' } },
  _count: { select: { assignments: { where: { isActive: true } } } },
} satisfies Prisma.TransportRouteInclude;

type RouteWithDetails = Prisma.TransportRouteGetPayload<{ include: typeof routeInclude }>;

const stopData = (stop: RouteStopInputDto, sequence: number) => ({
  name: stop.name.trim(),
  sequence,
  pickupTime: stop.pickupTime || null,
  dropTime: stop.dropTime || null,
  fee: stop.fee !== undefined && stop.fee !== null ? decimal(stop.fee) : null,
});

@Injectable()
export class RoutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, query: RouteListQueryDto = {}) {
    const routes = await this.prisma.transportRoute.findMany({
      where: { tenantId, deletedAt: null, ...(!query.includeInactive && { isActive: true }) },
      include: routeInclude,
      orderBy: { code: 'asc' },
    });
    const stopCounts = await this.stopCounts(tenantId, routes.map((r) => r.id));
    return routes.map((r) => this.toView(r, stopCounts));
  }

  // Route with stops and every student currently assigned to it.
  async get(tenantId: string, id: string) {
    const route = await this.prisma.transportRoute.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: routeInclude,
    });
    if (!route) throw new NotFoundException('Route not found');

    const [stopCounts, assignments] = await Promise.all([
      this.stopCounts(tenantId, [id]),
      this.prisma.studentTransport.findMany({
        where: { tenantId, routeId: id, isActive: true, student: { deletedAt: null } },
        include: {
          student: { select: transportStudentSelect },
          stop: { select: { id: true, name: true, sequence: true, pickupTime: true, dropTime: true, fee: true } },
        },
      }),
    ]);

    const students = assignments
      .map((a) => ({
        id: a.id,
        startDate: a.startDate,
        stop: a.stop,
        student: studentView(a.student),
      }))
      .sort(
        (a, b) =>
          (a.stop?.sequence ?? Number.MAX_SAFE_INTEGER) - (b.stop?.sequence ?? Number.MAX_SAFE_INTEGER) ||
          a.student.name.localeCompare(b.student.name),
      );

    return { ...this.toView(route, stopCounts), assignments: students };
  }

  async create(user: AuthUser, dto: CreateRouteDto) {
    const code = normaliseCode(dto.code);
    await this.assertCodeFree(user.tenantId, code);
    if (dto.vehicleId) await this.findVehicleOrThrow(user.tenantId, dto.vehicleId);
    const stops = (dto.stops ?? []).filter((s) => s.name?.trim());

    const route = await this.prisma.transportRoute.create({
      data: {
        tenantId: user.tenantId,
        name: dto.name.trim(),
        code,
        vehicleId: dto.vehicleId ?? null,
        monthlyFee: decimal(dto.monthlyFee),
        stops: { create: stops.map((s, index) => stopData(s, index + 1)) },
      },
    });
    await this.audit.log(user, 'CREATE', ENTITY, route.id, {
      code,
      name: route.name,
      vehicleId: route.vehicleId,
      monthlyFee: dto.monthlyFee,
      stops: stops.length,
    });
    return this.get(user.tenantId, route.id);
  }

  async update(user: AuthUser, id: string, dto: UpdateRouteDto) {
    const route = await this.findOrThrow(user.tenantId, id);
    const code = dto.code !== undefined && dto.code !== null ? normaliseCode(dto.code) : undefined;
    if (code && code !== route.code) await this.assertCodeFree(user.tenantId, code);

    const activeStudents =
      dto.vehicleId || dto.isActive === false
        ? await this.prisma.studentTransport.count({ where: { tenantId: user.tenantId, routeId: id, isActive: true } })
        : 0;

    if (dto.vehicleId && dto.vehicleId !== route.vehicleId) {
      const vehicle = await this.findVehicleOrThrow(user.tenantId, dto.vehicleId);
      if (activeStudents > vehicle.capacity) {
        throw new BadRequestException(
          `${vehicle.registrationNumber} has ${vehicle.capacity} seats but ${activeStudents} students ride this route. ` +
            'Choose a bigger vehicle or move some students first.',
        );
      }
    }
    if (dto.isActive === false && route.isActive && activeStudents > 0) {
      throw new BadRequestException(
        `${activeStudents} student(s) are still assigned to this route. End their assignments before deactivating it.`,
      );
    }

    await this.prisma.transportRoute.update({
      where: { id },
      data: {
        name: dto.name?.trim() || undefined,
        code,
        vehicleId: dto.vehicleId === null ? null : dto.vehicleId,
        monthlyFee: dto.monthlyFee !== undefined && dto.monthlyFee !== null ? decimal(dto.monthlyFee) : undefined,
        isActive: dto.isActive,
      },
    });
    await this.audit.log(user, 'UPDATE', ENTITY, id, { ...dto, ...(code && { code }) });
    return this.get(user.tenantId, id);
  }

  // Replaces the stop list. Stops sent with an id are updated in place so
  // student assignments that point at them survive; others are created;
  // missing ones are deleted (refused while students board there).
  async replaceStops(user: AuthUser, id: string, dto: ReplaceStopsDto) {
    await this.findOrThrow(user.tenantId, id);
    const incoming = dto.stops.filter((s) => s.name?.trim());

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.routeStop.findMany({
        where: { routeId: id, route: { tenantId: user.tenantId } },
        select: { id: true, name: true },
      });
      const existingIds = new Set(existing.map((s) => s.id));
      const keptIds = new Set<string>();
      for (const stop of incoming) {
        if (!stop.id) continue;
        if (!existingIds.has(stop.id)) throw new BadRequestException(`Stop "${stop.name}" does not belong to this route`);
        if (keptIds.has(stop.id)) throw new BadRequestException(`Stop "${stop.name}" is listed twice`);
        keptIds.add(stop.id);
      }

      const removed = existing.filter((s) => !keptIds.has(s.id));
      if (removed.length) {
        const inUse = await tx.studentTransport.groupBy({
          by: ['stopId'],
          where: { tenantId: user.tenantId, routeId: id, isActive: true, stopId: { in: removed.map((s) => s.id) } },
          _count: { _all: true },
        });
        if (inUse.length) {
          const details = inUse
            .map((u) => `"${removed.find((s) => s.id === u.stopId)?.name}" (${u._count._all} student(s))`)
            .join(', ');
          throw new BadRequestException(
            `Cannot remove stop ${details} while students board there. Move those students to another stop first.`,
          );
        }
        await tx.routeStop.deleteMany({ where: { routeId: id, id: { in: removed.map((s) => s.id) } } });
      }

      for (const [index, stop] of incoming.entries()) {
        const data = stopData(stop, index + 1);
        if (stop.id) await tx.routeStop.update({ where: { id: stop.id }, data });
        else await tx.routeStop.create({ data: { ...data, routeId: id } });
      }

      await this.audit.log(
        user,
        'UPDATE_STOPS',
        ENTITY,
        id,
        { stops: incoming.map((s) => s.name.trim()), removed: removed.map((s) => s.name) },
        tx,
      );
    });
    return this.get(user.tenantId, id);
  }

  // Soft delete; the code is suffixed so it can be reused.
  async remove(user: AuthUser, id: string) {
    const route = await this.findOrThrow(user.tenantId, id);
    const active = await this.prisma.studentTransport.count({ where: { tenantId: user.tenantId, routeId: id, isActive: true } });
    if (active > 0) {
      throw new BadRequestException(
        `${active} student(s) are still assigned to route ${route.code}. End their assignments before deleting it.`,
      );
    }
    const now = new Date();
    await this.prisma.transportRoute.update({
      where: { id },
      data: {
        deletedAt: now,
        isActive: false,
        vehicleId: null,
        code: `${route.code}~${now.getTime().toString(36)}`.slice(0, 32),
      },
    });
    await this.audit.log(user, 'DELETE', ENTITY, id, { code: route.code, name: route.name });
    return { id, deleted: true };
  }

  async findOrThrow(tenantId: string, id: string) {
    const route = await this.prisma.transportRoute.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  private async findVehicleOrThrow(tenantId: string, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: vehicleId, tenantId, deletedAt: null } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (!vehicle.isActive) throw new BadRequestException(`Vehicle ${vehicle.registrationNumber} is marked inactive`);
    return vehicle;
  }

  private async assertCodeFree(tenantId: string, code: string) {
    const clash = await this.prisma.transportRoute.findFirst({
      where: { tenantId, code: { equals: code, mode: 'insensitive' } },
      select: { id: true },
    });
    if (clash) throw new ConflictException(`A route with code ${code} already exists`);
  }

  // Active students per stop for the given routes.
  private async stopCounts(tenantId: string, routeIds: string[]) {
    const counts = new Map<string, number>();
    if (!routeIds.length) return counts;
    const rows = await this.prisma.studentTransport.groupBy({
      by: ['stopId'],
      where: { tenantId, routeId: { in: routeIds }, isActive: true, stopId: { not: null } },
      _count: { _all: true },
    });
    rows.forEach((r) => r.stopId && counts.set(r.stopId, r._count._all));
    return counts;
  }

  private toView(route: RouteWithDetails, stopCounts: Map<string, number>) {
    const { _count, stops, ...rest } = route;
    const activeStudents = _count.assignments;
    const capacity = route.vehicle?.capacity ?? null;
    return {
      ...rest,
      stops: stops.map((s) => ({ ...s, studentCount: stopCounts.get(s.id) ?? 0 })),
      activeStudents,
      occupancy: {
        used: activeStudents,
        capacity,
        available: capacity !== null ? Math.max(capacity - activeStudents, 0) : null,
        percent: capacity ? Math.round((activeStudents / capacity) * 100) : null,
      },
    };
  }
}
