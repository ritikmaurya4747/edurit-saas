import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();

    const errorMessage =
      typeof exceptionResponse === 'object' && exceptionResponse.message
        ? exceptionResponse.message
        : exception.message;

    response.status(status).json({
      success: false,
      statusCode: status,
      errorCode: exception.name || 'HTTP_EXCEPTION',
      message: Array.isArray(errorMessage) ? errorMessage[0] : errorMessage,
      errors: Array.isArray(errorMessage) ? errorMessage : [errorMessage],
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}