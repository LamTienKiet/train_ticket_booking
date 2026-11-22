"use client";

import { useState } from "react";
import styles from "../page.module.css";
import { BookingRecord } from "../types/ticket.types";

interface CancelTicketModalProps {
  booking: BookingRecord | null;
  onClose: () => void;
  onConfirmCancel: (bookingId: string, reason: string) => void;
}

export default function CancelTicketModal({
  booking,
  onClose,
  onConfirmCancel,
}: CancelTicketModalProps) {
  const [reason, setReason] = useState("Thay đổi lịch trình cá nhân");

  if (!booking) return null;

  const isPending = booking.status === "PENDING";
  const refundFee = isPending ? 0 : Math.round(booking.totalAmount * 0.1);
  const refundAmount = booking.totalAmount - refundFee;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.cancelModalContainer}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>
              {isPending
                ? `Hủy giữ chỗ đơn ${booking.bookingCode}`
                : `Yêu cầu hủy & hoàn vé ${booking.bookingCode}`}
            </h2>
            <p className={styles.modalSub}>
              Tàu {booking.trainCode}: {booking.originStation} ➔{" "}
              {booking.destinationStation} ({booking.departureDate})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.modalCloseBtn}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {!isPending ? (
            <div className={styles.refundPolicyBox}>
              <div className={styles.refundRow}>
                <span>Tổng tiền vé đã thanh toán:</span>
                <strong>{booking.totalAmount.toLocaleString("vi-VN")} đ</strong>
              </div>
              <div className={styles.refundRow}>
                <span>Phí hoàn trả vé theo quy định (10%):</span>
                <strong style={{ color: "#dc2626" }}>
                  -{refundFee.toLocaleString("vi-VN")} đ
                </strong>
              </div>
              <div className={`${styles.refundRow} ${styles.refundTotalRow}`}>
                <span>Số tiền dự kiến hoàn lại:</span>
                <strong style={{ color: "#16a34a", fontSize: "16px" }}>
                  {refundAmount.toLocaleString("vi-VN")} đ
                </strong>
              </div>
              <p className={styles.refundHint}>
                Tiền hoàn sẽ được chuyển về phương thức thanh toán ban đầu trong
                vòng 3 - 5 ngày làm việc.
              </p>
            </div>
          ) : (
            <p className={styles.pendingCancelText}>
              Đơn đặt vé này đang ở trạng thái <strong>Chờ thanh toán</strong>.
              Nếu hủy giữ chỗ, các ghế đã chọn sẽ được giải phóng ngay lập tức
              cho hành khách khác.
            </p>
          )}

          <div className={styles.cancelReasonGroup}>
            <label className={styles.lookupLabel}>Lý do hủy vé</label>
            <select
              className={styles.lookupInput}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="Thay đổi lịch trình cá nhân">
                Thay đổi lịch trình cá nhân
              </option>
              <option value="Đặt nhầm ngày đi hoặc loại chỗ">
                Đặt nhầm ngày đi hoặc loại chỗ
              </option>
              <option value="Muốn đổi sang chuyến tàu khác">
                Muốn đổi sang chuyến tàu khác
              </option>
              <option value="Lý do khác">Lý do khác</option>
            </select>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            className={styles.secondaryBtn}
          >
            Giữ lại vé
          </button>
          <button
            type="button"
            onClick={() => onConfirmCancel(booking.id, reason)}
            className={styles.dangerBtn}
          >
            Xác nhận hủy vé
          </button>
        </div>
      </div>
    </div>
  );
}

