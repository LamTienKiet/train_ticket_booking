import styles from "../admin.module.css";

const TONE: Record<string, "ok" | "warn" | "bad" | "muted" | "info"> = {
  ACTIVE: "ok",
  CONFIRMED: "ok",
  SCHEDULED: "info",
  COMPLETED: "muted",
  DEPARTED: "muted",
  SUCCESS: "ok",
  PENDING: "warn",
  BOARDING: "warn",
  MAINTENANCE: "warn",
  CANCELLED: "bad",
  EXPIRED: "muted",
  INACTIVE: "muted",
  BANNED: "bad",
  FAILED: "bad",
};

export const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Ngừng hoạt động",
  MAINTENANCE: "Bảo trì",
  BANNED: "Đã khóa",
  SCHEDULED: "Sắp chạy",
  BOARDING: "Đang lên tàu",
  DEPARTED: "Đã khởi hành",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  PENDING: "Chờ thanh toán",
  CONFIRMED: "Đã xác nhận",
  EXPIRED: "Hết hạn",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
};

export default function StatusBadge({ value }: { value: string }) {
  return <span className={`${styles.badge} ${styles[`tone_${TONE[value] ?? "muted"}`]}`}>{STATUS_LABEL[value] ?? value}</span>;
}
