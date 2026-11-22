"use client";

import { PaymentMethodType } from "../types/booking.types";
import styles from "../page.module.css";

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethodType;
  onPaymentMethodChange: (method: PaymentMethodType) => void;
}

export default function PaymentMethodSelector({
  paymentMethod,
  onPaymentMethodChange,
}: PaymentMethodSelectorProps) {
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
          <h2>Phương thức thanh toán</h2>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.paymentMethodsList}>
          {/* Cách 1: VietQR */}
          <label
            className={`${styles.paymentMethodItem} ${
              paymentMethod === "VIETQR" ? styles.paymentSelected : ""
            }`}
          >
            <input
              type="radio"
              name="payment"
              value="VIETQR"
              checked={paymentMethod === "VIETQR"}
              onChange={(e) =>
                onPaymentMethodChange(e.target.value as PaymentMethodType)
              }
            />
            <div className={styles.paymentIcon}>📱</div>
            <div className={styles.paymentDetails}>
              <div className={styles.paymentTitle}>
                Quét mã QR Ngân hàng (VietQR / Napas247)
                <span className={styles.recommendedBadge}>Khuyên dùng</span>
              </div>
              <p className={styles.paymentDesc}>
                Dùng ứng dụng ngân hàng hoặc ví điện tử bất kỳ để quét mã QR.
                Xác nhận thanh toán tức thì 24/7.
              </p>
            </div>
          </label>

          {/* Cách 2: VNPAY / ATM nội địa */}
          <label
            className={`${styles.paymentMethodItem} ${
              paymentMethod === "VNPAY" ? styles.paymentSelected : ""
            }`}
          >
            <input
              type="radio"
              name="payment"
              value="VNPAY"
              checked={paymentMethod === "VNPAY"}
              onChange={(e) =>
                onPaymentMethodChange(e.target.value as PaymentMethodType)
              }
            />
            <div className={styles.paymentIcon}>💳</div>
            <div className={styles.paymentDetails}>
              <div className={styles.paymentTitle}>
                Thẻ ATM / Tài khoản ngân hàng nội địa (VNPAY-QR)
              </div>
              <p className={styles.paymentDesc}>
                Hỗ trợ hơn 40 ngân hàng tại Việt Nam có đăng ký Internet
                Banking.
              </p>
            </div>
          </label>

          {/* Cách 3: Thẻ quốc tế */}
          <label
            className={`${styles.paymentMethodItem} ${
              paymentMethod === "VISA" ? styles.paymentSelected : ""
            }`}
          >
            <input
              type="radio"
              name="payment"
              value="VISA"
              checked={paymentMethod === "VISA"}
              onChange={(e) =>
                onPaymentMethodChange(e.target.value as PaymentMethodType)
              }
            />
            <div className={styles.paymentIcon}>🌐</div>
            <div className={styles.paymentDetails}>
              <div className={styles.paymentTitle}>
                Thẻ quốc tế (Visa, MasterCard, JCB)
              </div>
              <p className={styles.paymentDesc}>
                Thanh toán an toàn qua cổng thẻ bảo mật tiêu chuẩn quốc tế.
              </p>
            </div>
          </label>

          {/* Cách 4: Thanh toán tại ga */}
          <label
            className={`${styles.paymentMethodItem} ${
              paymentMethod === "STATION" ? styles.paymentSelected : ""
            }`}
          >
            <input
              type="radio"
              name="payment"
              value="STATION"
              checked={paymentMethod === "STATION"}
              onChange={(e) =>
                onPaymentMethodChange(e.target.value as PaymentMethodType)
              }
            />
            <div className={styles.paymentIcon}>🏢</div>
            <div className={styles.paymentDetails}>
              <div className={styles.paymentTitle}>
                Thanh toán sau tại quầy vé Ga tàu
              </div>
              <p className={styles.paymentDesc}>
                Giữ chỗ trong 12 giờ. Bạn cần đến trực tiếp quầy vé tại ga để
                nộp tiền và nhận vé trước hạn.
              </p>
            </div>
          </label>
        </div>
      </div>
    </section>
  );
}

