// Doanh thu/ngày luôn tính theo ngày giờ Việt Nam
export const vnDate = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

/** Gom tiền theo ngày VN cho `days` ngày gần nhất (tính cả hôm nay), ngày trống = 0 */
export function bucketDaily(
  rows: { at: Date; amount: number }[],
  days: number,
  now: Date,
): { date: string; amount: number }[] {
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    buckets.set(vnDate(new Date(now.getTime() - i * 86_400_000)), 0);
  }
  for (const r of rows) {
    const key = vnDate(r.at);
    if (buckets.has(key)) buckets.set(key, buckets.get(key)! + r.amount);
  }
  return [...buckets].map(([date, amount]) => ({ date, amount }));
}
