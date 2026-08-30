import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database operation failed';
    let errorCode = `DB_${exception.code}`;

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = `Unique constraint failed on field(s): ${(exception.meta?.target as string[])?.join(', ')}`;
        errorCode = 'DUPLICATE_RECORD';
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Requested record not found';
        errorCode = 'RECORD_NOT_FOUND';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Foreign key constraint violation';
        errorCode = 'FOREIGN_KEY_VIOLATION';
        break;
      default:
        message = exception.message.replace(/(\r\n|\n|\r)/gm, '');
        break;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}