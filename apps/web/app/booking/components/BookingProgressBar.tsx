"use client";

import styles from "../page.module.css";

export default function BookingProgressBar() {
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
      <div className={styles.stepLineActive}></div>

      <div className={styles.stepItemActive}>
        <div className={styles.stepCircleActive}>3</div>
        <span className={styles.stepTextActive}>3. Thông tin hành khách</span>
      </div>
      <div className={styles.stepLine}></div>

      <div className={styles.stepItem}>
        <div className={styles.stepCircle}>4</div>
        <span className={styles.stepText}>4. Thanh toán & Nhận vé</span>
      </div>
    </section>
  );
}

