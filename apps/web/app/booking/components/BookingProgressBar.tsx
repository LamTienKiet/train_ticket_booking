"use client";

import styles from "../page.module.css";

const STEPS = ["Chọn chuyến đi", "Chọn chỗ ngồi", "Thông tin hành khách", "Thanh toán & Nhận vé"];
const CURRENT = 2;

export default function BookingProgressBar() {
  return (
    <ol className={styles.progressSection} aria-label="Các bước đặt vé">
      {STEPS.map((label, i) => (
        <li
          key={label}
          className={`${styles.step} ${i < CURRENT ? styles.stepDone : ""} ${i === CURRENT ? styles.stepActive : ""}`}
          aria-current={i === CURRENT ? "step" : undefined}
        >
          <span className={styles.stepCircle}>{i < CURRENT ? "✓" : i + 1}</span>
          <span className={styles.stepText}>{label}</span>
        </li>
      ))}
    </ol>
  );
}
