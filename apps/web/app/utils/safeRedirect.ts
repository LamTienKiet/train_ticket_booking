/**
 * Đường dẫn quay về sau đăng nhập, chỉ nhận trang cùng origin.
 * Phân tích bằng URL thay vì kiểm tra tiền tố: "/\evil.com" bị trình duyệt hiểu là "//evil.com".
 */
export function safeNextPath(next: string | null, origin: string): string {
  if (!next) return "/";
  try {
    const url = new URL(next, origin);
    return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}
