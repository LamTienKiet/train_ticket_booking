"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import styles from "./page.module.css";

import {
  BookingFilterTab,
  BookingRecord,
  TicketPassengerDetail,
  TicketViewMode,
} from "./types/ticket.types";
import { MOCK_BOOKING_RECORDS } from "./mock-tickets";

import TicketHeader from "./components/TicketHeader";
import TicketLookupForm from "./components/TicketLookupForm";
import TicketStatusTabs from "./components/TicketStatusTabs";
import TicketBookingCard from "./components/TicketBookingCard";
import TicketDetailModal from "./components/TicketDetailModal";
import CancelTicketModal from "./components/CancelTicketModal";

function mapBackendBookingToRecord(b: any): BookingRecord {
  const tickets: TicketPassengerDetail[] = [];
  const passList = b.passengers || [];

  for (const p of passList) {
    const bsList = p.bookingSeats || [];
    for (const bs of bsList) {
      const coachNum = bs.seat?.coach?.coachNumber ?? "1";
      const seatNum = bs.seat?.seatNumber ?? "01";
      const ticketNumber =
        bs.ticketIssue?.ticketNumber ||
        `VE-${b.bookingCode}-${coachNum}${seatNum}`;

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

  const dep = b.trip?.departureTime ? new Date(b.trip.departureTime) : null;
  const arr = b.trip?.arrivalTime ? new Date(b.trip.arrivalTime) : null;
  const booked = b.createdAt ? new Date(b.createdAt) : new Date();

  return {
    id: b.id,
    bookingCode: b.bookingCode,
    status: b.status as any,
    bookedAt: booked.toLocaleString("vi-VN"),
    trainCode: b.trip?.train?.code || "SE1",
    originStation: b.trip?.route?.originStation?.name || "Hà Nội",
    originCode: b.trip?.route?.originStation?.code || "HAN",
    destinationStation: b.trip?.route?.destinationStation?.name || "Sài Gòn",
    destinationCode: b.trip?.route?.destinationStation?.code || "SGN",
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
    contactName: b.contactName || "Khách hàng",
    contactPhone: b.contactPhone || "",
    contactEmail: b.contactEmail || "",
    totalAmount: Number(b.totalAmount) || 0,
    tickets,
  };
}

export default function TicketPage() {
  // Danh sách đơn vé: load từ API nếu có, fallback sang mock
  const [bookings, setBookings] = useState<BookingRecord[]>(
    MOCK_BOOKING_RECORDS
  );

  // Chế độ hiển thị: Vé của tôi vs Tra cứu theo mã PNR
  const [viewMode, setViewMode] = useState<TicketViewMode>("MY_TICKETS");
  const [activeTab, setActiveTab] = useState<BookingFilterTab>("ALL");

  // Input tra cứu nhanh
  const [bookingCodeQuery, setBookingCodeQuery] = useState("");
  const [contactQuery, setContactQuery] = useState("");
  const [hasSearchedLookup, setHasSearchedLookup] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Modal state
  const [selectedDetailBooking, setSelectedDetailBooking] =
    useState<BookingRecord | null>(null);
  const [selectedCancelBooking, setSelectedCancelBooking] =
    useState<BookingRecord | null>(null);

  // Tự động tải danh sách vé cá nhân nếu người dùng đã đăng nhập
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || localStorage.getItem("access_token")
        : null;

    if (!token) return;

    const fetchMyBookings = async () => {
      try {
        const res = await fetch("http://localhost:3001/bookings/user/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setBookings(data.map(mapBackendBookingToRecord));
          }
        }
      } catch (e) {
        console.error("Lỗi khi tải vé cá nhân:", e);
      }
    };

    fetchMyBookings();
  }, []);

  // Danh sách hiển thị tùy theo chế độ & bộ lọc
  const displayedBookings = useMemo(() => {
    if (viewMode === "QUICK_LOOKUP") {
      if (!hasSearchedLookup) return [];
      return bookings;
    }

    if (activeTab === "ALL") return bookings;
    return bookings.filter((b) => b.status === activeTab);
  }, [viewMode, activeTab, bookings, hasSearchedLookup]);

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setHasSearchedLookup(true);

    const code = bookingCodeQuery.trim().toUpperCase();
    const contact = contactQuery.trim();

    try {
      const res = await fetch(
        `http://localhost:3001/bookings/public/lookup?bookingCode=${encodeURIComponent(
          code
        )}&phone=${encodeURIComponent(contact)}`
      );

      if (res.ok) {
        const data = await res.json();
        setBookings([mapBackendBookingToRecord(data)]);
      } else {
        // Fallback thử tìm trong mock bookings nếu API không có
        const matched = MOCK_BOOKING_RECORDS.filter((b) => {
          const matchCode = !code || b.bookingCode.toUpperCase() === code;
          const matchContact =
            !contact ||
            b.contactPhone.toLowerCase().includes(contact.toLowerCase()) ||
            b.contactEmail.toLowerCase().includes(contact.toLowerCase());
          return matchCode && matchContact;
        });
        setBookings(matched);
      }
    } catch {
      // Fallback khi offline
      const matched = MOCK_BOOKING_RECORDS.filter(
        (b) => b.bookingCode.toUpperCase() === code
      );
      setBookings(matched);
    }
  };

  const handleResetLookup = () => {
    setBookingCodeQuery("");
    setContactQuery("");
    setHasSearchedLookup(false);
    setLookupError(null);
    setBookings(MOCK_BOOKING_RECORDS);
  };

  const handleConfirmCancel = async (bookingId: string, reason: string) => {
    try {
      const target = bookings.find((b) => b.id === bookingId);
      const code = target?.bookingCode || bookingId;

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || localStorage.getItem("access_token")
          : null;

      await fetch(`http://localhost:3001/bookings/${code}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason }),
      });

      // Cập nhật ngay trên giao diện
      setBookings((prev) =>
        prev.map((item) =>
          item.id === bookingId || item.bookingCode === code
            ? { ...item, status: "CANCELLED" }
            : item
        )
      );
    } catch (e) {
      console.error("Lỗi khi hủy vé:", e);
    } finally {
      setSelectedCancelBooking(null);
    }
  };

  return (
    <main className={styles.main}>
      {/* HEADER ĐỒNG BỘ */}
      <TicketHeader />

      <div className={styles.container}>
        {/* KHUNG TIÊU ĐỀ + CHUYỂN CHẾ ĐỘ + FORM TRA CỨU */}
        <TicketLookupForm
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            setViewMode(mode);
            setHasSearchedLookup(false);
          }}
          bookingCodeQuery={bookingCodeQuery}
          onBookingCodeQueryChange={setBookingCodeQuery}
          contactQuery={contactQuery}
          onContactQueryChange={setContactQuery}
          onSubmitLookup={handleLookupSubmit}
          onResetLookup={handleResetLookup}
        />

        {/* THANH TAB TRẠNG THÁI (HIỂN THỊ Ở CHẾ ĐỘ VÉ CỦA TÔI) */}
        {viewMode === "MY_TICKETS" && (
          <TicketStatusTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            records={bookings}
          />
        )}

        {/* GỢI Ý MÃ MẪU KHI Ở CHẾ ĐỘ TRA CỨU NHANH CHƯA BẤM TÌM */}
        {viewMode === "QUICK_LOOKUP" && !hasSearchedLookup && (
          <div className={styles.lookupHelperBox}>
            <h3>Hướng dẫn tra cứu nhanh</h3>
            <p>
              Nhập <strong>Mã đặt chỗ (PNR)</strong> và{" "}
              <strong>Số điện thoại / Email</strong> đã dùng khi đặt vé để kiểm
              tra vé điện tử mà không cần đăng nhập.
            </p>
            <div className={styles.sampleHintChip}>
              Mã mẫu dùng thử: <strong>LR-849201</strong> • SĐT:{" "}
              <strong>0912345678</strong>
            </div>
          </div>
        )}

        {/* DANH SÁCH ĐƠN VÉ */}
        {(viewMode === "MY_TICKETS" || hasSearchedLookup) && (
          <div className={styles.ticketsListContainer}>
            {displayedBookings.length === 0 ? (
              <div className={styles.emptyStateBox}>
                <div className={styles.emptyIcon}>
                  <svg
                    width="38"
                    height="38"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
                    <path d="M13 5v2"></path>
                    <path d="M13 17v2"></path>
                    <path d="M13 11v2"></path>
                  </svg>
                </div>
                <h3>Không tìm thấy vé phù hợp</h3>
                <p>
                  {viewMode === "QUICK_LOOKUP"
                    ? "Vui lòng kiểm tra lại Mã đặt chỗ (PNR) hoặc Số điện thoại / Email đã nhập."
                    : "Hiện bạn chưa có đơn đặt vé nào thuộc trạng thái này."}
                </p>
                <Link href="/trips" className={styles.primaryBtn}>
                  Tìm & Đặt vé mới ngay
                </Link>
              </div>
            ) : (
              displayedBookings.map((booking) => (
                <TicketBookingCard
                  key={booking.id}
                  booking={booking}
                  onViewDetail={setSelectedDetailBooking}
                  onRequestCancel={setSelectedCancelBooking}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* MODAL XEM CHI TIẾT VÉ & MÃ QR */}
      <TicketDetailModal
        booking={selectedDetailBooking}
        onClose={() => setSelectedDetailBooking(null)}
      />

      {/* MODAL XÁC NHẬN HỦY VÉ */}
      <CancelTicketModal
        booking={selectedCancelBooking}
        onClose={() => setSelectedCancelBooking(null)}
        onConfirmCancel={(id, reason) => handleConfirmCancel(id, reason)}
      />
    </main>
  );
}

