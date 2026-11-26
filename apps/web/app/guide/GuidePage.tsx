"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import styles from "./Guide.module.css";

type GuideTab = "booking" | "payment" | "refund" | "boarding" | "faq";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "Sau khi thanh toán thành công, tôi có cần in vé giấy ra không?",
    a: "Không cần thiết. LionRail phát hành vé điện tử chính thức kèm mã QR. Quý khách chỉ cần lưu ảnh vé điện tử trên điện thoại hoặc mở email/trang 'Tra Cứu Vé' để nhân viên soát vé quét mã QR trực tiếp tại cửa kiểm soát.",
  },
  {
    q: "Thời gian giữ chỗ vé tàu là bao lâu?",
    a: "Hệ thống tự động khóa giữ chỗ trong vòng 10 phút tính từ khi quý khách nhấn nút 'Tiến hành đặt vé'. Trong 10 phút này, ghế của quý khách được bảo đảm 100% không bị người khác tranh mua. Nếu quá 10 phút chưa hoàn tất thanh toán, hệ thống sẽ tự động giải phóng ghế cho hành khách khác.",
  },
  {
    q: "Tôi có thể hủy vé và nhận lại tiền không?",
    a: "Có. Quý khách có thể tự hủy vé trực tuyến tại mục 'Tra Cứu Vé' bằng cách nhập Mã đặt chỗ (PNR) và Số điện thoại. Tiền hoàn sẽ được chuyển về tài khoản thanh toán ban đầu theo đúng quy định khấu trừ thời gian của ngành đường sắt.",
  },
  {
    q: "Trẻ em đi cùng có cần mua vé không?",
    a: "Trẻ em dưới 6 tuổi (và cao dưới 1.12m) được MIỄN PHÍ 100% khi ngồi/nằm chung với người lớn đi kèm. Trẻ em từ 6 đến 10 tuổi được giảm 25% giá vé và được bố trí chỗ ngồi riêng biệt.",
  },
  {
    q: "Nếu tôi nhập sai số CCCD hoặc họ tên hành khách thì phải làm sao?",
    a: "Trước giờ tàu chạy ít nhất 2 giờ, quý khách vui lòng liên hệ Tổng đài 1900 1234 hoặc đến quầy hỗ trợ tại nhà ga, xuất trình CCCD gốc và mã vé điện tử để nhân viên hỗ trợ đính chính thông tin miễn phí.",
  },
];

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<GuideTab>("booking");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <main className={styles.main}>
      <Navbar />

      {/* HERO SECTION */}
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <div className={styles.heroTag}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            Cẩm Nang Hành Trình Đường Sắt
          </div>
          <h1 className={styles.heroTitle}>
            Trung Tâm Hướng Dẫn & Hỗ Trợ Khách Hàng
          </h1>
          <p className={styles.heroSubtitle}>
            Tất cả những thông tin quan trọng bạn cần nắm rõ: từ quy trình đặt chỗ, cơ chế thanh toán, chính sách hoàn đổi vé đến quy định hành lý khi đi tàu.
          </p>
        </div>
      </section>

      {/* TAB NAVIGATION */}
      <div className={styles.tabNavWrapper}>
        <div className={styles.tabNavContainer}>
          <button
            className={`${styles.tabBtn} ${activeTab === "booking" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("booking")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            1. Quy Trình Đặt Vé
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === "payment" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("payment")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            2. Thanh Toán & Giữ Chỗ
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === "refund" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("refund")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            3. Đổi - Trả Vé & Hoàn Tiền
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === "boarding" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("boarding")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            4. Thủ Tục & Hành Lý
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === "faq" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("faq")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            5. Câu Hỏi Thường Gặp (FAQ)
          </button>
        </div>
      </div>

      {/* CONTENT PANELS */}
      <div className={styles.contentContainer}>
        {/* TAB 1: QUY TRÌNH ĐẶT VÉ */}
        {activeTab === "booking" && (
          <div className={styles.tabContentPanel}>
            <div className={styles.guideCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Quy Trình 4 Bước Đặt Vé Tàu Trực Tuyến</h2>
                  <p className={styles.cardDesc}>
                    Chỉ với vài thao tác đơn giản trên điện thoại hoặc máy tính, bạn đã có ngay tấm vé tàu điện tử chính thức.
                  </p>
                </div>
              </div>

              <div className={styles.processList}>
                <div className={styles.processItem}>
                  <div className={styles.processBadge}>1</div>
                  <div className={styles.processBody}>
                    <h3 className={styles.processTitle}>Tìm kiếm hành trình</h3>
                    <p className={styles.processText}>
                      Tại trang chủ hoặc trang <strong>Chuyến Tàu</strong>, chọn ga xuất phát, ga đến và ngày đi. Hệ thống sẽ hiển thị toàn bộ các chuyến tàu chạy trong ngày (SE1, SE2, SE3...) kèm giờ khởi hành, thời gian di chuyển và mức giá tốt nhất.
                    </p>
                    <div className={styles.tipBox}>
                      <span>💡 <strong>Mẹo:</strong> Hãy đặt vé trước từ 10 - 20 ngày cho các chặng đông khách như Hà Nội - Đà Nẵng, Sài Gòn - Nha Trang để chọn được vị trí giường nằm tầng 1 đẹp nhất.</span>
                    </div>
                  </div>
                </div>

                <div className={styles.processItem}>
                  <div className={styles.processBadge}>2</div>
                  <div className={styles.processBody}>
                    <h3 className={styles.processTitle}>Chọn loại toa & vị trí ghế</h3>
                    <p className={styles.processText}>
                      Hệ thống cung cấp sơ đồ toa xe trực quan: Toa ngồi mềm điều hòa (64 chỗ), Toa giường nằm khoang 6 hoặc Toa giường nằm khoang 4 VIP. Ghế trống hiển thị màu trắng/xanh, ghế đã có người đặt sẽ chuyển màu xám và bị khóa chọn.
                    </p>
                  </div>
                </div>

                <div className={styles.processItem}>
                  <div className={styles.processBadge}>3</div>
                  <div className={styles.processBody}>
                    <h3 className={styles.processTitle}>Khai báo thông tin hành khách & ưu đãi</h3>
                    <p className={styles.processText}>
                      Nhập họ tên, số CCCD/Hộ chiếu và chọn đối tượng phù hợp (Người lớn, Sinh viên, Trẻ em, Người cao tuổi). Hệ thống LionRail sẽ <strong>tự động áp dụng mức giảm giá tương ứng</strong> (10% - 25%) ngay lập tức.
                    </p>
                  </div>
                </div>

                <div className={styles.processItem}>
                  <div className={styles.processBadge}>4</div>
                  <div className={styles.processBody}>
                    <h3 className={styles.processTitle}>Thanh toán & Nhận vé điện tử có mã QR</h3>
                    <p className={styles.processText}>
                      Xác nhận thanh toán qua các cổng thanh toán bảo mật. Ngay sau khi hoàn tất, hệ thống tự động xuất mã PNR và Thẻ lên tàu điện tử (Boarding Pass) có mã QR Code chuẩn để quét tại ga.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THANH TOÁN & GIỮ CHỖ */}
        {activeTab === "payment" && (
          <div className={styles.tabContentPanel}>
            <div className={styles.guideCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Cơ Chế Giữ Chỗ 10 Phút & Phương Thức Thanh Toán</h2>
                  <p className={styles.cardDesc}>
                    Giải pháp chống xung đột chỗ ngồi (Race Condition) độc quyền giúp bảo vệ quyền lợi tối đa của hành khách.
                  </p>
                </div>
              </div>

              <div className={styles.featureGrid}>
                <div className={styles.featureBox}>
                  <h3 className={styles.featureBoxTitle}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Khóa ghế 10 phút (Hold TTL)
                  </h3>
                  <p className={styles.featureBoxText}>
                    Khi bạn nhấn nút đặt vé, hệ thống ghi nhận trạng thái HELD trong Database. Ghế của bạn sẽ được khóa tuyệt đối trong đúng 10 phút để bạn thảnh thơi nhập thông tin và thanh toán mà không sợ bị người khác &quot;cướp chỗ&quot;.
                  </p>
                </div>

                <div className={styles.featureBox}>
                  <h3 className={styles.featureBoxTitle}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Đa dạng cổng thanh toán
                  </h3>
                  <p className={styles.featureBoxText}>
                    Hỗ trợ thanh toán tức thì qua quét mã VNPay-QR trên 35+ ứng dụng ngân hàng, thẻ ATM nội địa Napas, thẻ thanh toán quốc tế Visa/Mastercard hoặc ví điện tử.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: "24px" }}>
                <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "8px" }}>
                  Xử lý trường hợp hết thời gian giữ chỗ:
                </h3>
                <p style={{ fontSize: "14.5px", color: "#475569", lineHeight: "1.6" }}>
                  Nếu đồng hồ đếm ngược 10 phút kết thúc mà bạn chưa thanh toán, đơn hàng sẽ chuyển sang trạng thái <strong>EXPIRED (Hết hạn)</strong>. Ghế sẽ tự động được mở lại cho hành khách khác trên hệ thống. Bạn chỉ cần quay lại trang Tìm chuyến để chọn lại chỗ ngồi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ĐỔI - TRẢ VÉ & HOÀN TIỀN */}
        {activeTab === "refund" && (
          <div className={styles.tabContentPanel}>
            <div className={styles.guideCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Quy Định Đổi / Trả Vé & Tỷ Lệ Hoàn Tiền</h2>
                  <p className={styles.cardDesc}>
                    Chính sách hoàn hủy vé minh bạch theo quy định của Tổng công ty Đường sắt Việt Nam.
                  </p>
                </div>
              </div>

              <p style={{ fontSize: "14.5px", color: "#475569", lineHeight: "1.6" }}>
                Hành khách có thể tự hủy vé trực tuyến trực tiếp tại mục <Link href="/tickets" style={{ color: "#0284c7", fontWeight: "700" }}>Tra Cứu Vé</Link> mà không cần phải ra tận nhà ga.
              </p>

              <table className={styles.policyTable}>
                <thead>
                  <tr>
                    <th>Thời điểm yêu cầu trả vé</th>
                    <th>Mức phí khấu trừ</th>
                    <th>Số tiền hoàn lại cho khách</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Trước giờ tàu chạy từ <strong>24 giờ trở lên</strong></td>
                    <td><span className={styles.feeTagLow}>10%</span> giá vé</td>
                    <td><strong>90%</strong> giá trị vé</td>
                  </tr>
                  <tr>
                    <td>Trước giờ tàu chạy từ <strong>4 giờ đến dưới 24 giờ</strong></td>
                    <td><span className={styles.feeTagMed}>20%</span> giá vé</td>
                    <td><strong>80%</strong> giá trị vé</td>
                  </tr>
                  <tr>
                    <td>Dưới <strong>4 giờ</strong> trước khi tàu khởi hành</td>
                    <td><span className={styles.feeTagHigh}>100%</span> (Không áp dụng đổi/trả)</td>
                    <td><strong>0%</strong> (Không hoàn tiền)</td>
                  </tr>
                </tbody>
              </table>

              <div className={styles.tipBox} style={{ marginTop: "20px" }}>
                <span>ℹ️ <strong>Lưu ý:</strong> Tiền hoàn sẽ được hệ thống xử lý tự động về thẻ hoặc tài khoản ngân hàng của quý khách trong vòng 1 - 3 ngày làm việc tùy thuộc vào ngân hàng thụ hưởng.</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: THỦ TỤC & HÀNH LÝ */}
        {activeTab === "boarding" && (
          <div className={styles.tabContentPanel}>
            <div className={styles.guideCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Quy Định Giấy Tờ Tùy Thân & Hành Lý Đi Tàu</h2>
                  <p className={styles.cardDesc}>
                    Chuẩn bị đầy đủ giấy tờ cần thiết để quá trình soát vé và lên tàu diễn ra nhanh chóng nhất.
                  </p>
                </div>
              </div>

              <div className={styles.featureGrid}>
                <div className={styles.featureBox}>
                  <h3 className={styles.featureBoxTitle}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <line x1="7" y1="8" x2="17" y2="8" />
                      <line x1="7" y1="12" x2="13" y2="12" />
                    </svg>
                    Giấy tờ tùy thân hợp lệ
                  </h3>
                  <ul style={{ margin: "0", paddingLeft: "18px", fontSize: "14px", color: "#475569", lineHeight: "1.7" }}>
                    <li>Căn cước công dân gắn chip hoặc Hộ chiếu gốc.</li>
                    <li>Tài khoản định danh điện tử VNeID mức độ 2.</li>
                    <li>Giấy khai sinh đối với trẻ em dưới 14 tuổi.</li>
                    <li>Thẻ học sinh / sinh viên nếu đặt vé theo diện ưu đãi sinh viên.</li>
                  </ul>
                </div>

                <div className={styles.featureBox}>
                  <h3 className={styles.featureBoxTitle}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    </svg>
                    Quy định định mức hành lý
                  </h3>
                  <ul style={{ margin: "0", paddingLeft: "18px", fontSize: "14px", color: "#475569", lineHeight: "1.7" }}>
                    <li>Mỗi vé được mang tối đa <strong>20kg hành lý xách tay</strong> miễn phí.</li>
                    <li>Kích thước kiện hành lý không vượt quá 0.8m x 0.5m x 0.4m.</li>
                    <li>Nghiêm cấm mang vũ khí, chất cháy nổ, hóa chất độc hại, gia súc gia cầm sống lên tàu.</li>
                  </ul>
                </div>
              </div>

              <div style={{ marginTop: "24px" }}>
                <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "8px" }}>
                  Thời gian có mặt tại ga:
                </h3>
                <p style={{ fontSize: "14.5px", color: "#475569", lineHeight: "1.6" }}>
                  Quý khách nên có mặt tại nhà ga trước giờ tàu chạy ít nhất <strong>30 - 45 phút</strong>. Cửa kiểm soát soát vé sẽ đóng trước giờ tàu chạy 5 phút để đảm bảo an toàn tuyệt đối cho đoàn tàu trước khi xuất phát.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FAQ */}
        {activeTab === "faq" && (
          <div className={styles.tabContentPanel}>
            <div className={styles.guideCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Những Câu Hỏi Thường Gặp Nhất</h2>
                  <p className={styles.cardDesc}>
                    Giải đáp nhanh chóng các vướng mắc phổ biến của hành khách khi sử dụng hệ thống vé tàu điện tử LionRail.
                  </p>
                </div>
              </div>

              <div className={styles.faqList}>
                {FAQS.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div key={index} className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ""}`}>
                      <button
                        className={styles.faqQuestionBtn}
                        onClick={() => toggleFaq(index)}
                        type="button"
                      >
                        <span>{faq.q}</span>
                        <svg
                          className={`${styles.faqIcon} ${isOpen ? styles.faqIconOpen : ""}`}
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {isOpen && <div className={styles.faqAnswer}>{faq.a}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SECTION LIÊN HỆ & TỔNG ĐÀI HỖ TRỢ */}
        <div style={{ marginTop: "40px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px" }}>
            Kênh Hỗ Trợ Khách Hàng 24/7
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px" }}>
            Đội ngũ chăm sóc khách hàng của LionRail luôn sẵn sàng giải đáp và xử lý mọi yêu cầu của bạn.
          </p>

          <div className={styles.contactGrid}>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <h3 className={styles.contactTitle}>Tổng Đài Đặt Vé & Hỗ Trợ</h3>
              <p className={styles.contactValue}>1900 1234</p>
              <p className={styles.contactSub}>Cước phí 1.000đ/phút • Hoạt động 24/7</p>
            </div>

            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h3 className={styles.contactTitle}>Hộp Thư Điện Tử</h3>
              <p className={styles.contactValue} style={{ fontSize: "16px" }}>hotro@lionrail.vn</p>
              <p className={styles.contactSub}>Phản hồi trong vòng 30 phút</p>
            </div>

            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 className={styles.contactTitle}>Quầy Hỗ Trợ Trực Tiếp</h3>
              <p className={styles.contactValue} style={{ fontSize: "16px" }}>Ga Hà Nội & Ga Sài Gòn</p>
              <p className={styles.contactSub}>Tại sảnh tầng 1 các nhà ga trung tâm</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
