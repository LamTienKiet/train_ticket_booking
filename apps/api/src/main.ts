import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Header bảo mật mặc định (X-Content-Type-Options, HSTS, ẩn X-Powered-By, ...)
  app.use(helmet());

  // Chỉ cho phép các domain frontend khai báo trong CORS_ORIGINS (phân tách bằng dấu phẩy)
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });

  // Sau reverse proxy (nginx, load balancer): đặt TRUST_PROXY=1 để rate limit lấy đúng IP người dùng
  if (process.env.TRUST_PROXY) {
    app.set(
      'trust proxy',
      Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY,
    );
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true, // Tự động convert query string sang đúng type (number, boolean, v.v.)
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Đóng kết nối Prisma, dừng cron gọn gàng khi nhận SIGTERM (deploy/restart)
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
