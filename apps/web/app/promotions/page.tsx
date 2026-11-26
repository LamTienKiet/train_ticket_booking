import type { Metadata } from "next";
import PromotionsPage from "./PromotionsPage";

export const metadata: Metadata = {
  title: "Khuyến Mãi & Voucher Vé Tàu | LionRail",
  description: "Tổng hợp các chương trình ưu đãi, mã giảm giá vé tàu và chính sách miễn giảm cho sinh viên, trẻ em, người cao tuổi tại LionRail.",
};

export default function Page() {
  return <PromotionsPage />;
}
