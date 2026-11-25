"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import styles from "./page.module.css";
import { authService } from "../services/auth.service";
import { LoginFormErrors } from "../types/auth.api";

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formSignIn, setFormSignIn] = useState({
    username: "",
    password: "",
    remember: false,
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Kiểm tra nếu vừa chuyển hướng từ trang Đăng ký thành công
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("registered") === "true") {
        setFormSuccess("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormSignIn((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Xóa lỗi của trường tương ứng khi người dùng nhập tiếp
    if (errors[name as keyof LoginFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
    if (formError) setFormError("");
  };

  const validate = (): boolean => {
    const next: LoginFormErrors = {};
    if (!formSignIn.username.trim()) {
      next.username = "Vui lòng nhập tên đăng nhập hoặc email.";
    }
    if (!formSignIn.password) {
      next.password = "Vui lòng nhập mật khẩu.";
    } else if (formSignIn.password.length < 6) {
      next.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!validate()) return;

    setLoading(true);

    try {
      await authService.login(formSignIn, formSignIn.remember);

      setFormSuccess("Đăng nhập thành công! Đang chuyển hướng...");

      // Quay về trang trước khi bị yêu cầu đăng nhập (chỉ nhận đường dẫn nội bộ), mặc định trang chủ
      const next = new URLSearchParams(window.location.search).get("next");
      const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      setTimeout(() => {
        router.push(target);
        router.refresh();
      }, 800);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          const status = err.response.status;
          const message = err.response.data?.message;

          if (status === 401) {
            setFormError(
              typeof message === "string" && message.length > 0
                ? message
                : "Tên đăng nhập hoặc mật khẩu không chính xác."
            );
          } else if (Array.isArray(message)) {
            setFormError(message.join(", "));
          } else if (typeof message === "string") {
            setFormError(message);
          } else {
            setFormError("Đăng nhập thất bại. Vui lòng thử lại.");
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
          <div className={styles.badgePrestige}>Hệ Thống Đặt Vé Trực Tuyến</div>
          <h1 className={styles.mainTitle}>
            Đúng giờ.
            <br />
            Đúng chỗ.
            <br />
            <span className={styles.highlightGold}>Đúng chuyến.</span>
          </h1>
          <p className={styles.mainSubtitle}>
            Đăng nhập để quản lý vé, giữ chỗ theo từng chặng và lên tàu thuận
            tiện bằng mã QR.
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

          <h2 className={styles.formTitle}>Chào mừng trở lại</h2>
          <p className={styles.formSubtitle}>
            Đăng nhập để xem vé và đặt chuyến mới.
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
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="username">
                Tên đăng nhập hoặc Email
              </label>
              <input
                className={`${styles.input} ${errors.username ? styles.inputError : ""}`}
                type="text"
                id="username"
                name="username"
                value={formSignIn.username}
                onChange={handleChange}
                placeholder="Nhập username hoặc ban@email.com"
                disabled={loading}
                autoComplete="username"
              />
              {errors.username && (
                <span className={styles.fieldError}>{errors.username}</span>
              )}
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
                  value={formSignIn.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  disabled={loading}
                  autoComplete="current-password"
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

            <div className={styles.formActions}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  name="remember"
                  checked={formSignIn.remember}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <Link href="#" className={styles.forgotPassword}>
                Quên mật khẩu?
              </Link>
            </div>

            <button
              className={styles.submitBtn}
              type="submit"
              disabled={loading}
            >
              {loading ? <span className={styles.spinner}></span> : "Đăng nhập"}
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

