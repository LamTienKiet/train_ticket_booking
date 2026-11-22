"use client";

import styles from "../page.module.css";
import { BookingRecord } from "../types/ticket.types";
import QrCodeGraphic from "../../payment/components/QrCodeGraphic";

interface TicketDetailModalProps {
  booking: BookingRecord | null;
  onClose: () => void;
}

export default function TicketDetailModal({
  booking,
  onClose,
}: TicketDetailModalProps) {
  if (!booking) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>
              Chi tiết vé điện tử • {booking.bookingCode}
            </h2>
            <p className={styles.modalSub}>
              Tàu {booking.trainCode}: {booking.originStation} ➔{" "}
              {booking.destinationStation} ({booking.departureTime} •{" "}
              {booking.departureDate})
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
          {/* Danh sách từng vé có QR */}
          <div className={styles.modalTicketsList}>
            {booking.tickets.map((ticket, index) => (
              <div key={ticket.ticketCode} className={styles.modalTicketItem}>
                <div className={styles.modalTicketInfo}>
                  <div className={styles.modalTicketTop}>
                    <span className={styles.modalTicketIndex}>
                      Vé #{index + 1}
                    </span>
                    <strong className={styles.modalTicketCode}>
                      {ticket.ticketCode}
                    </strong>
                  </div>

                  <div className={styles.modalInfoGrid}>
                    <div>
                      <span className={styles.metaLabel}>Hành khách</span>
                      <strong className={styles.metaVal}>
                        {ticket.passengerName}
                      </strong>
                    </div>
                    <div>
                      <span className={styles.metaLabel}>CCCD / CMND</span>
                      <strong className={styles.metaVal}>{ticket.idCard}</strong>
                    </div>
                    <div>
                      <span className={styles.metaLabel}>Vị trí ngồi</span>
                      <strong className={styles.metaHighlight}>
                        Toa {ticket.coachNumber} - Ghế {ticket.seatNumber}
                      </strong>
                    </div>
                    <div>
                      <span className={styles.metaLabel}>Loại chỗ</span>
                      <strong className={styles.metaVal}>{ticket.seatType}</strong>
                    </div>
                  </div>
                </div>

                <div className={styles.modalTicketQr}>
                  <QrCodeGraphic size={104} seed={ticket.ticketCode} />
                  <span className={styles.qrCaption}>Quét khi lên tàu</span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.modalContactSummary}>
            <span>
              Người đặt: <strong>{booking.contactName}</strong>
            </span>
            <span>
              SĐT: <strong>{booking.contactPhone}</strong>
            </span>
            <span>
              Email: <strong>{booking.contactEmail}</strong>
            </span>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={() => window.print()}
            className={styles.secondaryBtn}
          >
            In vé
          </button>
          <button type="button" onClick={onClose} className={styles.primaryBtn}>
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
}

