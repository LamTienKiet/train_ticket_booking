"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { api } from "../utils/axiosClient";
import { apiErrorMessage } from "../utils/apiError";
import { fmtDate, fmtDuration, fmtTime } from "../utils/format";
import { bookingSegment } from "../utils/bookingSegment";

import {
  PaymentMethodType,
  PaymentOrderInfo,
  PaymentStatus,
  TicketPassengerItem,
} from "./types/payment.types";

import PaymentHeader from "./components/PaymentHeader";
import PaymentProgressBar from "./components/PaymentProgressBar";
import PaymentGatewayCard from "./components/PaymentGatewayCard";
import PaymentOrderSummary from "./components/PaymentOrderSummary";
import BookingSuccessBanner from "./components/BookingSuccessBanner";
import ElectronicTicketList from "./components/ElectronicTicketList";

function PaymentContent() {
  const searchParams = useSearchParams();
  const pnrParam = searchParams.get("pnr");
  const methodParam = (searchParams.get("method") || "VIETQR") as PaymentMethodType;

  // State điều phối 2 màn hình: Chờ thanh toán (PENDING) & Thành công + Vé QR (SUCCESS)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PENDING");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodType>(methodParam);

  // State lưu dữ liệu đơn hàng lấy từ API Backend
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- response Prisma lồng nhiều cấp
  const [realBooking, setRealBooking] = useState<any>(null);
  const [loadError, setLoadError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Lấy dữ liệu đơn đặt chỗ từ Backend
  useEffect(() => {
    if (!pnrParam) return;
    // Khách vãng lai chứng minh quyền xem đơn bằng SĐT lưu lúc đặt; user đăng nhập dùng token
    const phone = sessionStorage.getItem(`booking-phone:${pnrParam}`) ?? undefined;
    api
      .get(`/bookings/${encodeURIComponent(pnrParam)}`, { params: { phone } })
      .then(({ data }) => {
        setRealBooking(data);
        if (data.status === "CONFIRMED") setPaymentStatus("SUCCESS");
      })
      .catch((e) => setLoadError(apiErrorMessage(e, "Không tải được đơn đặt vé.")));
  }, [pnrParam]);

  // Bộ đếm thời gian giữ chỗ thực tế
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(600);

  useEffect(() => {
    if (!realBooking?.expiresAt) return;
    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(realBooking.expiresAt).getTime() - Date.now()) / 1000)
      );
      setTimeLeftSeconds(remaining);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [realBooking?.expiresAt]);

  const formattedCountdown = useMemo(() => {
    const mins = Math.floor(timeLeftSeconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (timeLeftSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }, [timeLeftSeconds]);

  // Xử lý xác nhận thanh toán gọi Backend API
  const handleConfirmPayment = async () => {
    if (!pnrParam) return;

    setIsConfirming(true);
    setConfirmError(null);
    try {
      const { data } = await api.post("/payments/confirm", {
        bookingCode: pnrParam,
        paymentMethod,
        phone: sessionStorage.getItem(`booking-phone:${pnrParam}`) ?? undefined,
      });

      setRealBooking(data);
      setPaymentStatus("SUCCESS");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setConfirmError(apiErrorMessage(err, "Xác nhận thanh toán thất bại."));
    } finally {
      setIsConfirming(false);
    }
  };

  // Dữ liệu đơn đặt vé từ DB (null khi chưa tải xong)
  const orderInfo: PaymentOrderInfo | null = useMemo(() => {
    if (realBooking) {
      const tickets: TicketPassengerItem[] = [];
      const passList = realBooking.passengers || [];

      for (const p of passList) {
        const bsList = p.bookingSeats || [];
        for (const bs of bsList) {
          const coachNum = bs.seat?.coach?.coachNumber ?? "1";
          const seatNum = bs.seat?.seatNumber ?? "01";
          const ticketNumber =
            bs.ticketIssue?.ticketNumber ||
            `VE-${realBooking.bookingCode}-${coachNum}${seatNum}`;

          let passTypeLabel = "Người lớn";
          if (p.passengerType === "CHILD") passTypeLabel = "Trẻ em";
          else if (p.passengerType === "STUDENT") passTypeLabel = "Sinh viên";
          else if (p.passengerType === "SENIOR") passTypeLabel = "Người cao tuổi";

          tickets.push({
            ticketCode: ticketNumber,
            passengerName: p.fullName,
            passengerTypeLabel: passTypeLabel,
            idCard: p.idNumber,
            coachNumber: String(coachNum),
            seatNumber: seatNum,
            seatType: bs.seat?.seatType?.name || "Ngồi mềm điều hòa",
            price: Number(bs.price) || 0,
          });
        }
      }

      const { trip } = realBooking;
    const seg = bookingSegment(realBooking);

      return {
        bookingCode: realBooking.bookingCode,
        trainCode: trip.train.code,
        originStation: seg.origin.name,
        originCode: seg.origin.code,
        destinationStation: seg.destination.name,
        destinationCode: seg.destination.code,
        departureTime: fmtTime(seg.departureTime),
        departureDate: fmtDate(seg.departureTime),
        arrivalTime: fmtTime(seg.arrivalTime),
        arrivalDate: fmtDate(seg.arrivalTime),
        duration: fmtDuration(seg.departureTime, seg.arrivalTime),
        contactName: realBooking.contactName || "Khách hàng",
        contactPhone: realBooking.contactPhone || "",
        contactEmail: realBooking.contactEmail || "",
        totalAmount: Number(realBooking.totalAmount) || 0,
        tickets,
      };
    }

    return null;
  }, [realBooking]);

  if (!pnrParam || loadError || !orderInfo) {
    return (
      <div role="status" style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
        {!pnrParam ? "Không có mã đặt chỗ." : loadError || "Đang tải đơn đặt vé..."}{" "}
        {(!pnrParam || loadError) && <Link href="/tickets">Tra cứu vé</Link>}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 1. THANH TIẾN TRÌNH */}
      <PaymentProgressBar status={paymentStatus} />

      {/* 2. HIỂN THỊ THEO TRẠNG THÁI THANH TOÁN */}
      {paymentStatus === "PENDING" ? (
        <>
          {/* Banner đếm ngược giữ chỗ */}
          <div className={styles.holdSeatBanner}>
            <div className={styles.bannerIcon}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#b45309"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className={styles.bannerContent}>
              <strong>Đang giữ chỗ chờ thanh toán: </strong>
              <span>
                Vui lòng hoàn tất thanh toán trong{" "}
                <span className={styles.countdownHighlight}>
                  {formattedCountdown}
                </span>{" "}
                phút để hệ thống tự động xuất vé điện tử.
              </span>
            </div>
          </div>

          {/* Grid 2 cột: Cổng thanh toán bên trái + Tóm tắt đơn bên phải */}
          <div className={styles.paymentGrid}>
            <div className={styles.leftCol}>
              <PaymentGatewayCard
                order={orderInfo}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                onConfirmPayment={handleConfirmPayment}
                isConfirming={isConfirming}
                confirmError={confirmError}
              />
            </div>

            <PaymentOrderSummary order={orderInfo} />
          </div>
        </>
      ) : (
        /* MÀN HÌNH ĐẶT VÉ THÀNH CÔNG & THẺ VÉ ĐIỆN TỬ QR */
        <div className={styles.successWrapper}>
          <BookingSuccessBanner
            order={orderInfo}
            onBackToPaymentPreview={() => setPaymentStatus("PENDING")}
          />

          <ElectronicTicketList order={orderInfo} />
        </div>
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <main className={styles.main}>
      <PaymentHeader />

      <Suspense
        fallback={
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
            Đang tải cổng thanh toán...
          </div>
        }
      >
        <PaymentContent />
      </Suspense>
    </main>
  );
}

