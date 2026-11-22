import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './mod/auth/auth.module';
import { BookingModule } from './mod/booking/booking.module';
import { FareModule } from './mod/fare/fare.module';
import { NotificationModule } from './mod/notification/notification.module';
import { PaymentModule } from './mod/payment/payment.module';
import { RouteModule } from './mod/route/route.module';
import { StationModule } from './mod/station/station.module';
import { TicketModule } from './mod/ticket/ticket.module';
import { TrainModule } from './mod/train/train.module';
import { TripModule } from './mod/trip/trip.module';
import { UserModule } from './mod/user/user.module';
import { PrismaModule } from './mod/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    // Load các biến từ file .env (DB dùng Prisma qua DATABASE_URL)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Cron jobs (dọn booking hết hạn)
    ScheduleModule.forRoot(),

    // Rate limit mặc định: 100 request/phút/IP. Endpoint nhạy cảm siết thêm bằng @Throttle.
    // shortcut: lưu đếm trong RAM, chỉ đúng khi chạy 1 instance; chạy nhiều instance thì dùng Redis storage.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    // Feature modules
    AuthModule,
    BookingModule,
    FareModule,
    NotificationModule,
    PaymentModule,
    RouteModule,
    StationModule,
    TicketModule,
    TrainModule,
    TripModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
