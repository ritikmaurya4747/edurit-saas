import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    return next.handle().pipe(
      map((resData) => {
        const hasMeta =
          resData &&
          typeof resData === 'object' &&
          'meta' in resData &&
          'data' in resData;

        return {
          success: true,
          statusCode: response.statusCode,
          message: 'Operation successful',
          data: hasMeta ? resData.data : resData ?? null,
          ...(hasMeta && { meta: resData.meta }),
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}