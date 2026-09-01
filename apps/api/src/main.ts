import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { PrismaClientExceptionFilter } from "./common/filters/prisma-exception.filter";
import { TransformResponseInterceptor } from "./common/interceptors/transform-response.interceptor";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
  );

  // Security headers (Fastify version of helmet)
  await app.register(fastifyHelmet as any);

  // CORS
  await app.register(fastifyCors as any, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed =
        /\.techrit\.com$/.test(new URL(origin).hostname) ||
        /^(localhost|127\.0\.0\.1)$/.test(new URL(origin).hostname);
      cb(null, allowed);
    },
    credentials: true,
  });

  // Global prefix + versioning → routes become /api/v1/...
  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Exception filters
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaClientExceptionFilter(),
  );

  // Response transform
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle("EduRit School ERP API")
    .setDescription("Multi-Tenant SaaS Backend REST APIs")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth",
    )
    .addApiKey(
      {
        type: "apiKey",
        name: "x-tenant-id",
        in: "header",
        description: "Tenant ID header for tenant-scoped operations",
      },
      "x-tenant-id",
    )
    .build();

  const document = SwaggerModule.createDocument(app as any, config);
  SwaggerModule.setup("docs", app as any, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, "0.0.0.0");

  console.log(`🚀 API running on: http://localhost:${port}/api/v1`);
  console.log(`📑 Swagger Documentation: http://localhost:${port}/docs`);
}

bootstrap();