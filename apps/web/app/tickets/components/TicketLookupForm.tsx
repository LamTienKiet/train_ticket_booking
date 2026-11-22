"use client";

import styles from "../page.module.css";
import { TicketViewMode } from "../types/ticket.types";

interface TicketLookupFormProps {
  viewMode: TicketViewMode;
  onViewModeChange: (mode: TicketViewMode) => void;
  bookingCodeQuery: string;
  onBookingCodeQueryChange: (val: string) => void;
  contactQuery: string;
  onContactQueryChange: (val: string) => void;
  onSubmitLookup: (e: React.FormEvent) => void;
  onResetLookup: () => void;
}

export default function TicketLookupForm({
  viewMode,
  onViewModeChange,
  bookingCodeQuery,
  onBookingCodeQueryChange,
  contactQuery,
  onContactQueryChange,
  onSubmitLookup,
  onResetLookup,
}: TicketLookupFormProps) {
  return (
    <section className={styles.heroLookupCard}>
      <div className={styles.heroLookupTop}>
        <div>
          <h1 className={styles.pageTitle}>Quản Lý & Tra Cứu Vé Điện Tử</h1>
          <p className={styles.pageSubtitle}>
            Kiểm tra trạng thái đặt chỗ, xem mã QR lên tàu hoặc thực hiện đổi/trả
            vé trực tuyến.
          </p>
        </div>

        {/* Chuyển nhanh 2 chế độ: Vé của tôi vs Tra cứu PNR */}
        <div className={styles.viewModeSwitch}>
          <button
            type="button"
            onClick={() => onViewModeChange("MY_TICKETS")}
            className={`${styles.viewModeBtn} ${
              viewMode === "MY_TICKETS" ? styles.viewModeActive : ""
            }`}
          >
            Vé của tôi
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("QUICK_LOOKUP")}
            className={`${styles.viewModeBtn} ${
              viewMode === "QUICK_LOOKUP" ? styles.viewModeActive : ""
            }`}
          >
            Tra cứu theo mã PNR
          </button>
        </div>
      </div>

      {/* Form tra cứu nhanh hiển thị ở chế độ QUICK_LOOKUP (hoặc tìm kiếm nhanh) */}
      {viewMode === "QUICK_LOOKUP" && (
        <form onSubmit={onSubmitLookup} className={styles.lookupForm}>
          <div className={styles.lookupField}>
            <label className={styles.lookupLabel}>
              Mã đặt chỗ (PNR) <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={styles.lookupInput}
              placeholder="Ví dụ: LR-849201"
              value={bookingCodeQuery}
              onChange={(e) =>
                onBookingCodeQueryChange(e.target.value.toUpperCase())
              }
            />
          </div>

          <div className={styles.lookupField}>
            <label className={styles.lookupLabel}>
              Số điện thoại hoặc Email đặt vé{" "}
              <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={styles.lookupInput}
              placeholder="Ví dụ: 0912345678 hoặc email@domain.com"
              value={contactQuery}
              onChange={(e) => onContactQueryChange(e.target.value)}
            />
          </div>

          <div className={styles.lookupActions}>
            <button type="submit" className={styles.lookupSubmitBtn}>
              Tra cứu vé
            </button>
            <button
              type="button"
              onClick={onResetLookup}
              className={styles.lookupResetBtn}
            >
              Đặt lại
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

