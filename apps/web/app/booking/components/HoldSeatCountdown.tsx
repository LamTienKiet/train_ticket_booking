"use client";

import styles from "../page.module.css";

interface HoldSeatCountdownProps {
  timeLeft?: string;
}

export default function HoldSeatCountdown({
  timeLeft = "09:48",
}: HoldSeatCountdownProps) {
  return (
    <div className={styles.holdSeatBanner}>
      <div className={styles.bannerIcon}>⏱</div>
      <div className={styles.bannerContent}>
        <strong>Chỗ của bạn đang được tạm giữ: </strong>
        <span>
          Vui lòng hoàn tất nhập thông tin hành khách và thanh toán trong vòng{" "}
          <span className={styles.countdownHighlight}>{timeLeft}</span> phút để
          giữ vé.
        </span>
      </div>
    </div>
  );
}

