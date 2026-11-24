"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./page.module.css";
import { api } from "../utils/axiosClient";
import { apiErrorMessage } from "../utils/apiError";
import type { SeatMap } from "../trips/seats/SeatPage";

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
  const tripIdParam = searchParams.get("tripId") || "";
  const seatsParam = searchParams.get("seats") || "";
  // Chặng khách tìm (ga lên/xuống), truyền tiếp qua từng bước đặt vé
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const seg = from && to ? `&from=${from}&to=${to}` : "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [trip, setTrip] = useState<Omit<SeatMap, "coaches"> | null>(null);

  // State danh sách hành khách (mỗi hành khách = 1 ghế; id = UUID ghế)
  const [passengers, setPassengers] = useState<PassengerForm[]>([]);

  // Lấy giá & nhãn ghế thật từ sơ đồ ghế của chuyến (không tin giá trên URL)
  useEffect(() => {
    const seatIds = seatsParam.split(",").filter(Boolean);
    if (!tripIdParam || seatIds.length === 0) return;
    api
      .get<SeatMap>(`/trips/${tripIdParam}/seats`, { params: { from, to } })
      .then(({ data }) => {
        const found = data.coaches.flatMap((c) =>
          c.seats.filter((s) => seatIds.includes(s.id)).map((s) => ({ c, s })),
        );
        if (found.length !== seatIds.length) {
          setLoadError("Một số ghế không còn tồn tại trên chuyến này. Vui lòng chọn lại.");
          return;
        }
        setTrip(data);
        setPassengers(
          found.map(({ c, s }) => ({
            id: s.id,
            seatLabel: `Toa ${c.coachNumber} - Ghế ${s.seatNumber}`,
            coachNumber: String(c.coachNumber),
            seatNumber: s.seatNumber,
            seatType: c.coachName,
            basePrice: s.price,
            fullName: "",
            passengerType: "ADULT",
            idCard: "",
            hasInsurance: true,
          })),
        );
      })
      .catch((e) => setLoadError(apiErrorMessage(e, "Không tải được thông tin ghế.")));
  }, [tripIdParam, seatsParam, from, to]);

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

  // shortcut: backend chưa có API coupon nên không giảm giá ở client (tránh hiển thị sai số tiền thật); làm API coupon thì nối vào đây
  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedDiscount(0);
    setDiscountMessage("Chức năng mã giảm giá đang được phát triển.");
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

    // 2. Kiểm tra thông tin từng hành khách; mỗi CMND/CCCD chỉ được dùng cho một chỗ
    const seenIds = new Map<string, string>();
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.fullName.trim() || !p.idCard.trim()) {
        setApiError(
          `Vui lòng nhập Họ tên và CMND/CCCD cho hành khách tại ${p.seatLabel}.`
        );
        return;
      }
      const idKey = p.idCard.replace(/\s/g, "").toUpperCase();
      const firstSeat = seenIds.get(idKey);
      if (firstSeat) {
        setApiError(
          `CMND/CCCD của hành khách tại ${p.seatLabel} trùng với hành khách tại ${firstSeat}. Mỗi hành khách phải có giấy tờ riêng.`
        );
        return;
      }
      seenIds.set(idKey, p.seatLabel);
    }

    setIsSubmitting(true);
    try {
      const payload = {
        tripId: tripIdParam,
        originStationId: from,
        destinationStationId: to,
        contactName: contactInfo.fullName.trim(),
        contactPhone: contactInfo.phone.trim(),
        contactEmail: contactInfo.email.trim(),
        note: contactInfo.note?.trim() || undefined,
        passengers: passengers.map((p) => ({
          seatId: p.id,
          fullName: p.fullName.trim(),
          idNumber: p.idCard.trim(),
          passengerType: p.passengerType,
          hasInsurance: p.hasInsurance,
        })),
      };

      // Token (nếu đã đăng nhập) được axiosClient tự gắn
      const { data } = await api.post<{ bookingCode: string }>("/bookings", payload);

      // Khách vãng lai cần SĐT để xem đơn ở trang thanh toán; giữ trong tab, không đưa lên URL
      sessionStorage.setItem(`booking-phone:${data.bookingCode}`, payload.contactPhone);

      // Đặt chỗ thành công -> Chuyển sang màn hình thanh toán với Mã PNR thật từ database
      router.push(`/payment?pnr=${data.bookingCode}&method=${paymentMethod}`);
    } catch (err) {
      setApiError(apiErrorMessage(err, "Không thể tạo đơn đặt chỗ. Vui lòng thử lại."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tripIdParam || !seatsParam || loadError || passengers.length === 0) {
    return (
      <div role="status" className={styles.statusBox}>
        {!tripIdParam || !seatsParam
          ? "Chưa chọn chỗ ngồi."
          : loadError || "Đang tải thông tin ghế..."}{" "}
        {(!tripIdParam || !seatsParam || loadError) && (
          <Link href={tripIdParam ? `/trips/seats?tripId=${tripIdParam}${seg}` : "/"}>Chọn lại chỗ</Link>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 1. THANH TIẾN TRÌNH CÁC BƯỚC */}
      <BookingProgressBar />

      {/* 2. BANNER ĐẾM NGƯỢC GIỮ CHỖ */}
      <HoldSeatCountdown />

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
              <div role="alert" className={styles.errorBox}>
                <span aria-hidden>⚠️</span>
                <strong>{apiError}</strong>
              </div>
            )}

            <div className={styles.actionRow}>
              <Link
                href={`/trips/seats?tripId=${tripIdParam}${seg}`}
                className={styles.backBtn}
              >
                ← Quay lại chọn chỗ
              </Link>

              <button
                type="button"
                onClick={handleSubmitBooking}
                disabled={!agreeTerms || isSubmitting}
                className={styles.submitOrderBtn}
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
          trip={trip}
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
          <div role="status" className={styles.statusBox}>
            Đang tải thông tin đặt vé...
          </div>
        }
      >
        <BookingContent />
      </Suspense>
    </main>
  );
}
