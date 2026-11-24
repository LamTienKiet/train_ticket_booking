"use client";

import { PassengerForm, PassengerType } from "../types/booking.types";
import type { SeatMap } from "../../trips/seats/SeatPage";
import styles from "../page.module.css";

interface BookingSidebarSummaryProps {
  trip: Omit<SeatMap, "coaches"> | null;
  passengers: PassengerForm[];
  calculateSeatPrice: (base: number, type: PassengerType) => number;
  totalTicketPrice: number;
  totalInsurance: number;
  appliedDiscount: number;
  finalTotal: number;
  voucherCode: string;
  onVoucherCodeChange: (code: string) => void;
  onApplyVoucher: (e: React.FormEvent) => void;
  discountMessage: string;
}

const vnd = (n: number) => `${n.toLocaleString("vi-VN")} đ`;
const TYPE_LABEL: Record<PassengerType, string> = {
  ADULT: "Người lớn",
  CHILD: "Trẻ em (−25%)",
  STUDENT: "Sinh viên (−10%)",
  SENIOR: "Cao tuổi (−15%)",
};

export default function BookingSidebarSummary({
  trip,
  passengers,
  calculateSeatPrice,
  totalTicketPrice,
  totalInsurance,
  appliedDiscount,
  finalTotal,
  voucherCode,
  onVoucherCodeChange,
  onApplyVoucher,
  discountMessage,
}: BookingSidebarSummaryProps) {
  return (
    <aside className={styles.rightCol}>
      <div className={styles.sidebarCard}>
        <div className={styles.sidebarHeader}>
          <h3>Tóm tắt chuyến đi</h3>
          {trip && <span className={styles.trainTag}>Tàu {trip.trainCode}</span>}
        </div>

        {trip && (
          <div className={styles.itineraryBox}>
            <div className={styles.itineraryRow}>
              <span className={styles.timelineDot} aria-hidden />
              <div className={styles.stationName}>
                <span>Ga đi · {trip.departureDate}</span>
                <strong>{trip.originStation}</strong>
              </div>
              <span className={styles.stationTime}>{trip.departureTime}</span>
            </div>
            <div className={styles.itineraryDuration}>
              <span className={styles.durationLine} aria-hidden />
              <span className={styles.durationLabel}>Thời gian chạy {trip.duration}</span>
            </div>
            <div className={styles.itineraryRow}>
              <span className={styles.timelineDotDest} aria-hidden />
              <div className={styles.stationName}>
                <span>Ga đến</span>
                <strong>{trip.destinationStation}</strong>
              </div>
            </div>
          </div>
        )}

        <div className={styles.ticketItemsList}>
          <div className={styles.ticketSectionTitle}>Vé đã chọn ({passengers.length})</div>
          {passengers.map((p) => (
            <div key={p.id} className={styles.ticketItem}>
              <div className={styles.ticketItemLeft}>
                <span className={styles.ticketSeat}>
                  Toa {p.coachNumber} · Ghế {p.seatNumber}
                </span>
                <span className={styles.ticketType}>
                  {p.fullName || "Chưa nhập tên"} · {TYPE_LABEL[p.passengerType]}
                </span>
              </div>
              <div className={styles.ticketItemPrice}>{vnd(calculateSeatPrice(p.basePrice, p.passengerType))}</div>
            </div>
          ))}
        </div>

        <form onSubmit={onApplyVoucher} className={styles.voucherBox}>
          <input
            type="text"
            aria-label="Mã ưu đãi"
            placeholder="Mã ưu đãi"
            className={styles.voucherInput}
            value={voucherCode}
            onChange={(e) => onVoucherCodeChange(e.target.value)}
          />
          <button type="submit" className={styles.voucherBtn}>
            Áp dụng
          </button>
        </form>
        {discountMessage && (
          <p className={appliedDiscount > 0 ? styles.voucherSuccess : styles.voucherError}>{discountMessage}</p>
        )}

        <div className={styles.feeBreakdown}>
          <div className={styles.feeRow}>
            <span>Tiền vé ({passengers.length})</span>
            <span>{vnd(totalTicketPrice)}</span>
          </div>
          <div className={styles.feeRow}>
            <span>Bảo hiểm ({passengers.filter((p) => p.hasInsurance).length})</span>
            <span>{vnd(totalInsurance)}</span>
          </div>
          {appliedDiscount > 0 && (
            <div className={`${styles.feeRow} ${styles.discountRow}`}>
              <span>Giảm giá</span>
              <span>−{vnd(appliedDiscount)}</span>
            </div>
          )}
          <div className={styles.totalPaymentRow}>
            <span className={styles.totalPaymentLabel}>Tổng thanh toán</span>
            <span className={styles.totalPaymentValue}>{vnd(finalTotal)}</span>
          </div>
        </div>

        <ul className={styles.trustBox}>
          <li className={styles.trustItem}>
            <span aria-hidden>🔒</span> Giao dịch được mã hóa bảo mật
          </li>
          <li className={styles.trustItem}>
            <span aria-hidden>⚡</span> Xuất vé điện tử ngay khi thanh toán thành công
          </li>
        </ul>
      </div>
    </aside>
  );
}
