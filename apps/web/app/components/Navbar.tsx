"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./Navbar.module.css";
import { authService } from "../services/auth.service";
import { AuthUser } from "../types/auth.api";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Admin không dùng trang khách: đang đăng nhập ADMIN thì đưa thẳng về trang quản trị
    const handleAuthChange = () => {
      const user = authService.getCurrentUser();
      if (user?.role === "ADMIN") router.replace("/admin");
      setCurrentUser(user);
    };
    handleAuthChange();

    window.addEventListener("auth-changed", handleAuthChange);
    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
    };
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const isTripsActive = pathname === "/trips" || pathname.startsWith("/trips/");
  const isTicketsActive = pathname.startsWith("/tickets");
  const isPromotionsActive = pathname.startsWith("/promotions");
  const isGuideActive = pathname.startsWith("/guide");

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        {/* LOGO GROUP */}
        <Link href="/" className={styles.logoGroup}>
          <div className={styles.logoIcon}>
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="3" width="16" height="16" rx="2" ry="2"></rect>
              <path d="M4 11h16"></path>
              <path d="M12 3v8"></path>
              <path d="M8 19l-2 3"></path>
              <path d="M16 19l2 3"></path>
            </svg>
          </div>
          <span className={styles.brandName}>LionRail</span>
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className={styles.navLinks}>
          <Link
            href="/trips"
            className={`${styles.navItem} ${isTripsActive ? styles.activeNav : ""}`}
          >
            Chuyến Tàu
          </Link>
          <Link
            href="/tickets"
            className={`${styles.navItem} ${isTicketsActive ? styles.activeNav : ""}`}
          >
            Tra Cứu Vé
          </Link>
          <Link
            href="/promotions"
            className={`${styles.navItem} ${isPromotionsActive ? styles.activeNav : ""}`}
          >
            Khuyến Mãi
          </Link>
          <Link
            href="/guide"
            className={`${styles.navItem} ${isGuideActive ? styles.activeNav : ""}`}
          >
            Hướng Dẫn
          </Link>
        </nav>

        {/* AUTH GROUP (ĐỒNG BỘ TRẠNG THÁI USER TOÀN BỘ CÁC TRANG) */}
        <div className={styles.authGroup}>
          {currentUser ? (
            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>
                {(currentUser.fullName || currentUser.username || "U")[0].toUpperCase()}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userGreeting}>Xin chào,</span>
                <span className={styles.userName}>
                  {currentUser.fullName || currentUser.username}
                </span>
              </div>


              <Link href="/tickets" className={styles.myTicketsBtn}>
                Vé của tôi
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className={styles.logoutBtn}
                title="Đăng xuất khỏi hệ thống"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className={styles.loginLink}>
                Đăng Nhập
              </Link>
              <Link href="/register" className={styles.registerLink}>
                Đăng Ký
              </Link>
            </>
          )}

          <div className={styles.loyaltyBadge}>
            <span className={styles.badgeText}>🦁 HỘI VIÊN</span>
            <span className={styles.badgeSubText}>LION CLUB</span>
          </div>
        </div>
      </div>
    </header>
  );
}
