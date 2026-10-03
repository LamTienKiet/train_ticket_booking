import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { PrismaModule } from './database/prisma.module';

@Module({
  imports: [
    PrismaModule,
    // 1. Load các biến từ file .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Cấu hình kết nối MySQL thông qua TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_DATABASE', 'train_booking'),
        autoLoadEntities: true, // Tự động load các Entity tạo ra
        synchronize: true, // DEV only, Production dùng migrations
      }),
      inject: [ConfigService],
    }),

    // 3. Feature modules
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
  providers: [AppService],
})
export class AppModule {}
