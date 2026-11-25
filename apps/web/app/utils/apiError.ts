import { isAxiosError } from "axios";

/** Lấy thông báo lỗi từ response NestJS ({ message: string | string[] }) */
export function apiErrorMessage(e: unknown, fallback: string): string {
  if (isAxiosError(e)) {
    const msg = e.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "string") return msg;
    if (!e.response) return "Không kết nối được máy chủ. Vui lòng thử lại sau.";
  }
  return fallback;
}
