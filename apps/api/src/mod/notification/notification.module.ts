import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

// Global: BookingService, PaymentService, TripService dùng MailService mà không phải import module này
@Global()
@Module({
  controllers: [NotificationController],
  providers: [NotificationService, MailService],
  exports: [MailService],
})
export class NotificationModule {}
