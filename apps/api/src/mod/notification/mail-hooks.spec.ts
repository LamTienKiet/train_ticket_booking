import { Role } from '@prisma/client';
import { BookingService } from '../booking/booking.service';
import { TripService } from '../trip/trip.service';
import type { MailService } from './mail.service';

const mailMock = () => ({
  sendBookingEmail: jest.fn().mockResolvedValue(undefined),
  notifyTripCancelled: jest.fn().mockResolvedValue(undefined),
});
const admin = { sub: 'u', accountId: 'a', role: Role.ADMIN } as never;

describe('Gửi email khi vé thay đổi', () => {
  it('hủy đơn → email CANCELLED sau khi lưu xong', async () => {
    const db = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'b1',
          bookingCode: 'BK1',
          status: 'PENDING',
          userId: null,
          contactPhone: null,
          totalAmount: 0,
          payment: null,
          bookingSeats: [],
          passengers: [],
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest
          .fn()
          .mockResolvedValue({ bookingCode: 'BK1', status: 'CANCELLED' }),
      },
      bookingSeat: { updateMany: jest.fn() },
      $transaction: (fn: (t: unknown) => unknown) => fn(db),
    };
    const mail = mailMock();
    await new BookingService(
      db as never,
      mail as unknown as MailService,
    ).cancel('BK1', admin);
    expect(mail.sendBookingEmail).toHaveBeenCalledWith('b1', 'CANCELLED');
  });

  it('cron hết hạn → email EXPIRED cho đơn thực sự vừa hết hạn', async () => {
    const tx = {
      booking: {
        findMany: jest.fn().mockResolvedValue([{ id: 'b1' }, { id: 'b2' }]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      bookingSeat: { updateMany: jest.fn() },
      payment: { updateMany: jest.fn() },
    };
    const db = {
      $transaction: (fn: (t: unknown) => unknown) => fn(tx),
      booking: { findMany: jest.fn().mockResolvedValue([{ id: 'b1' }]) }, // b2 vừa được thanh toán
    };
    const mail = mailMock();
    await new BookingService(
      db as never,
      mail as unknown as MailService,
    ).expireStaleBookings();
    await new Promise((r) => setImmediate(r));
    expect(db.booking.findMany.mock.calls[0][0].where).toMatchObject({
      id: { in: ['b1', 'b2'] },
      status: 'EXPIRED',
    });
    expect(mail.sendBookingEmail.mock.calls).toEqual([['b1', 'EXPIRED']]);
  });

  const tripDb = (status: string, bookings = 1) => ({
    trip: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 't1', status, _count: { bookings } }),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn(),
    },
    $transaction: (fn: (t: unknown) => unknown) => fn(tripDb(status, bookings)),
  });

  it('admin hủy chuyến (xóa chuyến đã có đơn) → báo khách', async () => {
    const mail = mailMock();
    await new TripService(
      tripDb('SCHEDULED') as never,
      mail as unknown as MailService,
    ).remove('t1');
    expect(mail.notifyTripCancelled).toHaveBeenCalledWith('t1');
  });

  it('admin đổi trạng thái chuyến sang Đã hủy → báo khách; chuyến đã hủy từ trước thì không gửi lại', async () => {
    const mail = mailMock();
    await new TripService(
      tripDb('SCHEDULED') as never,
      mail as unknown as MailService,
    ).update('t1', { status: 'CANCELLED' });
    expect(mail.notifyTripCancelled).toHaveBeenCalledWith('t1');

    const again = mailMock();
    await new TripService(
      tripDb('CANCELLED') as never,
      again as unknown as MailService,
    ).update('t1', { status: 'CANCELLED' });
    await new TripService(
      tripDb('CANCELLED') as never,
      again as unknown as MailService,
    ).remove('t1');
    expect(again.notifyTripCancelled).not.toHaveBeenCalled();
  });
});
