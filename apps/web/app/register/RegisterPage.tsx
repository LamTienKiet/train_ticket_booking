"use client";

import Link from "next/link";
import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import styles from "./page.module.css";
import { authService } from "../services/auth.service";
import { RegisterFormErrors, RegisterRequest } from "../types/auth.api";

export default function RegisterPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState<RegisterRequest>({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Xóa lỗi của trường khi người dùng gõ
    if (errors[name as keyof RegisterFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
    if (formError) setFormError("");
  };

  const validate = (): boolean => {
    const nextErrors: RegisterFormErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Vui lòng nhập họ và tên.";
    } else if (formData.fullName.trim().length < 2) {
      nextErrors.fullName = "Họ và tên phải có ít nhất 2 ký tự.";
    }

    if (!formData.username.trim()) {
      nextErrors.username = "Vui lòng nhập tên đăng nhập.";
    } else if (formData.username.trim().length < 3) {
      nextErrors.username = "Tên đăng nhập phải có ít nhất 3 ký tự.";
    } else if (/\s/.test(formData.username.trim())) {
      nextErrors.username = "Tên đăng nhập không được chứa khoảng trắng.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      nextErrors.email = "Vui lòng nhập email.";
    } else if (!emailRegex.test(formData.email.trim())) {
      nextErrors.email = "Email không đúng định dạng.";
    }

    const phoneRegex = /^0\d{9}$/;
    if (!formData.phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!phoneRegex.test(formData.phone.trim())) {
      nextErrors.phone = "Số điện thoại phải gồm 10 chữ số (bắt đầu bằng 0).";
    }

    if (!formData.password) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    } else if (formData.password.length < 6) {
      nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận lại mật khẩu.";
    } else if (formData.confirmPassword !== formData.password) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    if (!agree) {
      nextErrors.agree = "Bạn cần đồng ý với điều khoản sử dụng.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!validate()) return;

    setLoading(true);

    try {
      await authService.register(formData);

      setFormSuccess("Đăng ký tài khoản thành công! Đang chuyển hướng...");

      // Tự động chuyển qua trang đăng nhập sau 1.2s
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 1200);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          const message = err.response.data?.message;

          if (Array.isArray(message)) {
            setFormError(message.join(", "));
          } else if (typeof message === "string") {
            setFormError(message);
          } else {
            setFormError("Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.");
          }
        } else if (err.request) {
          setFormError(
            "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc đảm bảo backend API đang chạy."
          );
        } else {
          setFormError("Lỗi kết nối: " + err.message);
        }
      } else {
        setFormError("Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      {/* Cột Trái - Giới thiệu */}
      <div className={styles.leftColumn}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg
              width="20"
              height="20"
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
          <span className={styles.logoText}>
            Lion<span className={styles.logoAccent}>Rail</span>
          </span>
        </Link>

        <div className={styles.leftContent}>
          <div className={styles.badgePrestige}>Hội Viên Đường Sắt</div>
          <h1 className={styles.mainTitle}>
            Đúng giờ.
            <br />
            Đúng chỗ.
            <br />
            <span className={styles.highlightGold}>Đúng chuyến.</span>
          </h1>
          <p className={styles.mainSubtitle}>
            Tạo tài khoản để quản lý vé, tích lũy điểm thưởng và nhận nhiều ưu
            đãi đặc quyền trên mọi hành trình.
          </p>
        </div>

        {/* Khung lịch trình tàu */}
        <div className={styles.scheduleBox}>
          <div className={styles.scheduleItem}>
            <span className={styles.time}>06:00</span>
            <span className={styles.route}>Sài Gòn – Đà Nẵng - SE1</span>
            <span className={styles.status}>Còn ghế</span>
          </div>
          <div className={styles.scheduleItem}>
            <span className={styles.time}>19:30</span>
            <span className={styles.route}>Sài Gòn – Đà Nẵng - SE3</span>
            <span className={styles.status}>Còn ghế</span>
          </div>
          <div className={styles.scheduleItem}>
            <span className={styles.time}>22:15</span>
            <span className={styles.route}>Hà Nội – Vinh - SE8</span>
            <span className={styles.statusEmpty}>Sắp hết</span>
          </div>
        </div>

        {/* SVG background grid rails in warm gold */}
        <div className={styles.railsBackground}>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className={styles.svgRails}
          >
            <path
              d="M 50 20 L 0 100"
              stroke="currentColor"
              strokeWidth="0.35"
              fill="none"
            />
            <path
              d="M 50 20 L 25 100"
              stroke="currentColor"
              strokeWidth="0.35"
              fill="none"
            />
            <path
              d="M 50 20 L 75 100"
              stroke="currentColor"
              strokeWidth="0.35"
              fill="none"
            />
            <path
              d="M 50 20 L 100 100"
              stroke="currentColor"
              strokeWidth="0.35"
              fill="none"
            />
            <line
              x1="40"
              y1="35"
              x2="60"
              y2="35"
              stroke="currentColor"
              strokeWidth="0.35"
            />
            <line
              x1="30"
              y1="50"
              x2="70"
              y2="50"
              stroke="currentColor"
              strokeWidth="0.35"
            />
            <line
              x1="15"
              y1="70"
              x2="85"
              y2="70"
              stroke="currentColor"
              strokeWidth="0.35"
            />
            <line
              x1="0"
              y1="90"
              x2="100"
              y2="90"
              stroke="currentColor"
              strokeWidth="0.35"
            />
            <circle cx="50" cy="20" r="2" fill="#d97706" />
            <circle cx="50" cy="20" r="4.5" fill="rgba(217, 119, 6, 0.18)" />
            <line
              x1="0"
              y1="20"
              x2="100"
              y2="20"
              stroke="currentColor"
              strokeWidth="0.25"
              strokeDasharray="1,1"
            />
          </svg>
        </div>
      </div>

      {/* Cột Phải - Form */}
      <div className={styles.rightColumn}>
        <div className={styles.themeToggle}>
          <Link href="/" className={styles.homeBtn}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Về trang chủ
          </Link>
        </div>

        <div className={styles.formContainer}>
          <div className={styles.tabs}>
            <Link
              href="/login"
              className={`${styles.tab} ${pathname === "/login" ? styles.activeTab : ""}`}
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className={`${styles.tab} ${pathname === "/register" ? styles.activeTab : ""}`}
            >
              Đăng ký
            </Link>
          </div>

          <h2 className={styles.formTitle}>Tạo tài khoản</h2>
          <p className={styles.formSubtitle}>
            Một phút để bắt đầu hành trình của bạn.
          </p>

          {/* Thông báo lỗi chung */}
          {formError && (
            <div className={styles.alertError} role="alert">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{formError}</span>
            </div>
          )}

          {/* Thông báo thành công */}
          {formSuccess && (
            <div className={styles.alertSuccess} role="status">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>{formSuccess}</span>
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="fullName">
                  Họ và tên
                </label>
                <input
                  className={`${styles.input} ${errors.fullName ? styles.inputError : ""}`}
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  disabled={loading}
                />
                {errors.fullName && (
                  <span className={styles.fieldError}>{errors.fullName}</span>
                )}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="username">
                  Tên đăng nhập
                </label>
                <input
                  className={`${styles.input} ${errors.username ? styles.inputError : ""}`}
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="nguyenvana"
                  disabled={loading}
                  autoComplete="username"
                />
                {errors.username && (
                  <span className={styles.fieldError}>{errors.username}</span>
                )}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="email">
                  Email
                </label>
                <input
                  className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ban@email.com"
                  disabled={loading}
                  autoComplete="email"
                />
                {errors.email && (
                  <span className={styles.fieldError}>{errors.email}</span>
                )}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="phone">
                  Số điện thoại
                </label>
                <input
                  className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0901234567"
                  disabled={loading}
                  autoComplete="tel"
                />
                {errors.phone && (
                  <span className={styles.fieldError}>{errors.phone}</span>
                )}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="password">
                Mật khẩu
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Ít nhất 6 ký tự"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.showHideBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {errors.password && (
                <span className={styles.fieldError}>{errors.password}</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="confirmPassword">
                Nhập lại mật khẩu
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.showHideBtn}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className={styles.fieldError}>{errors.confirmPassword}</span>
              )}
            </div>

            <div className={styles.formActions}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={agree}
                  onChange={(e) => {
                    setAgree(e.target.checked);
                    if (errors.agree) {
                      setErrors((prev) => ({ ...prev, agree: undefined }));
                    }
                  }}
                  disabled={loading}
                />
                <span>
                  Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật vé
                  tàu.
                </span>
              </label>
            </div>
            {errors.agree && (
              <span className={styles.fieldError}>{errors.agree}</span>
            )}

            <button
              className={styles.submitBtn}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner}></span>
              ) : (
                "Tạo tài khoản"
              )}
            </button>
          </form>

          <p className={styles.footerNote}>
            Hệ thống đường sắt trực tuyến an toàn & bảo mật.
          </p>
        </div>
      </div>
    </main>
  );
}

