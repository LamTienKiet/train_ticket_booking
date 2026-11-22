"use client";

import Link from "next/link";
import styles from "../page.module.css";
import { PaymentOrderInfo } from "../types/payment.types";

interface BookingSuccessBannerProps {
  order: PaymentOrderInfo;
  onBackToPaymentPreview: () => void;
}

export default function BookingSuccessBanner({
  order,
  onBackToPaymentPreview,
}: BookingSuccessBannerProps) {
  return (
    <section className={styles.successBannerCard}>
      <div className={styles.successBannerTop}>
        <div className={styles.successCheckIcon}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>

        <div className={styles.successBannerContent}>
          <h1 className={styles.successTitle}>
            Đặt vé & Thanh toán thành công!
          </h1>
          <p className={styles.successDesc}>
            Hệ thống đã phát hành <strong>{order.tickets.length} vé điện tử</strong>{" "}
            và gửi bản PDF kèm mã QR lên tàu tới email{" "}
            <strong>{order.contactEmail}</strong> cùng tin nhắn SMS{" "}
            <strong>{order.contactPhone}</strong>.
          </p>
        </div>

        <div className={styles.pnrBox}>
          <span className={styles.pnrLabel}>MÃ ĐẶT CHỖ (PNR)</span>
          <strong className={styles.pnrCode}>{order.bookingCode}</strong>
          <span className={styles.pnrStatusBadge}>Đã thanh toán</span>
        </div>
      </div>

      <div className={styles.successActionsBar}>
        <div className={styles.successMetaSummary}>
          <span>
            Tổng tiền đã thanh toán:{" "}
            <strong>{order.totalAmount.toLocaleString("vi-VN")} đ</strong>
          </span>
        </div>

        <div className={styles.successButtonsGroup}>
          <button
            type="button"
            onClick={onBackToPaymentPreview}
            className={styles.secondaryActionBtn}
          >
            ← Xem lại màn hình thanh toán
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className={styles.secondaryActionBtn}
          >
            In toàn bộ vé
          </button>

          <Link href="/" className={styles.primaryActionBtn}>
            Về trang chủ
          </Link>
        </div>
      </div>
    </section>
  );
}

