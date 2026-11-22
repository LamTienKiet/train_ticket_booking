import { BookingStatus, PaymentStatus } from '@prisma/client';
import { BookingService } from './booking.service';

const makeTx = (staleIds: string[], expiredCount = staleIds.length) => ({
  booking: {
    findMany: jest.fn().mockResolvedValue(staleIds.map((id) => ({ id }))),
    updateMany: jest.fn().mockResolvedValue({ count: expiredCount }),
  },
  bookingSeat: { updateMany: jest.fn() },
  payment: { updateMany: jest.fn() },
});

const serviceWith = (tx: ReturnType<typeof makeTx>) =>
  new BookingService({
    $transaction: (fn: (t: unknown) => unknown) => fn(tx),
  } as never);

describe('expireStaleBookings', () => {
  it('không có đơn quá hạn thì không cập nhật gì', async () => {
    const tx = makeTx([]);
    await expect(serviceWith(tx).expireStaleBookings()).resolves.toBe(0);
    expect(tx.booking.updateMany).not.toHaveBeenCalled();
  });

  it('chỉ hết hạn đơn còn PENDING và chỉ nhả ghế của đơn vừa EXPIRED', async () => {
    // b2 vừa được thanh toán giữa chừng => updateMany chỉ đổi 1 đơn
    const tx = makeTx(['b1', 'b2'], 1);
    await expect(serviceWith(tx).expireStaleBookings('u1')).resolves.toBe(1);

    expect(tx.booking.findMany.mock.calls[0][0].where).toMatchObject({
      userId: 'u1',
      status: BookingStatus.PENDING,
    });
    expect(tx.booking.updateMany.mock.calls[0][0].where).toMatchObject({
      status: BookingStatus.PENDING,
    });
    expect(tx.bookingSeat.updateMany.mock.calls[0][0].where).toMatchObject({
      booking: { status: BookingStatus.EXPIRED },
    });
    expect(tx.payment.updateMany.mock.calls[0][0]).toMatchObject({
      where: { status: PaymentStatus.PENDING },
      data: { status: PaymentStatus.FAILED },
    });
  });

  it('cron không ném lỗi khi DB lỗi', async () => {
    const svc = new BookingService({
      $transaction: () => Promise.reject(new Error('db down')),
    } as never);
    jest.spyOn(svc['logger'], 'error').mockImplementation(() => undefined);
    await expect(svc.handleExpireCron()).resolves.toBeUndefined();
  });
});
