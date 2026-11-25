"use client";

import { useState } from "react";
import { api } from "../../utils/axiosClient";
import { apiErrorMessage } from "../../utils/apiError";
import { fmtDate, fmtTime } from "../../utils/format";
import ConfirmDialog from "../_components/ConfirmDialog";
import DataTable, { type Column } from "../_components/DataTable";
import StatusBadge, { STATUS_LABEL } from "../_components/StatusBadge";
import { useAdminList } from "../_components/useAdminList";
import styles from "../admin.module.css";

type BookingRow = {
  bookingCode: string;
  status: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  totalAmount: number;
  seatCount: number;
  createdAt: string;
  trip: { tripCode: string; departureTime: string; route: { name: string } };
};

type BookingDetail = {
  bookingCode: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  expiresAt: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  trip: { tripCode: string; departureTime: string; train: { code: string }; route: { name: string } };
  passengers: {
    id: string;
    fullName: string;
    idNumber: string;
    passengerType: string;
    bookingSeats: {
      id: string;
      price: string;
      status: string;
      seat: { seatNumber: string; coach: { coachNumber: number }; seatType: { name: string } };
      originStation: { name: string };
      destinationStation: { name: string };
      ticketIssue: { ticketNumber: string } | null;
    }[];
  }[];
  payment: { status: string; paymentMethod: string | null; amount: string; paidAt: string | null } | null;
};

const TABS = ["", "PENDING", "CONFIRMED", "CANCELLED", "EXPIRED", "COMPLETED"];
const PAX: Record<string, string> = { ADULT: "Người lớn", CHILD: "Trẻ em", STUDENT: "Sinh viên", SENIOR: "Cao tuổi", INFANT: "Em bé" };
const LIMIT = 20;
const vnd = (n: number | string) => `${Number(n).toLocaleString("vi-VN")} đ`;

export default function BookingsPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const list = useAdminList<BookingRow>("/bookings/admin", { status, search, page, limit: LIMIT });

  const openDetail = async (code: string) => {
    setDetailError("");
    try {
      const { data } = await api.get<BookingDetail>(`/bookings/${code}`);
      setDetail(data);
    } catch (e) {
      setDetail(null);
      setDetailError(apiErrorMessage(e, "Không tải được chi tiết đơn."));
    }
  };

  const columns: Column<BookingRow>[] = [
    { key: "code", label: "Mã đơn", render: (b) => <span className={styles.mono}>{b.bookingCode}</span> },
    {
      key: "contact",
      label: "Khách",
      render: (b) => (
        <>
          <span className={styles.cellMain}>{b.contactName || "—"}</span>
          <span className={styles.cellSub}>{b.contactPhone}</span>
        </>
      ),
    },
    {
      key: "trip",
      label: "Chuyến",
      render: (b) => (
        <>
          <span className={styles.cellMain}>{b.trip.route.name}</span>
          <span className={styles.cellSub}>
            {b.trip.tripCode} · {fmtTime(b.trip.departureTime)} {fmtDate(b.trip.departureTime)}
          </span>
        </>
      ),
    },
    { key: "seats", label: "Vé", align: "right", render: (b) => b.seatCount },
    { key: "total", label: "Tổng tiền", align: "right", render: (b) => <strong>{vnd(b.totalAmount)}</strong> },
    { key: "status", label: "Trạng thái", render: (b) => <StatusBadge value={b.status} /> },
    {
      key: "created",
      label: "Ngày đặt",
      render: (b) => (
        <>
          {fmtDate(b.createdAt)}
          <span className={styles.cellSub}>{fmtTime(b.createdAt)}</span>
        </>
      ),
    },
  ];

  const canCancel = detail && !["CANCELLED", "EXPIRED"].includes(detail.status);

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Đơn đặt vé</h1>
          <p className={styles.pageSub}>Bấm vào một đơn để xem hành khách, ghế và thanh toán.</p>
        </div>
      </div>

      {detailError && (
        <div role="alert" className={styles.alertError} style={{ margin: "0 0 16px" }}>
          {detailError}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(b) => b.bookingCode}
        loading={list.loading}
        error={list.error}
        onRowClick={(b) => openDetail(b.bookingCode)}
        total={list.total}
        page={page}
        limit={LIMIT}
        onPageChange={setPage}
        emptyText="Không có đơn nào."
        toolbar={
          <>
            <input
              className={`${styles.input} ${styles.search}`}
              placeholder="Tìm mã đơn, SĐT, email..."
              aria-label="Tìm đơn"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <div className={styles.tabs} role="tablist" aria-label="Lọc trạng thái">
              {TABS.map((s) => (
                <button
                  key={s || "all"}
                  type="button"
                  role="tab"
                  aria-selected={status === s}
                  className={`${styles.tab} ${status === s ? styles.tabActive : ""}`}
                  onClick={() => {
                    setStatus(s);
                    setPage(1);
                  }}
                >
                  {s ? STATUS_LABEL[s] : "Tất cả"}
                </button>
              ))}
            </div>
          </>
        }
      />

      {detail && (
        <div className={styles.overlay} style={{ padding: 0 }} onMouseDown={(e) => e.target === e.currentTarget && setDetail(null)}>
          <aside className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="booking-title">
            <div className={styles.modalHead}>
              <h2 id="booking-title">
                Đơn <span className={styles.mono}>{detail.bookingCode}</span>
              </h2>
              <button type="button" className={styles.iconBtn} aria-label="Đóng" onClick={() => setDetail(null)}>
                ×
              </button>
            </div>
            <div className={styles.drawerBody}>
              <div>
                <StatusBadge value={detail.status} />
              </div>

              <section>
                <h3 className={styles.sectionLabel}>Chuyến</h3>
                <dl className={styles.kv}>
                  <dt>Tuyến</dt>
                  <dd>{detail.trip.route.name}</dd>
                  <dt>Tàu / Mã chuyến</dt>
                  <dd>
                    {detail.trip.train.code} · {detail.trip.tripCode}
                  </dd>
                  <dt>Khởi hành</dt>
                  <dd>
                    {fmtTime(detail.trip.departureTime)} {fmtDate(detail.trip.departureTime)}
                  </dd>
                </dl>
              </section>

              <section>
                <h3 className={styles.sectionLabel}>Người đặt</h3>
                <dl className={styles.kv}>
                  <dt>Họ tên</dt>
                  <dd>{detail.contactName || "—"}</dd>
                  <dt>SĐT</dt>
                  <dd>{detail.contactPhone || "—"}</dd>
                  <dt>Email</dt>
                  <dd>{detail.contactEmail || "—"}</dd>
                  <dt>Đặt lúc</dt>
                  <dd>
                    {fmtTime(detail.createdAt)} {fmtDate(detail.createdAt)}
                  </dd>
                </dl>
              </section>

              <section>
                <h3 className={styles.sectionLabel}>Hành khách &amp; ghế</h3>
                <ul className={styles.list}>
                  {detail.passengers.flatMap((p) =>
                    p.bookingSeats.map((bs) => (
                      <li key={bs.id} className={styles.listItem}>
                        <div>
                          <span className={styles.cellMain}>
                            {p.fullName} · {PAX[p.passengerType] ?? p.passengerType}
                          </span>
                          <span className={styles.cellSub}>
                            Toa {bs.seat.coach.coachNumber} · Ghế {bs.seat.seatNumber} · {bs.seat.seatType.name}
                          </span>
                          <span className={styles.cellSub}>
                            {bs.originStation.name} → {bs.destinationStation.name}
                            {bs.ticketIssue && ` · Vé ${bs.ticketIssue.ticketNumber}`}
                          </span>
                        </div>
                        <strong>{vnd(bs.price)}</strong>
                      </li>
                    )),
                  )}
                </ul>
              </section>

              <section>
                <h3 className={styles.sectionLabel}>Thanh toán</h3>
                <dl className={styles.kv}>
                  <dt>Tổng tiền</dt>
                  <dd>{vnd(detail.totalAmount)}</dd>
                  <dt>Trạng thái</dt>
                  <dd>{detail.payment ? <StatusBadge value={detail.payment.status} /> : "Chưa thanh toán"}</dd>
                  {detail.payment?.paidAt && (
                    <>
                      <dt>Thanh toán lúc</dt>
                      <dd>
                        {fmtTime(detail.payment.paidAt)} {fmtDate(detail.payment.paidAt)}
                      </dd>
                    </>
                  )}
                </dl>
              </section>
            </div>
            {canCancel && (
              <div className={styles.modalFoot}>
                <button type="button" className={styles.btnDanger} onClick={() => setCancelling(true)}>
                  Hủy đơn
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={cancelling}
        title={`Hủy đơn ${detail?.bookingCode ?? ""}?`}
        danger
        confirmLabel="Hủy đơn"
        message="Ghế của đơn sẽ được nhả ra để bán lại. Đơn đã thanh toán sẽ được ghi nhận hoàn tiền theo quy định."
        onClose={() => setCancelling(false)}
        onConfirm={async () => {
          await api.post(`/bookings/${detail!.bookingCode}/cancel`, { reason: "Hủy bởi quản trị viên" });
          await openDetail(detail!.bookingCode);
          list.reload();
        }}
      />
    </>
  );
}
