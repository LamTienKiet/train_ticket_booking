import { MailService } from './mail.service';

const dbBooking = (over: object = {}) => ({
  bookingCode: 'BK1',
  contactName: 'An',
  contactEmail: 'an@example.com',
  totalAmount: 680000,
  trip: {
    tripCode: 'SE1-20261130',
    departureTime: new Date('2026-11-29T23:00:00Z'),
    train: { code: 'SE1' },
    tripStations: [
      { stationId: 'HAN', departureTime: new Date('2026-11-29T23:00:00Z') },
    ],
  },
  bookingSeats: [
    {
      originStationId: 'HAN',
      passenger: { fullName: 'An' },
      originStation: { name: 'Ga Hà Nội' },
      destinationStation: { name: 'Ga Sài Gòn' },
      seat: { seatNumber: '12', coach: { coachNumber: 3 } },
    },
  ],
  payment: { refunds: [] },
  ...over,
});

const config = (env: Record<string, string>) =>
  ({ get: (k: string) => env[k] }) as never;
const GMAIL = { MAIL_USER: 'shop@gmail.com', MAIL_PASS: 'app-pass' };

const setup = (
  env: Record<string, string> = GMAIL,
  booking: object | null = dbBooking(),
) => {
  const prisma = {
    booking: {
      findUnique: jest.fn().mockResolvedValue(booking),
      findMany: jest.fn().mockResolvedValue([{ id: 'b1' }, { id: 'b2' }]),
    },
  };
  const svc = new MailService(prisma as never, config(env));
  const sendMail = jest.fn().mockResolvedValue({});
  (svc as unknown as { transporter: unknown }).transporter = svc[
    'transporter'
  ] && { sendMail };
  return { svc, prisma, sendMail };
};

describe('MailService', () => {
  it('gửi email tới email liên hệ của đơn', async () => {
    const { svc, sendMail } = setup();
    await svc.sendBookingEmail('b1', 'CONFIRMED');
    expect(sendMail).toHaveBeenCalledTimes(1);
    const mail = sendMail.mock.calls[0][0];
    expect(mail.to).toBe('an@example.com');
    expect(mail.from).toContain('shop@gmail.com');
    expect(mail.subject).toContain('BK1');
    expect(mail.html).toContain('Toa 3 · Ghế 12');
  });

  it('chưa cấu hình Gmail → bỏ qua, không lỗi', async () => {
    const { svc, prisma } = setup({});
    await expect(
      svc.sendBookingEmail('b1', 'CONFIRMED'),
    ).resolves.toBeUndefined();
    expect(prisma.booking.findUnique).not.toHaveBeenCalled();
  });

  it('đơn không có email liên hệ → không gửi', async () => {
    const { svc, sendMail } = setup(GMAIL, dbBooking({ contactEmail: null }));
    await svc.sendBookingEmail('b1', 'CONFIRMED');
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('Gmail lỗi → nuốt lỗi, không làm hỏng việc đặt/hủy vé', async () => {
    const { svc, sendMail } = setup();
    sendMail.mockRejectedValue(new Error('Invalid login'));
    await expect(
      svc.sendBookingEmail('b1', 'CONFIRMED'),
    ).resolves.toBeUndefined();
  });

  it('hủy đơn: lấy số tiền hoàn mới nhất', async () => {
    const { svc, sendMail } = setup(
      GMAIL,
      dbBooking({ payment: { refunds: [{ amount: 612000 }] } }),
    );
    await svc.sendBookingEmail('b1', 'CANCELLED');
    expect(sendMail.mock.calls[0][0].html).toContain('612.000');
  });

  it('chuyến bị hủy → gửi cho mọi đơn đang giữ chỗ hoặc đã thanh toán của chuyến', async () => {
    const { svc, prisma, sendMail } = setup();
    await svc.notifyTripCancelled('t1');
    expect(prisma.booking.findMany.mock.calls[0][0].where).toEqual({
      tripId: 't1',
      status: { in: ['PENDING', 'CONFIRMED'] },
    });
    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(sendMail.mock.calls[0][0].subject).toMatch(/đã bị hủy/);
  });
});
