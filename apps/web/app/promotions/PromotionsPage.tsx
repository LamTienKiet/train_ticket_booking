"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import styles from "./Promotions.module.css";

interface PromoVoucher {
  id: string;
  code: string;
  title: string;
  discount: string;
  category: "STUDENT" | "FAMILY" | "PAYMENT" | "SEASON" | "GENERAL";
  categoryLabel: string;
  description: string;
  minSpend: string;
  validUntil: string;
  remaining: number;
}

const VOUCHERS: PromoVoucher[] = [
  {
    id: "1",
    code: "LIONNEW",
    title: "Chào mừng bạn mới",
    discount: "GIẢM 10%",
    category: "GENERAL",
    categoryLabel: "Khách hàng mới",
    description: "Giảm 10% tối đa 50.000đ cho đơn đặt vé tàu đầu tiên tại hệ thống LionRail.",
    minSpend: "Đơn từ 200.000đ",
    validUntil: "31/12/2026",
    remaining: 450,
  },
  {
    id: "2",
    code: "SINHVIEN15",
    title: "Mùa tựu trường - Đồng hành cùng bạn",
    discount: "GIẢM 15%",
    category: "STUDENT",
    categoryLabel: "Sinh viên",
    description: "Áp dụng cho học sinh, sinh viên các trường đại học, cao đẳng khi đặt vé tàu khứ hồi.",
    minSpend: "Không giới hạn",
    validUntil: "30/09/2026",
    remaining: 280,
  },
  {
    id: "3",
    code: "FAMILY20",
    title: "Du lịch gia đình & Nhóm bạn",
    discount: "GIẢM 20%",
    category: "FAMILY",
    categoryLabel: "Nhóm & Gia đình",
    description: "Ưu đãi giảm 20% tổng hóa đơn khi đặt từ 4 vé trở lên cho các tuyến tàu Bắc - Nam.",
    minSpend: "Đặt từ 4 vé",
    validUntil: "30/11/2026",
    remaining: 120,
  },
  {
    id: "4",
    code: "VNPAY25",
    title: "Thanh toán thông minh qua VNPay",
    discount: "GIẢM 25.000đ",
    category: "PAYMENT",
    categoryLabel: "Cổng thanh toán",
    description: "Nhập mã khi chọn hình thức thanh toán quét mã VNPay-QR trên ứng dụng ngân hàng.",
    minSpend: "Đơn từ 300.000đ",
    validUntil: "15/10/2026",
    remaining: 680,
  },
  {
    id: "5",
    code: "EARLYBIRD",
    title: "Đặt sớm giá hời - Thảnh thơi đi tàu",
    discount: "GIẢM 10%",
    category: "SEASON",
    categoryLabel: "Ưu đãi đặt sớm",
    description: "Giảm trực tiếp 10% giá vé khi hành khách đặt vé trước ngày khởi hành tối thiểu 20 ngày.",
    minSpend: "Đặt trước 20 ngày",
    validUntil: "31/12/2026",
    remaining: 850,
  },
  {
    id: "6",
    code: "HERITAGE",
    title: "Hành trình di sản Huế - Đà Nẵng",
    discount: "GIẢM 30.000đ",
    category: "SEASON",
    categoryLabel: "Tuyến du lịch",
    description: "Trải nghiệm đoàn tàu du lịch 'Kết nối di sản miền Trung' ngắm đèo Hải Vân hùng vĩ.",
    minSpend: "Tuyến Huế ⇄ Đà Nẵng",
    validUntil: "31/10/2026",
    remaining: 95,
  },
];

export default function PromotionsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const filteredVouchers =
    selectedCategory === "ALL"
      ? VOUCHERS
      : VOUCHERS.filter((v) => v.category === selectedCategory);

  return (
    <main className={styles.main}>
      <Navbar />

      {/* HERO SECTION */}
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <div className={styles.heroTag}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Ưu Đãi Đặc Quyền LionRail
          </div>
          <h1 className={styles.heroTitle}>
            Khuyến Mãi & Voucher Vé Tàu Hỏa
          </h1>
          <p className={styles.heroSubtitle}>
            Săn vé tàu giá tốt nhất mỗi ngày. Lưu mã voucher ngay dưới đây và áp dụng tại bước thanh toán để nhận chiết khấu lên đến 25%.
          </p>

          {/* FILTER BUTTONS */}
          <div className={styles.filterContainer}>
            <button
              className={`${styles.filterBtn} ${selectedCategory === "ALL" ? styles.filterBtnActive : ""}`}
              onClick={() => setSelectedCategory("ALL")}
            >
              Tất cả ưu đãi ({VOUCHERS.length})
            </button>
            <button
              className={`${styles.filterBtn} ${selectedCategory === "STUDENT" ? styles.filterBtnActive : ""}`}
              onClick={() => setSelectedCategory("STUDENT")}
            >
              Học sinh - Sinh viên
            </button>
            <button
              className={`${styles.filterBtn} ${selectedCategory === "FAMILY" ? styles.filterBtnActive : ""}`}
              onClick={() => setSelectedCategory("FAMILY")}
            >
              Vé nhóm & Gia đình
            </button>
            <button
              className={`${styles.filterBtn} ${selectedCategory === "PAYMENT" ? styles.filterBtnActive : ""}`}
              onClick={() => setSelectedCategory("PAYMENT")}
            >
              Cổng thanh toán
            </button>
            <button
              className={`${styles.filterBtn} ${selectedCategory === "SEASON" ? styles.filterBtnActive : ""}`}
              onClick={() => setSelectedCategory("SEASON")}
            >
              Du lịch & Mùa lễ
            </button>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className={styles.contentContainer}>
        {/* SECTION 1: VOUCHER GRID */}
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h2 className={styles.sectionTitle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.2">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 10h18M7 15h.01M11 15h2" />
              </svg>
              Mã Giảm Giá Đang Mở
            </h2>
            <span style={{ fontSize: "14px", color: "#64748b" }}>
              Hiển thị {filteredVouchers.length} ưu đãi
            </span>
          </div>
          <p className={styles.sectionSubtitle}>
            Nhấn &quot;Sao chép&quot; để lưu mã và áp dụng tự động trong quá trình đặt vé trực tuyến.
          </p>
        </div>

        <div className={styles.couponsGrid}>
          {filteredVouchers.map((v) => {
            let catBadgeClass = styles.badgeGeneral;
            if (v.category === "STUDENT") catBadgeClass = styles.badgeStudent;
            if (v.category === "FAMILY") catBadgeClass = styles.badgeFamily;
            if (v.category === "PAYMENT") catBadgeClass = styles.badgePayment;
            if (v.category === "SEASON") catBadgeClass = styles.badgeSeason;

            const isCopied = copiedCode === v.code;

            return (
              <div key={v.id} className={styles.couponCard}>
                <div className={styles.couponTop}>
                  <div className={styles.badgeRow}>
                    <span className={`${styles.categoryBadge} ${catBadgeClass}`}>
                      {v.categoryLabel}
                    </span>
                    <span className={styles.discountBadge}>{v.discount}</span>
                  </div>
                  <h3 className={styles.couponTitle}>{v.title}</h3>
                  <p className={styles.couponDesc}>{v.description}</p>
                </div>

                <div className={styles.couponBody}>
                  <div className={styles.metaList}>
                    <div className={styles.metaItem}>
                      <svg className={styles.metaIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                      <span>Điều kiện: <strong>{v.minSpend}</strong></span>
                    </div>
                    <div className={styles.metaItem}>
                      <svg className={styles.metaIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      <span>Hạn sử dụng: <strong>{v.validUntil}</strong></span>
                    </div>
                    <div className={styles.metaItem}>
                      <svg className={styles.metaIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>Còn lại: <strong>{v.remaining} lượt dùng</strong></span>
                    </div>
                  </div>

                  <div className={styles.couponActionRow}>
                    <div className={styles.codeBox}>
                      <span className={styles.codeText}>{v.code}</span>
                      <button
                        className={`${styles.copyBtn} ${isCopied ? styles.copyBtnCopied : ""}`}
                        onClick={() => handleCopy(v.code)}
                        type="button"
                      >
                        {isCopied ? "✓ Đã chép" : "Sao chép"}
                      </button>
                    </div>
                    <Link href="/trips" className={styles.applyLink}>
                      Dùng ngay →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SECTION 2: CHÍNH SÁCH GIẢM GIÁ ĐỐI TƯỢNG ĐƯỜNG SẮT (QUY CHUẨN THỰC TẾ) */}
        <section className={styles.policySection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Chính Sách Giảm Giá Thường Niên Theo Đối Tượng
            </h2>
            <p className={styles.sectionSubtitle}>
              Áp dụng tự động cho mọi chuyến tàu của LionRail theo đúng quy chuẩn ngành đường sắt Việt Nam.
            </p>
          </div>

          <div className={styles.policyTableWrapper}>
            <table className={styles.policyTable}>
              <thead>
                <tr>
                  <th>Đối tượng hành khách</th>
                  <th>Mức giảm giá</th>
                  <th>Cơ chế áp dụng</th>
                  <th>Giấy tờ chứng minh khi lên tàu</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Trẻ em sơ sinh (dưới 6 tuổi)</strong>
                  </td>
                  <td>
                    <span className={styles.discountHighlight}>Miễn phí 100%</span>
                  </td>
                  <td>
                    <span className={styles.policyTagAuto}>Tự động tính</span>
                  </td>
                  <td>Giấy khai sinh hoặc bản sao trích lục</td>
                </tr>
                <tr>
                  <td>
                    <strong>Trẻ em từ 6 đến 10 tuổi</strong>
                  </td>
                  <td>
                    <span className={styles.discountHighlight}>Giảm 25%</span> giá vé
                  </td>
                  <td>
                    <span className={styles.policyTagAuto}>Tự động tính</span>
                  </td>
                  <td>Giấy khai sinh hoặc CCCD (nếu có)</td>
                </tr>
                <tr>
                  <td>
                    <strong>Học sinh, Sinh viên</strong>
                  </td>
                  <td>
                    <span className={styles.discountHighlight}>Giảm 10%</span> giá vé
                  </td>
                  <td>
                    <span className={styles.policyTagAuto}>Tự động tính</span>
                  </td>
                  <td>Thẻ học sinh / sinh viên còn hạn sử dụng</td>
                </tr>
                <tr>
                  <td>
                    <strong>Người cao tuổi (từ 60 tuổi trở lên)</strong>
                  </td>
                  <td>
                    <span className={styles.discountHighlight}>Giảm 15%</span> giá vé
                  </td>
                  <td>
                    <span className={styles.policyTagAuto}>Tự động tính</span>
                  </td>
                  <td>Căn cước công dân gắn chip hoặc tài khoản VNeID mức 2</td>
                </tr>
                <tr>
                  <td>
                    <strong>Thương binh, Người khuyết tật</strong>
                  </td>
                  <td>
                    <span className={styles.discountHighlight}>Giảm 30%</span> giá vé
                  </td>
                  <td>
                    <span className={styles.policyTagAuto}>Tự động tính</span>
                  </td>
                  <td>Thẻ thương binh hoặc giấy chứng nhận khuyết tật</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 3: 3 BƯỚC DÙNG MÃ GIẢM GIÁ */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Cách Sử Dụng Mã Giảm Giá Khi Mua Vé
          </h2>
          <p className={styles.sectionSubtitle}>
            Thực hiện 3 thao tác đơn giản để tiết kiệm chi phí tối đa cho chuyến đi.
          </p>
        </div>

        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepTitle}>Thu thập mã ưu đãi</h3>
            <p className={styles.stepDesc}>
              Chọn voucher phù hợp với nhu cầu của bạn ở danh sách phía trên và nhấn nút <strong>Sao chép</strong> mã.
            </p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepTitle}>Tìm chuyến & chọn chỗ</h3>
            <p className={styles.stepDesc}>
              Vào trang Tìm chuyến tàu, chọn ga đi - ga đến, ngày khởi hành và lựa chọn vị trí toa, ghế ngồi ưng ý.
            </p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepTitle}>Nhập mã & Thanh toán</h3>
            <p className={styles.stepDesc}>
              Dán mã voucher vào ô khuyến mãi tại trang thanh toán. Hệ thống sẽ tự động trừ trực tiếp số tiền chiết khấu.
            </p>
          </div>
        </div>

        {/* CTA BANNER */}
        <section className={styles.ctaBanner}>
          <h2 className={styles.ctaTitle}>Bạn đã sẵn sàng cho chuyến hành trình tiếp theo?</h2>
          <p className={styles.ctaDesc}>
            Đặt vé ngay hôm nay để nhận thêm nhiều ưu đãi độc quyền dành riêng cho khách hàng của LionRail.
          </p>
          <Link href="/trips" className={styles.ctaBtn}>
            Tìm Chuyến Tàu Ngay →
          </Link>
        </section>
      </div>
    </main>
  );
}
