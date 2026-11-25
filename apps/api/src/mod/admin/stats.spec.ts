import { bucketDaily, vnDate } from './stats';

describe('bucketDaily', () => {
  const now = new Date('2026-11-25T05:00:00Z'); // 12:00 ngày 25/11 giờ VN

  it('đủ số ngày, tăng dần, ngày trống bằng 0', () => {
    const out = bucketDaily([], 3, now);
    expect(out).toEqual([
      { date: '2026-11-23', amount: 0 },
      { date: '2026-11-24', amount: 0 },
      { date: '2026-11-25', amount: 0 },
    ]);
  });

  it('cộng dồn các khoản cùng ngày theo giờ VN', () => {
    const out = bucketDaily(
      [
        { at: new Date('2026-11-24T02:00:00Z'), amount: 100 },
        { at: new Date('2026-11-24T10:00:00Z'), amount: 50 },
        // 01:30 ngày 25/11 giờ VN dù là 24/11 theo UTC
        { at: new Date('2026-11-24T18:30:00Z'), amount: 7 },
      ],
      2,
      now,
    );
    expect(out).toEqual([
      { date: '2026-11-24', amount: 150 },
      { date: '2026-11-25', amount: 7 },
    ]);
  });

  it('bỏ qua khoản nằm ngoài khoảng ngày', () => {
    expect(bucketDaily([{ at: new Date('2026-11-01T00:00:00Z'), amount: 9 }], 2, now)[0].amount).toBe(0);
  });

  it('vnDate đổi sang ngày giờ VN', () => {
    expect(vnDate(new Date('2026-11-24T18:30:00Z'))).toBe('2026-11-25');
  });
});
