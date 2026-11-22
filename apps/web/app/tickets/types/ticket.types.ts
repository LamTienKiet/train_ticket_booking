// apps/web/app/tickets/types/ticket.types.ts

export type BookingRecordStatus =
  | "CONFIRMED" // Sắp khởi hành (đã thanh toán)
  | "PENDING" // Chờ thanh toán
  | "COMPLETED" // Đã hoàn thành chuyến đi
  | "CANCELLED"; // Đã hủy vé

export type BookingFilterTab = "ALL" | BookingRecordStatus;

export type TicketViewMode = "MY_TICKETS" | "QUICK_LOOKUP";

export interface TicketPassengerDetail {
  ticketCode: string;
  passengerName: string;
  passengerTypeLabel: string;
  idCard: string;
  coachNumber: string;
  seatNumber: string;
  seatType: string;
  price: number;
}

export interface BookingRecord {
  id: string;
  bookingCode: string;
  status: BookingRecordStatus;
  bookedAt: string;
  trainCode: string;
  originStation: string;
  originCode: string;
  destinationStation: string;
  destinationCode: string;
  departureTime: string;
  departureDate: string;
  arrivalTime: string;
  arrivalDate: string;
  duration: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  totalAmount: number;
  tickets: TicketPassengerDetail[];
}

