"use client";

import { useState } from "react";
import styles from "../page.module.css";
import { PaymentMethodType, PaymentOrderInfo } from "../types/payment.types";
import QrCodeGraphic from "./QrCodeGraphic";

interface PaymentGatewayCardProps {
  order: PaymentOrderInfo;
  paymentMethod: PaymentMethodType;
  onPaymentMethodChange: (method: PaymentMethodType) => void;
  onConfirmPayment: () => void;
  isConfirming?: boolean;
  confirmError?: string | null;
}

export default function PaymentGatewayCard({
  order,
  paymentMethod,
  onPaymentMethodChange,
  onConfirmPayment,
  isConfirming = false,
  confirmError = null,
}: PaymentGatewayCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const bankAccountNo = "102988886666";
  const transferContent = `LIONRAIL ${order.bookingCode}`;

  const handleCopy = (field: string, value: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    }
  };

  return (
    <section className={styles.cardSection}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderTitle}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
          <h2>Thanh toán đơn đặt vé</h2>
        </div>
        <span className={styles.bookingCodeChip}>Mã đơn: {order.bookingCode}</span>
      </div>

      {/* Thanh chuyển nhanh phương thức thanh toán */}
      <div className={styles.methodTabsBar}>
        {[
          { key: "VIETQR", label: "Quét mã VietQR" },
          { key: "VNPAY", label: "ATM / VNPAY" },
          { key: "VISA", label: "Thẻ Visa / Master" },
          { key: "STATION", label: "Tại quầy ga" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onPaymentMethodChange(item.key as PaymentMethodType)}
            className={`${styles.methodTabBtn} ${
              paymentMethod === item.key ? styles.methodTabActive : ""
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.cardBody}>
        {/* 1. CHẾ ĐỘ CHUYỂN KHOẢN VIETQR */}
        {paymentMethod === "VIETQR" && (
          <div className={styles.qrPaymentLayout}>
            <div className={styles.qrBoxWrapper}>
              <div className={styles.qrHeaderBadge}>VietQR • Napas 24/7</div>
              <div className={styles.qrFrame}>
                <QrCodeGraphic
                  size={188}
                  seed={`${order.bookingCode}-${order.totalAmount}`}
                />
              </div>
              <div className={styles.qrSubCaption}>
                Mở App Ngân hàng hoặc MoMo / ZaloPay để quét mã
              </div>
              <div className={styles.qrWaitStatus}>
                <span className={styles.pulseDot}></span>
                Đang chờ xác nhận giao dịch...
              </div>
            </div>

            <div className={styles.bankTransferDetails}>
              <h3 className={styles.bankSectionTitle}>
                Hoặc chuyển khoản thủ công theo thông tin:
              </h3>

              <div className={styles.bankInfoTable}>
                <div className={styles.bankInfoRow}>
                  <span className={styles.bankLabel}>Ngân hàng:</span>
                  <strong className={styles.bankValue}>
                    Vietcombank (VCB) - CN Hà Nội
                  </strong>
                </div>

                <div className={styles.bankInfoRow}>
                  <span className={styles.bankLabel}>Chủ tài khoản:</span>
                  <strong className={styles.bankValue}>
                    CONG TY VAN TAI DUONG SAT LIONRAIL
                  </strong>
                </div>

                <div className={styles.bankInfoRow}>
                  <span className={styles.bankLabel}>Số tài khoản:</span>
                  <div className={styles.copyValueGroup}>
                    <strong className={styles.bankHighlight}>{bankAccountNo}</strong>
                    <button
                      type="button"
                      className={styles.copyBtn}
                      onClick={() => handleCopy("account", bankAccountNo)}
                    >
                      {copiedField === "account" ? "Đã chép ✓" : "Sao chép"}
                    </button>
                  </div>
                </div>

                <div className={styles.bankInfoRow}>
                  <span className={styles.bankLabel}>Số tiền:</span>
                  <div className={styles.copyValueGroup}>
                    <strong className={styles.amountHighlight}>
                      {order.totalAmount.toLocaleString("vi-VN")} đ
                    </strong>
                    <button
                      type="button"
                      className={styles.copyBtn}
                      onClick={() =>
                        handleCopy("amount", order.totalAmount.toString())
                      }
                    >
                      {copiedField === "amount" ? "Đã chép ✓" : "Sao chép"}
                    </button>
                  </div>
                </div>

                <div className={styles.bankInfoRow}>
                  <span className={styles.bankLabel}>Nội dung CK:</span>
                  <div className={styles.copyValueGroup}>
                    <strong className={styles.transferCodeHighlight}>
                      {transferContent}
                    </strong>
                    <button
                      type="button"
                      className={styles.copyBtn}
                      onClick={() => handleCopy("content", transferContent)}
                    >
                      {copiedField === "content" ? "Đã chép ✓" : "Sao chép"}
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.transferWarning}>
                Lưu ý: Vui lòng giữ nguyên nội dung chuyển khoản{" "}
                <strong>{transferContent}</strong> để hệ thống tự động đối soát
                và xuất vé trong vòng 30 giây.
              </div>
            </div>
          </div>
        )}

        {/* 2. CHẾ ĐỘ ATM / VNPAY */}
        {paymentMethod === "VNPAY" && (
          <div className={styles.gatewayFormBox}>
            <h3 className={styles.gatewayFormTitle}>
              Chọn ngân hàng nội địa (Napas / VNPAY)
            </h3>
            <div className={styles.bankGrid}>
              {[
                "Vietcombank",
                "VietinBank",
                "BIDV",
                "Techcombank",
                "MB Bank",
                "ACB",
                "TPBank",
                "VPBank",
              ].map((bank) => (
                <button key={bank} type="button" className={styles.bankChip}>
                  {bank}
                </button>
              ))}
            </div>

            <div className={styles.cardInputGrid}>
              <div className={styles.formGroupFull}>
                <label className={styles.label}>Số thẻ ATM nội địa</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="9704 xxxx xxxx xxxx"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Tên chủ thẻ (không dấu)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="NGUYEN VAN A"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Ngày phát hành</label>
                <input type="text" className={styles.input} placeholder="MM/YY" />
              </div>
            </div>
          </div>
        )}

        {/* 3. CHẾ ĐỘ THẺ QUỐC TẾ VISA / MASTERCARD */}
        {paymentMethod === "VISA" && (
          <div className={styles.gatewayFormBox}>
            <div className={styles.cardBrandRow}>
              <h3 className={styles.gatewayFormTitle}>
                Thanh toán bằng thẻ quốc tế
              </h3>
              <div className={styles.cardBrands}>
                <span className={styles.brandTag}>VISA</span>
                <span className={styles.brandTag}>MasterCard</span>
                <span className={styles.brandTag}>JCB</span>
              </div>
            </div>

            <div className={styles.cardInputGrid}>
              <div className={styles.formGroupFull}>
                <label className={styles.label}>Số thẻ</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="4242 xxxx xxxx 4242"
                />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.label}>Tên in trên thẻ</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="NGUYEN VAN A"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Ngày hết hạn</label>
                <input type="text" className={styles.input} placeholder="MM/YY" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Mã bảo mật (CVV/CVC)</label>
                <input type="password" className={styles.input} placeholder="•••" />
              </div>
            </div>
          </div>
        )}

        {/* 4. CHẾ ĐỘ THANH TOÁN TẠI QUẦY GA */}
        {paymentMethod === "STATION" && (
          <div className={styles.stationPaymentBox}>
            <div className={styles.stationCodeCard}>
              <span>MÃ GIỮ CHỖ TẠI GA</span>
              <strong>{order.bookingCode}</strong>
            </div>
            <div className={styles.stationInstructions}>
              <h4>Hướng dẫn thanh toán tại quầy vé LionRail:</h4>
              <ol>
                <li>
                  Đọc mã giữ chỗ <strong>{order.bookingCode}</strong> cho nhân
                  viên tại quầy vé thuộc hệ thống Ga Đường sắt Việt Nam.
                </li>
                <li>
                  Thanh toán số tiền{" "}
                  <strong>{order.totalAmount.toLocaleString("vi-VN")} đ</strong>{" "}
                  và nhận vé in trực tiếp.
                </li>
                <li>
                  Thời hạn giữ chỗ tối đa <strong>12 giờ</strong> kể từ lúc tạo
                  đơn (hoặc trước giờ tàu chạy 2 tiếng).
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* HÀNH ĐỘNG XÁC NHẬN THANH TOÁN */}
        {confirmError && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "14px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>⚠️</span>
            <strong>{confirmError}</strong>
          </div>
        )}

        <div className={styles.paymentFooterActions}>
          <button
            type="button"
            onClick={onConfirmPayment}
            disabled={isConfirming}
            className={styles.confirmPaidBtn}
            style={{
              cursor: isConfirming ? "not-allowed" : "pointer",
              opacity: isConfirming ? 0.7 : 1,
            }}
          >
            {isConfirming
              ? "Đang xác nhận thanh toán & xuất vé..."
              : paymentMethod === "STATION"
              ? "Xác nhận giữ chỗ & Xem phiếu đặt vé →"
              : "Tôi đã hoàn tất thanh toán →"}
          </button>
        </div>
      </div>
    </section>
  );
}

