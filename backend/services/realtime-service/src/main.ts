import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisIoAdapter } from './shared/redis/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const configService = app.get(ConfigService);
  const redisAdapter = new RedisIoAdapter(app, configService);
  await redisAdapter.connectToRedis();
  // Cast to any to satisfy Nest's WebSocketAdapter typing differences across versions
  app.useWebSocketAdapter(redisAdapter as any);

  await app.listen(process.env.REALTIME_SERVICE_PORT || 3005);
}

bootstrap();

