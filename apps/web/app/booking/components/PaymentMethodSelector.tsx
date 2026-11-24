"use client";

import { PaymentMethodType } from "../types/booking.types";
import styles from "../page.module.css";

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethodType;
  onPaymentMethodChange: (method: PaymentMethodType) => void;
}

const METHODS: { value: PaymentMethodType; icon: string; title: string; desc: string; recommended?: boolean }[] = [
  {
    value: "VIETQR",
    icon: "📱",
    title: "Quét mã QR ngân hàng",
    desc: "VietQR / Napas247 — dùng app ngân hàng hoặc ví bất kỳ, xác nhận tức thì 24/7.",
    recommended: true,
  },
  {
    value: "VNPAY",
    icon: "💳",
    title: "Thẻ ATM nội địa (VNPAY)",
    desc: "Hơn 40 ngân hàng Việt Nam có đăng ký Internet Banking.",
  },
  {
    value: "VISA",
    icon: "🌐",
    title: "Thẻ quốc tế",
    desc: "Visa, MasterCard, JCB qua cổng thanh toán bảo mật.",
  },
  {
    value: "STATION",
    icon: "🏢",
    title: "Trả tại quầy vé ga",
    desc: "Đến quầy vé tại ga để nộp tiền và nhận vé trước hạn giữ chỗ.",
  },
];

export default function PaymentMethodSelector({ paymentMethod, onPaymentMethodChange }: PaymentMethodSelectorProps) {
  return (
    <section className={styles.cardSection}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderTitle}>
          <span className={styles.cardIcon} aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </span>
          <div>
            <h2>Phương thức thanh toán</h2>
            <p className={styles.cardHeaderSub}>Bạn sẽ thanh toán ở bước tiếp theo</p>
          </div>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.paymentMethodsList} role="radiogroup" aria-label="Phương thức thanh toán">
          {METHODS.map((m) => (
            <label
              key={m.value}
              className={`${styles.paymentMethodItem} ${paymentMethod === m.value ? styles.paymentSelected : ""}`}
            >
              <input
                type="radio"
                name="payment"
                value={m.value}
                checked={paymentMethod === m.value}
                onChange={() => onPaymentMethodChange(m.value)}
              />
              <span className={styles.paymentIcon} aria-hidden>
                {m.icon}
              </span>
              <span className={styles.paymentDetails}>
                <span className={styles.paymentTitle}>
                  {m.title}
                  {m.recommended && <span className={styles.recommendedBadge}>Khuyên dùng</span>}
                </span>
                <span className={styles.paymentDesc}>{m.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
