export type BookingEmailKind =
  'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'TRIP_CANCELLED';

export type BookingForEmail = {
  bookingCode: string;
  contactName: string | null;
  totalAmount: number;
  refundAmount: number | null;
  trip: { tripCode: string; trainCode: string; departureTime: Date };
  tickets: {
    passenger: string;
    from: string;
    to: string;
    coach: number;
    seat: string;
    departure: Date | null;
  }[];
};

const TZ = 'Asia/Ho_Chi_Minh';
const fmtTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const fmtDay = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const when = (d: Date) => `${fmtTime.format(d)} ${fmtDay.format(d)}`;
const money = (n: number) => `${n.toLocaleString('vi-VN')} đ`;
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );

/** Tiêu đề + HTML của email gửi khách; mọi chuỗi khách nhập đều được escape */
export function renderBookingEmail(
  kind: BookingEmailKind,
  b: BookingForEmail,
  webUrl: string,
) {
  const code = esc(b.bookingCode);
  const train = esc(b.trip.trainCode);
  const { subject, intro } = {
    CONFIRMED: {
      subject: `Đặt vé thành công - Mã đơn ${b.bookingCode}`,
      intro: `Thanh toán đã được xác nhận. Dưới đây là vé điện tử của đơn <b>${code}</b>.`,
    },
    CANCELLED: {
      subject: `Đơn ${b.bookingCode} đã hủy`,
      intro:
        `Đơn <b>${code}</b> đã được hủy và ghế đã được nhả.` +
        (b.refundAmount
          ? ` Số tiền hoàn: <b>${money(b.refundAmount)}</b>.`
          : ''),
    },
    EXPIRED: {
      subject: `Đơn ${b.bookingCode} đã hết hạn giữ chỗ`,
      intro: `Đơn <b>${code}</b> chưa được thanh toán trong thời gian giữ chỗ nên đã hết hạn. Bạn có thể đặt lại trên website.`,
    },
    TRIP_CANCELLED: {
      subject: `Chuyến tàu ${b.trip.trainCode} của đơn ${b.bookingCode} đã bị hủy`,
      intro:
        `Rất tiếc, chuyến <b>${esc(b.trip.tripCode)}</b> (tàu ${train}, khởi hành ${when(b.trip.departureTime)}) đã bị hủy. ` +
        `Nhân viên LionRail sẽ liên hệ để hỗ trợ đổi vé hoặc hoàn tiền cho đơn <b>${code}</b>.`,
    },
  }[kind];

  const rows = b.tickets
    .map(
      (t) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${esc(t.passenger)}</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #eee">${esc(t.from)} → ${esc(t.to)}` +
        (t.departure
          ? `<br><small>Khởi hành ${when(t.departure)}</small>`
          : '') +
        `</td><td style="padding:6px 8px;border-bottom:1px solid #eee">Toa ${t.coach} · Ghế ${esc(t.seat)}</td></tr>`,
    )
    .join('');

  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;color:#111">
<h2 style="color:#ea580c;margin:0 0 12px">LionRail</h2>
<p>Xin chào ${esc(b.contactName || 'quý khách')},</p>
<p>${intro}</p>
<p><b>Tàu ${train}</b> · Mã chuyến ${esc(b.trip.tripCode)}</p>
<table style="border-collapse:collapse;width:100%;font-size:14px">
<tr style="background:#f3f4f6"><th align="left" style="padding:6px 8px">Hành khách</th><th align="left" style="padding:6px 8px">Hành trình</th><th align="left" style="padding:6px 8px">Chỗ</th></tr>
${rows}
</table>
<p>Tổng tiền: <b>${money(b.totalAmount)}</b></p>
<p><a href="${esc(webUrl)}/tickets" style="color:#ea580c">Tra cứu vé trên LionRail</a></p>
<p style="color:#6b7280;font-size:12px">Email gửi tự động, vui lòng không trả lời.</p>
</div>`;

  return { subject, html };
}
