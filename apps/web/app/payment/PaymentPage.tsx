"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";

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
  const trainParam = searchParams.get("train") || "SE1";
  const seatsParam = searchParams.get("seats") || "1-02,1-06";
  const methodParam = (searchParams.get("method") || "VIETQR") as PaymentMethodType;
  const totalParam = Number(searchParams.get("total")) || 0;
  const initialStatus =
    searchParams.get("status") === "success" ? "SUCCESS" : "PENDING";

  // State điều phối 2 màn hình: Chờ thanh toán (PENDING) & Thành công + Vé QR (SUCCESS)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialStatus);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodType>(methodParam);

  // State lưu dữ liệu đơn hàng lấy từ API Backend
  const [realBooking, setRealBooking] = useState<any>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Lấy dữ liệu đơn đặt chỗ từ Backend nếu có PNR
  useEffect(() => {
    if (!pnrParam) return;
    const fetchBooking = async () => {
      try {
        const res = await fetch(`http://localhost:3001/bookings/${pnrParam}`);
        if (res.ok) {
          const data = await res.json();
          setRealBooking(data);
          if (data.status === "CONFIRMED") {
            setPaymentStatus("SUCCESS");
          }
        }
      } catch (e) {
        console.error("Lỗi khi tải thông tin đơn đặt vé:", e);
      }
    };
    fetchBooking();
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
    if (!pnrParam) {
      setPaymentStatus("SUCCESS");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    setIsConfirming(true);
    setConfirmError(null);
    try {
      const res = await fetch("http://localhost:3001/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingCode: pnrParam,
          paymentMethod: paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Xác nhận thanh toán thất bại.");
      }

      setRealBooking(data);
      setPaymentStatus("SUCCESS");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: any) {
      setConfirmError(err.message || "Lỗi khi xử lý thanh toán.");
    } finally {
      setIsConfirming(false);
    }
  };

  // Tạo dữ liệu đơn đặt vé: ưu tiên dữ liệu từ DB, fallback sang mock
  const orderInfo: PaymentOrderInfo = useMemo(() => {
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

      const dep = realBooking.trip?.departureTime
        ? new Date(realBooking.trip.departureTime)
        : null;
      const arr = realBooking.trip?.arrivalTime
        ? new Date(realBooking.trip.arrivalTime)
        : null;

      return {
        bookingCode: realBooking.bookingCode,
        trainCode: realBooking.trip?.train?.code || trainParam,
        originStation: realBooking.trip?.route?.originStation?.name || "Hà Nội",
        originCode: realBooking.trip?.route?.originStation?.code || "HAN",
        destinationStation:
          realBooking.trip?.route?.destinationStation?.name || "Sài Gòn",
        destinationCode:
          realBooking.trip?.route?.destinationStation?.code || "SGN",
        departureTime: dep
          ? dep.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "06:00",
        departureDate: dep ? dep.toLocaleDateString("vi-VN") : "15/01/2026",
        arrivalTime: arr
          ? arr.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "19:30",
        arrivalDate: arr ? arr.toLocaleDateString("vi-VN") : "16/01/2026",
        duration: "31 giờ 30 phút",
        contactName: realBooking.contactName || "Khách hàng",
        contactPhone: realBooking.contactPhone || "",
        contactEmail: realBooking.contactEmail || "",
        totalAmount: Number(realBooking.totalAmount) || 0,
        tickets,
      };
    }

    // Dữ liệu mẫu ban đầu nếu chưa có PNR
    const seatList = seatsParam.split(",").filter(Boolean);
    const tickets: TicketPassengerItem[] = (
      seatList.length > 0 ? seatList : ["1-02", "1-06"]
    ).map((item, idx) => {
      const [coach = "1", seat = `0${idx + 1}`] = item.split("-");
      const isCoachOne = coach === "1";
      return {
        ticketCode: `VE-849201-0${idx + 1}`,
        passengerName: idx === 0 ? "NGUYEN VAN AN" : "TRAN THI BINH",
        passengerTypeLabel: "Người lớn",
        idCard: idx === 0 ? "001098001234" : "001199005678",
        coachNumber: coach,
        seatNumber: seat,
        seatType: isCoachOne ? "Ngồi mềm điều hòa" : "Khoang 4 nằm mềm",
        price: isCoachOne ? 850000 : 1250000,
      };
    });

    const computedTotal =
      totalParam > 0
        ? totalParam
        : tickets.reduce((sum, t) => sum + t.price, 0);

    return {
      bookingCode: "LR-849201",
      trainCode: trainParam,
      originStation: "Hà Nội",
      originCode: "HAN",
      destinationStation: "Sài Gòn",
      destinationCode: "SGO",
      departureTime: "06:00",
      departureDate: "15/01/2026",
      arrivalTime: "19:30",
      arrivalDate: "16/01/2026",
      duration: "37 giờ 30 phút",
      contactName: "Nguyễn Văn An",
      contactPhone: "0912 345 678",
      contactEmail: "nguyenvanan@email.com",
      totalAmount: computedTotal,
      tickets,
    };
  }, [realBooking, trainParam, seatsParam, totalParam]);

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

