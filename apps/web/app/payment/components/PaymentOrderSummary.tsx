"use client";

import Link from "next/link";
import styles from "../page.module.css";
import { PaymentOrderInfo } from "../types/payment.types";

interface PaymentOrderSummaryProps {
  order: PaymentOrderInfo;
}

export default function PaymentOrderSummary({
  order,
}: PaymentOrderSummaryProps) {
  return (
    <aside className={styles.rightCol}>
      <div className={styles.sidebarCard}>
        <div className={styles.sidebarHeader}>
          <h3>Thông tin đơn đặt vé</h3>
          <span className={styles.pendingStatusBadge}>Chờ thanh toán</span>
        </div>

        {/* Lộ trình chuyến tàu */}
        <div className={styles.itineraryBox}>
          <div className={styles.trainTopRow}>
            <span className={styles.trainTag}>Tàu {order.trainCode}</span>
            <span className={styles.durationText}>{order.duration}</span>
          </div>

          <div className={styles.itineraryRow}>
            <div className={styles.stationTime}>{order.departureTime}</div>
            <div className={styles.timelineDot}></div>
            <div className={styles.stationName}>
              <strong>
                {order.originStation} ({order.originCode})
              </strong>
              <span>{order.departureDate}</span>
            </div>
          </div>

          <div className={styles.itineraryLineSpacer}></div>

          <div className={styles.itineraryRow}>
            <div className={styles.stationTime}>{order.arrivalTime}</div>
            <div className={styles.timelineDotDest}></div>
            <div className={styles.stationName}>
              <strong>
                {order.destinationStation} ({order.destinationCode})
              </strong>
              <span>{order.arrivalDate}</span>
            </div>
          </div>
        </div>

        <div className={styles.divider}></div>

        {/* Danh sách vé trong đơn */}
        <div className={styles.ticketItemsList}>
          <div className={styles.ticketSectionTitle}>
            Danh sách ghế ({order.tickets.length} vé)
          </div>
          {order.tickets.map((t) => (
            <div key={t.ticketCode} className={styles.ticketItem}>
              <div className={styles.ticketItemLeft}>
                <span className={styles.ticketSeat}>
                  Toa {t.coachNumber} - Ghế {t.seatNumber}
                </span>
                <span className={styles.ticketType}>
                  {t.passengerName} ({t.passengerTypeLabel})
                </span>
              </div>
              <div className={styles.ticketItemPrice}>
                {t.price.toLocaleString("vi-VN")} đ
              </div>
            </div>
          ))}
        </div>

        <div className={styles.divider}></div>

        {/* Người nhận vé */}
        <div className={styles.contactSummaryBox}>
          <div className={styles.contactSummaryTitle}>Thông tin nhận vé</div>
          <div className={styles.contactSummaryRow}>
            <span>Người đặt:</span>
            <strong>{order.contactName}</strong>
          </div>
          <div className={styles.contactSummaryRow}>
            <span>Điện thoại:</span>
            <strong>{order.contactPhone}</strong>
          </div>
          <div className={styles.contactSummaryRow}>
            <span>Email:</span>
            <strong>{order.contactEmail}</strong>
          </div>
        </div>

        <div className={styles.divider}></div>

        {/* Tổng tiền */}
        <div className={styles.totalPaymentRow}>
          <span className={styles.totalPaymentLabel}>Số tiền thanh toán:</span>
          <span className={styles.totalPaymentValue}>
            {order.totalAmount.toLocaleString("vi-VN")} đ
          </span>
        </div>

        <div className={styles.backToEditRow}>
          <Link
            href={`/booking?train=${order.trainCode}`}
            className={styles.editBookingLink}
          >
            ← Thay đổi thông tin hành khách
          </Link>
        </div>

        <div className={styles.supportBox}>
          <strong>Hỗ trợ thanh toán 24/7:</strong> 1900 6469 (Miễn phí)
        </div>
      </div>
    </aside>
  );
}

