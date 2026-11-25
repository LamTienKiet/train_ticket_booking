// Giờ tàu luôn hiển thị theo giờ Việt Nam, không phụ thuộc múi giờ máy người xem
const VN = { timeZone: "Asia/Ho_Chi_Minh" } as const;

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("vi-VN", { ...VN, hour: "2-digit", minute: "2-digit" });

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", VN);

export const fmtDuration = (fromIso: string, toIso: string) => {
  const mins = Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000);
  return `${Math.floor(mins / 60)} giờ ${mins % 60} phút`;
};
