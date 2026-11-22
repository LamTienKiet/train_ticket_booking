"use client";

import styles from "../page.module.css";
import { PaymentStatus } from "../types/payment.types";

interface PaymentProgressBarProps {
  status: PaymentStatus;
}

export default function PaymentProgressBar({ status }: PaymentProgressBarProps) {
  const isSuccess = status === "SUCCESS";

  return (
    <section className={styles.progressSection}>
      <div className={styles.stepItemDone}>
        <div className={styles.stepCircle}>✓</div>
        <span className={styles.stepText}>1. Chọn chuyến đi</span>
      </div>
      <div className={styles.stepLineDone}></div>

      <div className={styles.stepItemDone}>
        <div className={styles.stepCircle}>✓</div>
        <span className={styles.stepText}>2. Chọn chỗ ngồi</span>
      </div>
      <div className={styles.stepLineDone}></div>

      <div className={styles.stepItemDone}>
        <div className={styles.stepCircle}>✓</div>
        <span className={styles.stepText}>3. Thông tin hành khách</span>
      </div>
      <div className={isSuccess ? styles.stepLineDone : styles.stepLineActive}></div>

      <div className={isSuccess ? styles.stepItemDone : styles.stepItemActive}>
        <div className={isSuccess ? styles.stepCircle : styles.stepCircleActive}>
          {isSuccess ? "✓" : "4"}
        </div>
        <span className={isSuccess ? styles.stepText : styles.stepTextActive}>
          4. Thanh toán & Nhận vé
        </span>
      </div>
    </section>
  );
}

