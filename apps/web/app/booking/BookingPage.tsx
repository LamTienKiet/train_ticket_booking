"use client";

import Link from "next/link";
import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./page.module.css";

// Import các kiểu dữ liệu
import {
  PassengerForm,
  PassengerType,
  ContactInfo,
  InvoiceInfo,
  PaymentMethodType,
} from "./types/booking.types";

// Import các components con đã được phân tách gọn gàng
import BookingHeader from "./components/BookingHeader";
import BookingProgressBar from "./components/BookingProgressBar";
import HoldSeatCountdown from "./components/HoldSeatCountdown";
import PassengerFormList from "./components/PassengerFormList";
import ContactInfoForm from "./components/ContactInfoForm";
import PaymentMethodSelector from "./components/PaymentMethodSelector";
import BookingSidebarSummary from "./components/BookingSidebarSummary";

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trainParam = searchParams.get("train") || "SE1";
  const seatsParam = searchParams.get("seats") || "1-02,1-06";
  const tripIdParam = searchParams.get("tripId") || trainParam;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Parse thông tin ghế từ query params hoặc dùng mặc định
  const initialPassengers: PassengerForm[] = useMemo(() => {
    const seatItems = seatsParam.split(",").filter(Boolean);
    if (seatItems.length === 0) {
      return [
        {
          id: "p-1",
          seatLabel: "Toa 1 - Ghế 02",
          coachNumber: "1",
          seatNumber: "02",
          seatType: "Ngồi mềm điều hòa",
          basePrice: 850000,
          fullName: "",
          passengerType: "ADULT",
          idCard: "",
          hasInsurance: true,
        },
      ];
    }

    return seatItems.map((item, idx) => {
      const parts = item.split("-");
      const coach = parts[0] || "1";
      const seat = parts[1] || `0${idx + 1}`;
      return {
        id: `p-${idx + 1}`,
        seatLabel: `Toa ${coach} - Ghế ${seat}`,
        coachNumber: coach,
        seatNumber: seat,
        seatType: coach === "1" ? "Ngồi mềm điều hòa" : "Khoang 4 nằm mềm",
        basePrice: coach === "1" ? 850000 : 1250000,
        fullName: "",
        passengerType: "ADULT",
        idCard: "",
        hasInsurance: true,
      };
    });
  }, [seatsParam]);

  // State danh sách hành khách
  const [passengers, setPassengers] = useState<PassengerForm[]>(initialPassengers);

  // State người liên hệ (người đặt vé)
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    fullName: "",
    phone: "",
    email: "",
    note: "",
  });

  // State xuất hóa đơn VAT
  const [needInvoice, setNeedInvoice] = useState(false);
  const [invoiceInfo, setInvoiceInfo] = useState<InvoiceInfo>({
    companyName: "",
    taxCode: "",
    companyAddress: "",
  });

  // State phương thức thanh toán
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("VIETQR");

  // State mã giảm giá
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [discountMessage, setDiscountMessage] = useState<string>("");

  // State đồng ý điều khoản
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Cập nhật thông tin từng hành khách
  const handlePassengerChange = (
    index: number,
    field: keyof PassengerForm,
    value: any
  ) => {
    setPassengers((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  // Tính giá vé từng người theo đối tượng
  const calculateSeatPrice = (base: number, type: PassengerType) => {
    switch (type) {
      case "CHILD":
        return Math.round(base * 0.75); // Giảm 25%
      case "STUDENT":
        return Math.round(base * 0.9); // Giảm 10%
      case "SENIOR":
        return Math.round(base * 0.85); // Giảm 15%
      default:
        return base;
    }
  };

  // Tổng tiền vé
  const totalTicketPrice = useMemo(() => {
    return passengers.reduce((sum, p) => {
      return sum + calculateSeatPrice(p.basePrice, p.passengerType);
    }, 0);
  }, [passengers]);

  // Tổng phí bảo hiểm (5.000 đ / người nếu tick)
  const totalInsurance = useMemo(() => {
    return passengers.filter((p) => p.hasInsurance).length * 5000;
  }, [passengers]);

  // Tổng tiền cuối cùng
  const finalTotal = Math.max(0, totalTicketPrice + totalInsurance - appliedDiscount);

  // Áp dụng voucher mẫu
  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (voucherCode.trim().toUpperCase() === "LIONRAIL50") {
      setAppliedDiscount(50000);
      setDiscountMessage("Đã áp dụng mã giảm 50.000 đ thành công!");
    } else if (voucherCode.trim().toUpperCase() === "XUAN2026") {
      setAppliedDiscount(100000);
      setDiscountMessage("Đã áp dụng mã giảm 100.000 đ Tết 2026!");
    } else {
      setAppliedDiscount(0);
      setDiscountMessage("Mã giảm giá không hợp lệ hoặc đã hết hạn.");
    }
  };

  // Xử lý gửi đơn đặt vé tới API Backend
  const handleSubmitBooking = async () => {
    setApiError(null);

    // 1. Kiểm tra thông tin người đặt
    if (
      !contactInfo.fullName.trim() ||
      !contactInfo.phone.trim() ||
      !contactInfo.email.trim()
    ) {
      setApiError(
        "Vui lòng điền đầy đủ Họ tên, Số điện thoại và Email người đặt vé."
      );
      return;
    }

    // 2. Kiểm tra thông tin từng hành khách
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.fullName.trim() || !p.idCard.trim()) {
        setApiError(
          `Vui lòng nhập Họ tên và CMND/CCCD cho hành khách tại ${p.seatLabel}.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || localStorage.getItem("access_token")
          : null;

      const payload = {
        tripId: tripIdParam,
        contactName: contactInfo.fullName.trim(),
        contactPhone: contactInfo.phone.trim(),
        contactEmail: contactInfo.email.trim(),
        note: contactInfo.note?.trim() || undefined,
        passengers: passengers.map((p) => ({
          seatId: `${p.coachNumber}-${p.seatNumber}`,
          fullName: p.fullName.trim(),
          idNumber: p.idCard.trim(),
          passengerType: p.passengerType,
          hasInsurance: p.hasInsurance,
        })),
      };

      const res = await fetch("http://localhost:3001/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message || "Không thể tạo đơn đặt chỗ. Vui lòng thử lại."
        );
      }

      // Đặt chỗ thành công -> Chuyển sang màn hình thanh toán với Mã PNR thật từ database
      router.push(
        `/payment?pnr=${data.bookingCode}&method=${paymentMethod}&train=${trainParam}`
      );
    } catch (err: any) {
      setApiError(err.message || "Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. THANH TIẾN TRÌNH CÁC BƯỚC */}
      <BookingProgressBar />

      {/* 2. BANNER ĐẾM NGƯỢC GIỮ CHỖ */}
      <HoldSeatCountdown timeLeft="09:48" />

      {/* 3. BỐ CỤC CHÍNH 2 CỘT */}
      <div className={styles.bookingGrid}>
        {/* CỘT TRÁI: FORM NHẬP THÔNG TIN */}
        <div className={styles.leftCol}>
          {/* Form danh sách hành khách */}
          <PassengerFormList
            passengers={passengers}
            onPassengerChange={handlePassengerChange}
            calculateSeatPrice={calculateSeatPrice}
          />

          {/* Form thông tin người đặt & hóa đơn VAT */}
          <ContactInfoForm
            contactInfo={contactInfo}
            onContactInfoChange={setContactInfo}
            needInvoice={needInvoice}
            onNeedInvoiceChange={setNeedInvoice}
            invoiceInfo={invoiceInfo}
            onInvoiceInfoChange={setInvoiceInfo}
          />

          {/* Form chọn phương thức thanh toán */}
          <PaymentMethodSelector
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
          />

          {/* Điều khoản và nút xác nhận */}
          <section className={styles.termsSection}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>
                Tôi đã đọc và đồng ý với{" "}
                <Link href="#" className={styles.termsLink}>
                  Quy định đổi trả vé tàu
                </Link>{" "}
                và{" "}
                <Link href="#" className={styles.termsLink}>
                  Chính sách vận chuyển của LionRail
                </Link>
                .
              </span>
            </label>

            {/* Thông báo lỗi nghiệp vụ từ API (ví dụ: ghế đã có người giữ chỗ) */}
            {apiError && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  color: "#b91c1c",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginTop: "14px",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>⚠️</span>
                <strong>{apiError}</strong>
              </div>
            )}

            <div className={styles.actionRow}>
              <Link
                href={`/trips/seats?train=${trainParam}`}
                className={styles.backBtn}
              >
                ← Quay lại chọn chỗ
              </Link>

              <button
                type="button"
                onClick={handleSubmitBooking}
                disabled={!agreeTerms || isSubmitting}
                className={styles.submitOrderBtn}
                style={{
                  cursor: !agreeTerms || isSubmitting ? "not-allowed" : "pointer",
                  opacity: !agreeTerms || isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting
                  ? "Đang kiểm tra & giữ chỗ..."
                  : agreeTerms
                  ? "Xác nhận & Tiến hành thanh toán →"
                  : "Vui lòng đồng ý điều khoản"}
              </button>
            </div>
          </section>
        </div>

        {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
        <BookingSidebarSummary
          trainCode={trainParam}
          passengers={passengers}
          calculateSeatPrice={calculateSeatPrice}
          totalTicketPrice={totalTicketPrice}
          totalInsurance={totalInsurance}
          appliedDiscount={appliedDiscount}
          finalTotal={finalTotal}
          voucherCode={voucherCode}
          onVoucherCodeChange={setVoucherCode}
          onApplyVoucher={handleApplyVoucher}
          discountMessage={discountMessage}
        />
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <main className={styles.main}>
      {/* HEADER ĐỒNG BỘ */}
      <BookingHeader />

      {/* SUSPENSE BOUNDARY CHO SEARCH PARAMS */}
      <Suspense
        fallback={
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
            Đang tải thông tin đặt vé...
          </div>
        }
      >
        <BookingContent />
      </Suspense>
    </main>
  );
}
