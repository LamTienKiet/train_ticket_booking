import type { Metadata } from "next";
import GuidePage from "./GuidePage";

export const metadata: Metadata = {
  title: "Hướng Dẫn & Cẩm Nang Đi Tàu | LionRail",
  description: "Cẩm nang hướng dẫn đặt vé tàu trực tuyến, thanh toán, cơ chế giữ chỗ 10 phút, quy định hoàn đổi vé và thủ tục hành lý đi tàu tại LionRail.",
};

export default function Page() {
  return <GuidePage />;
}
