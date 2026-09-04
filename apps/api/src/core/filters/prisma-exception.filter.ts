import { Prisma } from '@edurit/database';
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { FastifyReply } from 'fastify'; 

@Catch(
  Prisma.PrismaClientKnownRequestError, 
  Prisma.PrismaClientValidationError, 
  Prisma.PrismaClientInitializationError
)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>(); 

    console.error('🔥 [Critical DB Error]:', exception.message);

    // Send a generic error response to the client
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ 
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An internal server error occurred while processing your request. Please contact support.',
    });
  }
}