"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../utils/axiosClient";
import { apiErrorMessage } from "../utils/apiError";
import { fmtDate, fmtTime } from "../utils/format";
import BarChart from "./_components/BarChart";
import StatCard from "./_components/StatCard";
import { STATUS_LABEL } from "./_components/StatusBadge";
import styles from "./admin.module.css";

type Stats = {
  revenue: number;
  ticketsSold: number;
  pendingBookings: number;
  tripsToday: number;
  bookingsByStatus: Record<string, number>;
  dailyRevenue: { date: string; amount: number }[];
  topRoutes: { routeName: string; revenue: number; tickets: number }[];
  upcomingTrips: { id: string; tripCode: string; departureTime: string; routeName: string; soldSeats: number; totalSeats: number }[];
};

const RANGES = [7, 30, 90];
const vnd = (n: number) => `${n.toLocaleString("vi-VN")} đ`;
// Rút gọn số tiền lớn cho thẻ số: 12.500.000 → 12,5 tr
const short = (n: number) =>
  n >= 1e9 ? `${(n / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ` : n >= 1e6 ? `${(n / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr` : vnd(n);
const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: "#15803d",
  PENDING: "#d97706",
  CANCELLED: "#b91c1c",
  EXPIRED: "#94a3b8",
  COMPLETED: "#1d4ed8",
};

export default function AdminOverview() {
  const [days, setDays] = useState(30);
  const [result, setResult] = useState<{ days: number; stats: Stats | null; error: string } | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .get<Stats>("/admin/stats", { params: { days } })
      .then((r) => alive && setResult({ days, stats: r.data, error: "" }))
      .catch((e) => alive && setResult({ days, stats: null, error: apiErrorMessage(e, "Không tải được số liệu.") }));
    return () => {
      alive = false;
    };
  }, [days]);

  const stats = result?.stats;
  const loading = result?.days !== days;
  const totalBookings = stats ? Object.values(stats.bookingsByStatus).reduce((a, b) => a + b, 0) : 0;

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Tổng quan</h1>
          <p className={styles.pageSub}>Doanh thu tính theo đơn đã thanh toán thành công, giờ Việt Nam.</p>
        </div>
        <div className={styles.tabs} role="tablist" aria-label="Khoảng thời gian">
          {RANGES.map((d) => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={days === d}
              className={`${styles.tab} ${days === d ? styles.tabActive : ""}`}
              onClick={() => setDays(d)}
            >
              {d} ngày
            </button>
          ))}
        </div>
      </div>

      {result?.error && (
        <div role="alert" className={styles.alertError} style={{ margin: "0 0 16px" }}>
          {result.error}
        </div>
      )}

      <div className={styles.statGrid} aria-busy={loading}>
        <StatCard icon="💰" label={`Doanh thu ${days} ngày`} value={stats ? short(stats.revenue) : "…"} hint={stats ? vnd(stats.revenue) : undefined} />
        <StatCard icon="🎫" label="Vé đã bán" value={stats ? stats.ticketsSold.toLocaleString("vi-VN") : "…"} hint={`Trong ${days} ngày`} />
        <StatCard icon="⏳" label="Đơn chờ thanh toán" value={stats ? String(stats.pendingBookings) : "…"} hint="Tự hết hạn sau 10 phút" />
        <StatCard icon="🚆" label="Chuyến chạy hôm nay" value={stats ? String(stats.tripsToday) : "…"} />
      </div>

      <div className={styles.stack}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Doanh thu theo ngày</h2>
          {stats && (
            <BarChart
              data={stats.dailyRevenue.map((d) => ({ label: `${d.date.slice(8, 10)}/${d.date.slice(5, 7)}`, value: d.amount }))}
              formatValue={vnd}
            />
          )}
        </section>

        <div className={styles.grid2}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Tuyến doanh thu cao nhất</h2>
            {stats && stats.topRoutes.length === 0 ? (
              <p className={styles.pageSub}>Chưa có doanh thu trong khoảng này.</p>
            ) : (
              <ul className={styles.list}>
                {stats?.topRoutes.map((r, i) => (
                  <li key={r.routeName} className={styles.listItem}>
                    <div>
                      <span className={styles.cellMain}>
                        {i + 1}. {r.routeName}
                      </span>
                      <span className={styles.cellSub}>{r.tickets} vé</span>
                    </div>
                    <strong>{vnd(r.revenue)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Đơn theo trạng thái</h2>
            {stats &&
              Object.entries(stats.bookingsByStatus).map(([s, n]) => (
                <div key={s} className={styles.hbar}>
                  <span>{STATUS_LABEL[s] ?? s}</span>
                  <span className={styles.progressTrack} style={{ height: 10 }}>
                    <span
                      className={styles.progressFill}
                      style={{ width: `${totalBookings ? (n / totalBookings) * 100 : 0}%`, background: STATUS_COLOR[s] ?? "#64748b" }}
                    />
                  </span>
                  <span>{n}</span>
                </div>
              ))}
          </section>
        </div>

        <section className={styles.card}>
          <div className={styles.pageHead} style={{ marginBottom: 12 }}>
            <h2 className={styles.cardTitle} style={{ margin: 0 }}>
              Chuyến khởi hành trong 24 giờ tới
            </h2>
            <Link href="/admin/trips" className={styles.crumb} style={{ margin: 0 }}>
              Tất cả chuyến →
            </Link>
          </div>
          {stats && stats.upcomingTrips.length === 0 ? (
            <p className={styles.pageSub}>Không có chuyến nào.</p>
          ) : (
            <ul className={styles.list}>
              {stats?.upcomingTrips.map((t) => (
                <li key={t.id} className={styles.listItem}>
                  <div>
                    <span className={styles.cellMain}>
                      {fmtTime(t.departureTime)} · {t.routeName}
                    </span>
                    <span className={styles.cellSub}>
                      {t.tripCode} · {fmtDate(t.departureTime)}
                    </span>
                  </div>
                  <div className={styles.progress} style={{ width: 180 }}>
                    <span className={styles.progressTrack}>
                      <span className={styles.progressFill} style={{ width: `${t.totalSeats ? (t.soldSeats / t.totalSeats) * 100 : 0}%` }} />
                    </span>
                    <span>
                      {t.soldSeats}/{t.totalSeats}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
