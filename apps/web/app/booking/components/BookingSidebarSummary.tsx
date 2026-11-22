"use client";

import { PassengerForm, PassengerType } from "../types/booking.types";
import styles from "../page.module.css";

interface BookingSidebarSummaryProps {
  trainCode: string;
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

export default function BookingSidebarSummary({
  trainCode,
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
          <span className={styles.trainTag}>Tàu {trainCode}</span>
        </div>

        {/* Thông tin lộ trình */}
        <div className={styles.itineraryBox}>
          <div className={styles.itineraryRow}>
            <div className={styles.stationTime}>06:00</div>
            <div className={styles.timelineDot}></div>
            <div className={styles.stationName}>
              <strong>Hà Nội (HAN)</strong>
              <span>15/01/2026</span>
            </div>
          </div>

          <div className={styles.itineraryDuration}>
            <div className={styles.durationLine}></div>
            <span className={styles.durationLabel}>37 giờ 30 phút</span>
          </div>

          <div className={styles.itineraryRow}>
            <div className={styles.stationTime}>19:30</div>
            <div className={styles.timelineDotDest}></div>
            <div className={styles.stationName}>
              <strong>Sài Gòn (SGO)</strong>
              <span>16/01/2026</span>
            </div>
          </div>
        </div>

        <div className={styles.divider}></div>

        {/* Chi tiết từng vé */}
        <div className={styles.ticketItemsList}>
          <div className={styles.ticketSectionTitle}>
            Vé đã chọn ({passengers.length})
          </div>
          {passengers.map((p) => {
            const price = calculateSeatPrice(p.basePrice, p.passengerType);
            return (
              <div key={p.id} className={styles.ticketItem}>
                <div className={styles.ticketItemLeft}>
                  <span className={styles.ticketSeat}>{p.seatLabel}</span>
                  <span className={styles.ticketType}>
                    {p.passengerType === "CHILD"
                      ? "Trẻ em (-25%)"
                      : p.passengerType === "STUDENT"
                      ? "Sinh viên (-10%)"
                      : p.passengerType === "SENIOR"
                      ? "Cao tuổi (-15%)"
                      : "Người lớn"}
                  </span>
                </div>
                <div className={styles.ticketItemPrice}>
                  {price.toLocaleString("vi-VN")} đ
                </div>
              </div>
            );
          })}
        </div>

        {/* Nhập mã Voucher */}
        <form onSubmit={onApplyVoucher} className={styles.voucherBox}>
          <input
            type="text"
            placeholder="Nhập mã ưu đãi (ví dụ: LIONRAIL50)"
            className={styles.voucherInput}
            value={voucherCode}
            onChange={(e) => onVoucherCodeChange(e.target.value)}
          />
          <button type="submit" className={styles.voucherBtn}>
            Áp dụng
          </button>
        </form>
        {discountMessage && (
          <p
            className={
              appliedDiscount > 0
                ? styles.voucherSuccess
                : styles.voucherError
            }
          >
            {discountMessage}
          </p>
        )}

        <div className={styles.divider}></div>

        {/* Bảng chi tiết tiền */}
        <div className={styles.feeBreakdown}>
          <div className={styles.feeRow}>
            <span>Tổng tiền vé:</span>
            <span>{totalTicketPrice.toLocaleString("vi-VN")} đ</span>
          </div>

          <div className={styles.feeRow}>
            <span>Phí bảo hiểm hành khách:</span>
            <span>{totalInsurance.toLocaleString("vi-VN")} đ</span>
          </div>

          {appliedDiscount > 0 && (
            <div className={`${styles.feeRow} ${styles.discountRow}`}>
              <span>Giảm giá khuyến mãi:</span>
              <span>-{appliedDiscount.toLocaleString("vi-VN")} đ</span>
            </div>
          )}

          <div className={styles.totalPaymentRow}>
            <span className={styles.totalPaymentLabel}>
              Tổng tiền thanh toán:
            </span>
            <span className={styles.totalPaymentValue}>
              {finalTotal.toLocaleString("vi-VN")} đ
            </span>
          </div>
        </div>

        {/* Ghi chú an toàn */}
        <div className={styles.trustBox}>
          <div className={styles.trustItem}>
            <span>🔒</span> Giao dịch bảo mật chuẩn SSL 256-bit
          </div>
          <div className={styles.trustItem}>
            <span>⚡</span> Xuất vé điện tử ngay khi thanh toán thành công
          </div>
        </div>
      </div>
    </aside>
  );
}

