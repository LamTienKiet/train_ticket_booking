"use client";

import styles from "../page.module.css";

// Chỗ chỉ được giữ khi đơn được tạo (POST /bookings), nên ở bước này chỉ báo trước thời gian giữ chỗ
export default function HoldSeatCountdown() {
  return (
    <div className={styles.holdSeatBanner}>
      <span className={styles.bannerIcon} aria-hidden>
        ⏱
      </span>
      <div>
        <strong>Giữ chỗ 10 phút sau khi xác nhận.</strong>{" "}
        Ghế chưa được giữ cho tới khi bạn bấm <b>“Xác nhận &amp; thanh toán”</b> — hãy điền thông tin và
        xác nhận sớm để không bị người khác đặt mất.
      </div>
    </div>
  );
}
