import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import fastifyCors from "@fastify/cors";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true })
  );

  await app.register(fastifyCors as any, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed =
        /\.techrit\.com$/.test(new URL(origin).hostname) ||
        /\.localhost$/.test(new URL(origin).hostname) ||
        origin.includes("localhost");
      cb(null, allowed);
    },
    credentials: true,
  });

  app.setGlobalPrefix("api/v1");

  const port = process.env.PORT || 4000;
  await app.listen(port, "0.0.0.0");
  console.log(`API running on http://localhost:${port}/api/v1`);
}

bootstrap();
