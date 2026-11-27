import type { Metadata } from "next";
import ProfilePage from "./ProfilePage";

export const metadata: Metadata = {
  title: "Hồ Sơ Cá Nhân | LionRail",
  description: "Quản lý thông tin tài khoản, hồ sơ hành khách và bảo mật tại LionRail.",
};

export default function Page() {
  return <ProfilePage />;
}
