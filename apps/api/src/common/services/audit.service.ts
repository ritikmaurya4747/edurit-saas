import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@edurit/database';
import { PrismaService } from '../../core/database/prisma.service';
import type { AuthUser } from '../types/auth-user';

type Tx = Prisma.TransactionClient | PrismaService;

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Records a tenant audit entry. Never throws: auditing must not break the
  // business operation. Pass `tx` to write inside an existing transaction.
  async log(
    user: Pick<AuthUser, 'id' | 'tenantId'>,
    action: string,
    entityName: string,
    entityId?: string | null,
    changes: Record<string, unknown> = {},
    tx: Tx = this.prisma,
  ) {
    try {
      await tx.tenantAuditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action,
          entityName,
          entityId: entityId ?? null,
          changes: JSON.parse(JSON.stringify(changes)),
        },
      });
    } catch (error) {
      this.logger.warn(`Audit log failed for ${action} ${entityName}: ${(error as Error).message}`);
    }
  }
}
