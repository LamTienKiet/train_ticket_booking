import { renderBookingEmail, BookingForEmail } from './booking-email';

const booking: BookingForEmail = {
  bookingCode: 'BK123',
  contactName: 'Nguyễn <b>An</b>',
  totalAmount: 1360000,
  refundAmount: null,
  trip: {
    tripCode: 'SE1-20261130',
    trainCode: 'SE1',
    departureTime: new Date('2026-11-29T23:00:00Z'),
  },
  tickets: [
    {
      passenger: 'Nguyễn An',
      from: 'Ga Hà Nội',
      to: 'Ga Sài Gòn',
      coach: 3,
      seat: '12',
      departure: new Date('2026-11-29T23:00:00Z'),
    },
    {
      passenger: 'Trần Bình',
      from: 'Ga Hà Nội',
      to: 'Ga Sài Gòn',
      coach: 3,
      seat: '13',
      departure: new Date('2026-11-29T23:00:00Z'),
    },
  ],
};

describe('renderBookingEmail', () => {
  it('đặt vé thành công: tiêu đề có mã đơn, nội dung có ghế, giờ VN và tổng tiền', () => {
    const { subject, html } = renderBookingEmail(
      'CONFIRMED',
      booking,
      'http://web',
    );
    expect(subject).toContain('BK123');
    expect(subject).toMatch(/thành công/i);
    expect(html).toContain('Toa 3 · Ghế 12');
    expect(html).toContain('Trần Bình');
    expect(html).toContain('06:00 30/11/2026'); // 23:00Z = 06:00 giờ VN hôm sau
    expect(html).toContain('1.360.000');
    expect(html).toContain('http://web/tickets');
  });

  it('chống chèn HTML từ dữ liệu khách nhập', () => {
    const { html } = renderBookingEmail('CONFIRMED', booking, 'http://web');
    expect(html).not.toContain('<b>An</b>');
    expect(html).toContain('&lt;b&gt;An&lt;/b&gt;');
  });

  it('hủy đơn có hoàn tiền: báo số tiền hoàn', () => {
    const { subject, html } = renderBookingEmail(
      'CANCELLED',
      { ...booking, refundAmount: 1224000 },
      'http://web',
    );
    expect(subject).toMatch(/đã hủy/i);
    expect(html).toContain('1.224.000');
  });

  it('hết hạn giữ chỗ và chuyến bị hủy có tiêu đề riêng', () => {
    expect(
      renderBookingEmail('EXPIRED', booking, 'http://web').subject,
    ).toMatch(/hết hạn/i);
    const trip = renderBookingEmail('TRIP_CANCELLED', booking, 'http://web');
    expect(trip.subject).toMatch(/chuyến tàu SE1/i);
    expect(trip.html).toContain('SE1-20261130');
  });
});
