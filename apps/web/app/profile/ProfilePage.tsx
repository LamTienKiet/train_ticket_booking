"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import styles from "./Profile.module.css";
import { authService } from "../services/auth.service";
import { UserProfile, UpdateProfileRequest } from "../types/auth.api";

type ProfileTab = "info" | "password" | "bookings";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>("info");

  // Form Thông tin cá nhân
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoSuccessMsg, setInfoSuccessMsg] = useState<string | null>(null);
  const [infoErrorMsg, setInfoErrorMsg] = useState<string | null>(null);

  // Form Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [pwdSuccessMsg, setPwdSuccessMsg] = useState<string | null>(null);
  const [pwdErrorMsg, setPwdErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await authService.getProfile();
      setProfile(data);

      setFullName(data.fullName || "");
      setPhone(data.phone || "");
      setBirthday(data.birthday ? data.birthday.split("T")[0] : "");
      setGender(data.gender || "Nam");
      setAddress(data.address || "");
    } catch {
      // Token hết hạn hoặc lỗi
      authService.logout();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoSuccessMsg(null);
    setInfoErrorMsg(null);
    setSavingInfo(true);

    try {
      const payload: UpdateProfileRequest = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        birthday: birthday || undefined,
        gender,
        address: address.trim(),
      };

      const updated = await authService.updateProfile(payload);
      setProfile(updated);
      setInfoSuccessMsg("Cập nhật thông tin hồ sơ thành công!");
    } catch (err: any) {
      setInfoErrorMsg(
        err.response?.data?.message || "Không thể cập nhật hồ sơ, vui lòng thử lại.",
      );
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccessMsg(null);
    setPwdErrorMsg(null);

    if (newPassword.length < 6) {
      setPwdErrorMsg("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdErrorMsg("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    setSavingPassword(true);

    try {
      const res = await authService.changePassword({
        currentPassword,
        newPassword,
      });
      setPwdSuccessMsg(res.message || "Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwdErrorMsg(
        err.response?.data?.message || "Mật khẩu hiện tại không chính xác.",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  // NẾU ĐANG TẢI DỮ LIỆU
  if (loading) {
    return (
      <main className={styles.main}>
        <Navbar />
        <div className={styles.container}>
          <div style={{ textAlign: "center", padding: "80px 0", color: "#64748b" }}>
            Đang tải thông tin hồ sơ cá nhân...
          </div>
        </div>
      </main>
    );
  }

  // NẾU CHƯA ĐĂNG NHẬP (GUEST)
  if (!profile) {
    return (
      <main className={styles.main}>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.guestCard}>
            <div className={styles.guestIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h1 className={styles.guestTitle}>Yêu Cầu Đăng Nhập</h1>
            <p className={styles.guestDesc}>
              Vui lòng đăng nhập hoặc đăng ký tài khoản để xem và quản lý thông tin hồ sơ cá nhân, lịch sử các chuyến tàu và thẻ hội viên.
            </p>
            <div className={styles.guestActionRow}>
              <Link href="/login" className={styles.guestLoginBtn}>
                Đăng Nhập
              </Link>
              <Link href="/register" className={styles.guestRegisterBtn}>
                Đăng Ký Tài Khoản
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const roleLabel =
    profile.role === "ADMIN"
      ? "Quản trị viên"
      : profile.role === "STAFF"
      ? "Nhân viên nhà ga"
      : "Hành khách thành viên";

  const roleClass =
    profile.role === "ADMIN"
      ? styles.roleAdmin
      : profile.role === "STAFF"
      ? styles.roleStaff
      : styles.roleCustomer;

  return (
    <main className={styles.main}>
      <Navbar />

      <div className={styles.container}>
        {/* HEADER PROFILE HERO CARD */}
        <div className={styles.profileHeaderCard}>
          <div className={styles.headerLeft}>
            <div className={styles.largeAvatar}>
              {(profile.fullName || profile.username || "U")[0].toUpperCase()}
            </div>
            <div className={styles.headerUserInfo}>
              <h1 className={styles.userNameTitle}>
                {profile.fullName || profile.username}
                <span className={`${styles.roleBadge} ${roleClass}`}>
                  {roleLabel}
                </span>
              </h1>
              <div className={styles.userEmailPhone}>
                <span>✉ {profile.email}</span>
                {profile.phone && <span>📞 {profile.phone}</span>}
              </div>
            </div>
          </div>

          <div className={styles.headerRightStats}>
            <div className={styles.statItem}>
              <span className={styles.statNum}>{profile.bookingsCount}</span>
              <span className={styles.statLabel}>Chuyến tàu đã đặt</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNum}>Hội viên Bạc</span>
              <span className={styles.statLabel}>Hạng thành viên</span>
            </div>
          </div>
        </div>

        {/* PROFILE NAVIGATION TABS */}
        <div className={styles.profileTabs}>
          <button
            className={`${styles.tabItem} ${activeTab === "info" ? styles.tabItemActive : ""}`}
            onClick={() => setActiveTab("info")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Thông Tin Cá Nhân
          </button>

          <button
            className={`${styles.tabItem} ${activeTab === "password" ? styles.tabItemActive : ""}`}
            onClick={() => setActiveTab("password")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Bảo Mật & Mật Khẩu
          </button>

          <button
            className={`${styles.tabItem} ${activeTab === "bookings" ? styles.tabItemActive : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Vé Của Tôi ({profile.bookingsCount})
          </button>
        </div>

        {/* TAB 1: THÔNG TIN CÁ NHÂN */}
        {activeTab === "info" && (
          <div className={styles.contentCard}>
            <h2 className={styles.cardHeaderTitle}>Hồ Sơ Hành Khách</h2>
            <p className={styles.cardHeaderSubtitle}>
              Thông tin này giúp tự động điền nhanh và tính chính xác các mức giảm giá khi bạn đặt vé tàu.
            </p>

            {infoSuccessMsg && (
              <div className={styles.alertSuccess}>
                <span>✓ {infoSuccessMsg}</span>
              </div>
            )}

            {infoErrorMsg && (
              <div className={styles.alertError}>
                <span>⚠️ {infoErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateInfo}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Họ và tên</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Số điện thoại</label>
                  <input
                    type="tel"
                    className={styles.input}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Email tài khoản</label>
                  <input
                    type="email"
                    className={`${styles.input} ${styles.inputDisabled}`}
                    value={profile.email}
                    disabled
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Tên đăng nhập</label>
                  <input
                    type="text"
                    className={`${styles.input} ${styles.inputDisabled}`}
                    value={profile.username || "Chưa thiết lập"}
                    disabled
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Ngày sinh</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Giới tính</label>
                  <select
                    className={styles.select}
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className={styles.formGroupFull}>
                  <label className={styles.label}>Địa chỉ liên hệ</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="VD: 123 Lê Duẩn, Hoàn Kiếm, Hà Nội"
                  />
                </div>
              </div>

              <div className={styles.formActionRow}>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={savingInfo}
                >
                  {savingInfo ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: ĐỔI MẬT KHẨU */}
        {activeTab === "password" && (
          <div className={styles.contentCard} style={{ maxWidth: "600px" }}>
            <h2 className={styles.cardHeaderTitle}>Đổi Mật Khẩu Đăng Nhập</h2>
            <p className={styles.cardHeaderSubtitle}>
              Để bảo vệ tài khoản vé tàu, vui lòng không chia sẻ mật khẩu cho người khác.
            </p>

            {pwdSuccessMsg && (
              <div className={styles.alertSuccess}>
                <span>✓ {pwdSuccessMsg}</span>
              </div>
            )}

            {pwdErrorMsg && (
              <div className={styles.alertError}>
                <span>⚠️ {pwdErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    className={styles.input}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Mật khẩu mới (tối thiểu 6 ký tự)</label>
                  <input
                    type="password"
                    className={styles.input}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    className={styles.input}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formActionRow}>
                  <button
                    type="submit"
                    className={styles.saveBtn}
                    disabled={savingPassword}
                  >
                    {savingPassword ? "Đang cập nhật..." : "Cập Nhật Mật Khẩu"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: DANH SÁCH VÉ & CHUYẾN ĐI */}
        {activeTab === "bookings" && (
          <div className={styles.contentCard}>
            <h2 className={styles.cardHeaderTitle}>Lịch Sử Chuyến Đi Của Bạn</h2>
            <p className={styles.cardHeaderSubtitle}>
              Toàn bộ vé tàu điện tử, thẻ lên tàu có mã QR Code và trạng thái hành trình đều được lưu trữ bảo mật.
            </p>

            <div className={styles.bookingPromptCard}>
              <div className={styles.bookingPromptText}>
                <h3 className={styles.bookingPromptTitle}>
                  Bạn đang có {profile.bookingsCount} đơn đặt vé trên hệ thống
                </h3>
                <p className={styles.bookingPromptDesc}>
                  Truy cập trang Tra Cứu Vé để xem chi tiết từng vé, tải mã QR quét tại ga hoặc yêu cầu đổi trả vé.
                </p>
              </div>
              <Link href="/tickets" className={styles.bookingPromptBtn}>
                Xem Chi Tiết Vé Của Tôi →
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
