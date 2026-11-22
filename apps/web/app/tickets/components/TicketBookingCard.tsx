"use client";

import Link from "next/link";
import styles from "../page.module.css";
import { BookingRecord, BookingRecordStatus } from "../types/ticket.types";

interface TicketBookingCardProps {
  booking: BookingRecord;
  onViewDetail: (booking: BookingRecord) => void;
  onRequestCancel: (booking: BookingRecord) => void;
}

const STATUS_META: Record<
  BookingRecordStatus,
  { label: string; badgeClass: string }
> = {
  CONFIRMED: {
    label: "Sắp khởi hành",
    badgeClass: "badgeConfirmed",
  },
  PENDING: {
    label: "Chờ thanh toán",
    badgeClass: "badgePending",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    badgeClass: "badgeCompleted",
  },
  CANCELLED: {
    label: "Đã hủy",
    badgeClass: "badgeCancelled",
  },
};

export default function TicketBookingCard({
  booking,
  onViewDetail,
  onRequestCancel,
}: TicketBookingCardProps) {
  const statusInfo = STATUS_META[booking.status];
  const seatsParam = booking.tickets
    .map((t) => `${t.coachNumber}-${t.seatNumber}`)
    .join(",");

  return (
    <article
      className={`${styles.bookingCard} ${
        booking.status === "CANCELLED" ? styles.bookingCardCancelled : ""
      }`}
    >
      {/* HEADER CARD: MÃ PNR & TRẠNG THÁI */}
      <div className={styles.bookingCardHeader}>
        <div className={styles.bookingIdGroup}>
          <span className={styles.pnrLabel}>MÃ ĐẶT CHỖ:</span>
          <strong className={styles.pnrCode}>{booking.bookingCode}</strong>
          <span className={styles.bookedAtText}>• Đặt lúc {booking.bookedAt}</span>
        </div>

        <span className={`${styles.statusBadge} ${styles[statusInfo.badgeClass]}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* NỘI DUNG CHUYẾN TÀU & HÀNH KHÁCH */}
      <div className={styles.bookingCardBody}>
        {/* Cột lộ trình */}
        <div className={styles.routeTimelineCol}>
          <div className={styles.trainPill}>Tàu {booking.trainCode}</div>

          <div className={styles.routeStationsRow}>
            <div className={styles.stationPoint}>
              <strong className={styles.timeLarge}>{booking.departureTime}</strong>
              <span className={styles.stationName}>
                {booking.originStation} ({booking.originCode})
              </span>
              <span className={styles.dateSmall}>{booking.departureDate}</span>
            </div>

            <div className={styles.routeConnector}>
              <span className={styles.durationLabel}>{booking.duration}</span>
              <div className={styles.connectorLine}>
                <span className={styles.dotStart}></span>
                <span className={styles.lineDash}></span>
                <span className={styles.arrowEnd}>➔</span>
              </div>
            </div>

            <div className={styles.stationPoint} style={{ textAlign: "right" }}>
              <strong className={styles.timeLarge}>{booking.arrivalTime}</strong>
              <span className={styles.stationName}>
                {booking.destinationStation} ({booking.destinationCode})
              </span>
              <span className={styles.dateSmall}>{booking.arrivalDate}</span>
            </div>
          </div>
        </div>

        {/* Cột danh sách ghế / hành khách */}
        <div className={styles.passengersCol}>
          <div className={styles.passengersColTitle}>
            Danh sách vé ({booking.tickets.length} hành khách):
          </div>
          <div className={styles.seatTagsGrid}>
            {booking.tickets.map((t) => (
              <div key={t.ticketCode} className={styles.passengerSeatTag}>
                <span className={styles.seatTagCode}>
                  Toa {t.coachNumber} - Ghế {t.seatNumber}
                </span>
                <span className={styles.seatTagName}>{t.passengerName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER CARD: TỔNG TIỀN & CÁC NÚT THAO TÁC */}
      <div className={styles.bookingCardFooter}>
        <div className={styles.totalAmountBlock}>
          <span className={styles.totalLabel}>Tổng thanh toán:</span>
          <strong className={styles.totalValue}>
            {booking.totalAmount.toLocaleString("vi-VN")} đ
          </strong>
        </div>

        <div className={styles.cardActions}>
          {booking.status === "CONFIRMED" && (
            <>
              <button
                type="button"
                onClick={() => onRequestCancel(booking)}
                className={styles.cancelOutlineBtn}
              >
                Yêu cầu hủy vé
              </button>
              <button
                type="button"
                onClick={() => onViewDetail(booking)}
                className={styles.primaryBtn}
              >
                Xem vé & Mã QR
              </button>
            </>
          )}

          {booking.status === "PENDING" && (
            <>
              <button
                type="button"
                onClick={() => onRequestCancel(booking)}
                className={styles.cancelOutlineBtn}
              >
                Hủy giữ chỗ
              </button>
              <Link
                href={`/payment?train=${booking.trainCode}&seats=${seatsParam}&total=${booking.totalAmount}`}
                className={styles.payNowBtn}
              >
                Thanh toán ngay →
              </Link>
            </>
          )}

          {booking.status === "COMPLETED" && (
            <>
              <button
                type="button"
                onClick={() => onViewDetail(booking)}
                className={styles.secondaryBtn}
              >
                Xem chi tiết vé
              </button>
              <Link href="/trips" className={styles.primaryOutlineBtn}>
                Đặt lại tuyến này
              </Link>
            </>
          )}

          {booking.status === "CANCELLED" && (
            <Link href="/trips" className={styles.primaryOutlineBtn}>
              Đặt lại chuyến khác
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

