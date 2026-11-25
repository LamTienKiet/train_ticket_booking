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
import { api } from "../utils/axiosClient";
import { apiErrorMessage } from "../utils/apiError";
import { fmtDate, fmtDuration, fmtTime } from "../utils/format";
import { bookingSegment } from "../utils/bookingSegment";

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

  const { trip } = b;
    const seg = bookingSegment(b);

  return {
    id: b.id,
    bookingCode: b.bookingCode,
    status: b.status,
    bookedAt: new Date(b.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
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
    contactName: b.contactName || "Khách hàng",
    contactPhone: b.contactPhone || "",
    contactEmail: b.contactEmail || "",
    totalAmount: Number(b.totalAmount) || 0,
    tickets,
  };
}

export default function TicketPage() {
  // Vé của tôi (cần đăng nhập) và kết quả tra cứu PNR được giữ riêng
  const [myBookings, setMyBookings] = useState<BookingRecord[]>([]);
  const [lookupResults, setLookupResults] = useState<BookingRecord[]>([]);
  const [myError, setMyError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
    const loggedIn = Boolean(
      localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken"),
    );
    if (!loggedIn) return;
    // Token được axiosClient tự gắn
    api
      .get("/bookings/user/my")
      .then(({ data }) => setMyBookings(data.map(mapBackendBookingToRecord)))
      .catch((e) => setMyError(apiErrorMessage(e, "Không tải được vé của bạn.")));
  }, []);

  const bookings = viewMode === "QUICK_LOOKUP" ? lookupResults : myBookings;

  // Danh sách hiển thị tùy theo chế độ & bộ lọc
  const displayedBookings = useMemo(() => {
    if (viewMode === "QUICK_LOOKUP") {
      return hasSearchedLookup ? lookupResults : [];
    }

    if (activeTab === "ALL") return myBookings;
    return myBookings.filter((b) => b.status === activeTab);
  }, [viewMode, activeTab, myBookings, lookupResults, hasSearchedLookup]);

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);

    try {
      const { data } = await api.get("/bookings/public/lookup", {
        params: {
          bookingCode: bookingCodeQuery.trim().toUpperCase(),
          phone: contactQuery.trim(),
        },
      });
      setLookupResults([mapBackendBookingToRecord(data)]);
    } catch (err) {
      setLookupResults([]);
      setLookupError(apiErrorMessage(err, "Không tìm thấy đơn đặt vé."));
    } finally {
      setHasSearchedLookup(true);
    }
  };

  const handleResetLookup = () => {
    setBookingCodeQuery("");
    setContactQuery("");
    setHasSearchedLookup(false);
    setLookupError(null);
    setLookupResults([]);
  };

  const handleConfirmCancel = async (bookingId: string, reason: string) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;
    setActionError(null);
    try {
      // Khách tra cứu bằng PNR chứng minh quyền hủy bằng SĐT đã nhập; user đăng nhập dùng token
      await api.post(`/bookings/${encodeURIComponent(target.bookingCode)}/cancel`, {
        reason,
        phone: viewMode === "QUICK_LOOKUP" ? contactQuery.trim() : undefined,
      });

      const markCancelled = (list: BookingRecord[]) =>
        list.map((item) =>
          item.id === bookingId ? { ...item, status: "CANCELLED" as const } : item,
        );
      setMyBookings(markCancelled);
      setLookupResults(markCancelled);
    } catch (err) {
      setActionError(apiErrorMessage(err, "Hủy vé thất bại. Vui lòng thử lại."));
    } finally {
      setSelectedCancelBooking(null);
    }
  };

  const shownError = viewMode === "QUICK_LOOKUP" ? lookupError : myError;

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
          </div>
        )}

        {(actionError || shownError) && (
          <p role="alert" style={{ color: "#b91c1c", textAlign: "center", margin: "12px 0" }}>
            {actionError || shownError}
          </p>
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
                <Link href="/" className={styles.primaryBtn}>
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

