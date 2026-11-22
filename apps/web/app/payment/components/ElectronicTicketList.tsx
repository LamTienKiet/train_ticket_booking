"use client";

import styles from "../page.module.css";
import { PaymentOrderInfo } from "../types/payment.types";
import QrCodeGraphic from "./QrCodeGraphic";

interface ElectronicTicketListProps {
  order: PaymentOrderInfo;
}

export default function ElectronicTicketList({
  order,
}: ElectronicTicketListProps) {
  return (
    <section className={styles.ticketsSection}>
      <div className={styles.ticketsSectionHeader}>
        <h2>Thẻ lên tàu điện tử ({order.tickets.length} vé)</h2>
        <span className={styles.ticketsNote}>
          Vui lòng xuất trình mã QR dưới đây tại cửa kiểm soát ga trước giờ tàu
          chạy tối thiểu 30 phút
        </span>
      </div>

      <div className={styles.ticketsList}>
        {order.tickets.map((ticket, index) => (
          <div key={ticket.ticketCode} className={styles.boardingPassCard}>
            {/* PHẦN THÂN VÉ BÊN TRÁI */}
            <div className={styles.ticketMainBody}>
              <div className={styles.ticketTopHeader}>
                <div className={styles.ticketBrandBadge}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="4" y="3" width="16" height="16" rx="2" ry="2"></rect>
                    <path d="M4 11h16"></path>
                    <path d="M12 3v8"></path>
                  </svg>
                  <span>LIONRAIL E-TICKET</span>
                </div>

                <div className={styles.ticketCodeMeta}>
                  <span>Vé #{index + 1}</span>
                  <strong>{ticket.ticketCode}</strong>
                </div>
              </div>

              {/* Tuyến đường & Giờ chạy */}
              <div className={styles.ticketRouteRow}>
                <div className={styles.ticketStationBlock}>
                  <span className={styles.ticketStationCode}>
                    {order.originCode}
                  </span>
                  <strong className={styles.ticketStationName}>
                    {order.originStation}
                  </strong>
                  <span className={styles.ticketTimeDate}>
                    {order.departureTime} • {order.departureDate}
                  </span>
                </div>

                <div className={styles.ticketRouteArrow}>
                  <span className={styles.ticketTrainLabel}>
                    Tàu {order.trainCode}
                  </span>
                  <div className={styles.ticketTrackLine}>
                    <span className={styles.trackDot}></span>
                    <span className={styles.trackDash}></span>
                    <span className={styles.trackArrow}>➔</span>
                  </div>
                  <span className={styles.ticketDurationText}>
                    {order.duration}
                  </span>
                </div>

                <div
                  className={styles.ticketStationBlock}
                  style={{ textAlign: "right" }}
                >
                  <span className={styles.ticketStationCode}>
                    {order.destinationCode}
                  </span>
                  <strong className={styles.ticketStationName}>
                    {order.destinationStation}
                  </strong>
                  <span className={styles.ticketTimeDate}>
                    {order.arrivalTime} • {order.arrivalDate}
                  </span>
                </div>
              </div>

              <div className={styles.ticketDivider}></div>

              {/* Thông tin hành khách & Chỗ ngồi */}
              <div className={styles.ticketDetailsGrid}>
                <div className={styles.ticketDetailCell}>
                  <span className={styles.cellLabel}>Hành khách</span>
                  <strong className={styles.cellValue}>
                    {ticket.passengerName}
                  </strong>
                </div>

                <div className={styles.ticketDetailCell}>
                  <span className={styles.cellLabel}>Số giấy tờ (CCCD)</span>
                  <strong className={styles.cellValue}>{ticket.idCard}</strong>
                </div>

                <div className={styles.ticketDetailCell}>
                  <span className={styles.cellLabel}>Đối tượng</span>
                  <strong className={styles.cellValue}>
                    {ticket.passengerTypeLabel}
                  </strong>
                </div>

                <div className={styles.ticketDetailCell}>
                  <span className={styles.cellLabel}>Loại chỗ</span>
                  <strong className={styles.cellValue}>{ticket.seatType}</strong>
                </div>

                <div className={styles.ticketDetailCell}>
                  <span className={styles.cellLabel}>Toa / Ghế</span>
                  <strong className={styles.cellHighlight}>
                    Toa {ticket.coachNumber} - Ghế {ticket.seatNumber}
                  </strong>
                </div>

                <div className={styles.ticketDetailCell}>
                  <span className={styles.cellLabel}>Giá vé</span>
                  <strong className={styles.cellPrice}>
                    {ticket.price.toLocaleString("vi-VN")} đ
                  </strong>
                </div>
              </div>
            </div>

            {/* ĐƯỜNG RĂNG CƯA NGĂN CÁCH CUỐNG VÉ */}
            <div className={styles.ticketStubSeparator}>
              <span className={styles.notchTop}></span>
              <span className={styles.dashedVertical}></span>
              <span className={styles.notchBottom}></span>
            </div>

            {/* CUỐNG VÉ MÃ QR BÊN PHẢI */}
            <div className={styles.ticketQrStub}>
              <span className={styles.stubLabel}>MÃ LÊN TÀU</span>
              <div className={styles.stubQrWrapper}>
                <QrCodeGraphic size={126} seed={ticket.ticketCode} />
              </div>
              <div className={styles.stubSeatPill}>
                Toa {ticket.coachNumber} • Ghế {ticket.seatNumber}
              </div>
              <span className={styles.stubHint}>Quét tại cổng kiểm soát</span>

              <button
                type="button"
                className={styles.downloadTicketBtn}
                onClick={() =>
                  alert(
                    `[GIAO DIỆN MẪU]\nĐang tải vé PDF cho mã vé ${ticket.ticketCode}`
                  )
                }
              >
                Tải vé PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

