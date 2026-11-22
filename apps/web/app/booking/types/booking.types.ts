// apps/web/app/booking/types/booking.types.ts

export type PassengerType = "ADULT" | "CHILD" | "STUDENT" | "SENIOR";

export interface PassengerForm {
  id: string;
  seatLabel: string;
  coachNumber: string;
  seatNumber: string;
  seatType: string;
  basePrice: number;
  fullName: string;
  passengerType: PassengerType;
  idCard: string;
  birthDate?: string;
  hasInsurance: boolean;
}

export interface ContactInfo {
  fullName: string;
  phone: string;
  email: string;
  note?: string;
}

export interface InvoiceInfo {
  companyName: string;
  taxCode: string;
  companyAddress: string;
}

export type PaymentMethodType = "VIETQR" | "VNPAY" | "VISA" | "STATION";

