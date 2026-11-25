"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authService } from "../services/auth.service";
import type { AuthUser } from "../types/auth.api";
import styles from "./admin.module.css";

const NAV = [
  { href: "/admin", label: "Tổng quan", icon: "📊" },
  { href: "/admin/bookings", label: "Đơn đặt vé", icon: "🧾" },
  { href: "/admin/trips", label: "Chuyến tàu", icon: "🚆" },
  { href: "/admin/stations", label: "Ga", icon: "🏛" },
  { href: "/admin/trains", label: "Tàu & toa", icon: "🚃" },
  { href: "/admin/routes", label: "Tuyến", icon: "🛤" },
  { href: "/admin/fares", label: "Bảng giá", icon: "💰" },
  { href: "/admin/users", label: "Người dùng", icon: "👥" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // undefined = chưa đọc storage (tránh nháy trang khi render lần đầu)
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    const check = () => {
      const u = authService.getCurrentUser();
      // Chỉ chặn ở giao diện; API vẫn kiểm tra quyền bằng @Roles(ADMIN)
      if (u?.role !== "ADMIN") router.replace(`/login?next=${encodeURIComponent("/admin")}`);
      setUser(u);
    };
    check();
    window.addEventListener("auth-changed", check);
    return () => window.removeEventListener("auth-changed", check);
  }, [router]);

  if (user?.role !== "ADMIN") {
    return (
      <div role="status" className={styles.gate}>
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.brand}>
          LionRail <span>Admin</span>
        </Link>
        <nav aria-label="Quản trị" className={styles.nav}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.navActive : ""}`}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFoot}>
          <div className={styles.whoami}>
            <strong>{user.fullName || user.username}</strong>
            <span>Quản trị viên</span>
          </div>
          <Link href="/" className={styles.backHome}>
            ← Về trang khách
          </Link>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={() => {
              authService.logout();
              router.replace("/login");
            }}
          >
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
