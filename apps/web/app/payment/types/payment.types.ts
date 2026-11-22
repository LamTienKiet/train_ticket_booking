// apps/web/app/payment/types/payment.types.ts

export type PaymentStatus = "PENDING" | "SUCCESS";

export type PaymentMethodType = "VIETQR" | "VNPAY" | "VISA" | "STATION";

export interface TicketPassengerItem {
  ticketCode: string;
  passengerName: string;
  passengerTypeLabel: string;
  idCard: string;
  coachNumber: string;
  seatNumber: string;
  seatType: string;
  price: number;
}

export interface PaymentOrderInfo {
  bookingCode: string; // Mã đặt chỗ PNR
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
  tickets: TicketPassengerItem[];
}

