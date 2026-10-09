import { Prisma } from '@edurit/database';
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

// Maps Prisma errors to meaningful HTTP responses. Known constraint errors
// (duplicate, missing record, bad reference) become 4xx; anything else is a 500
// with a generic message so DB internals never leak to the client.
@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientValidationError,
  Prisma.PrismaClientInitializationError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('PrismaExceptionFilter');

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'DATABASE_ERROR';
    let message = 'An internal server error occurred while processing your request. Please contact support.';

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          const target = exception.meta?.target;
          const fields = Array.isArray(target) ? target.filter((f) => f !== 'tenant_id' && f !== 'tenantId') : [];
          status = HttpStatus.CONFLICT;
          errorCode = 'DUPLICATE_RECORD';
          message = fields.length
            ? `A record with the same ${fields.join(', ')} already exists`
            : 'A record with these details already exists';
          break;
        }
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          errorCode = 'RECORD_NOT_FOUND';
          message = 'Requested record not found';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          errorCode = 'INVALID_REFERENCE';
          message = 'A referenced record does not exist or is still in use';
          break;
      }
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`🔥 [Critical DB Error] ${request.method} ${request.url}: ${exception.message}`);
    }

    response.status(status).send({
      success: false,
      statusCode: status,
      errorCode,
      message,
      errors: [message],
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
