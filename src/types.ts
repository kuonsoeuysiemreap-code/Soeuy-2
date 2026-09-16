export type ActiveTab = 'rooms' | 'invoices' | 'accounting' | 'settings';

export type RoomStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance' | 'out_of_service';

export type CleaningStatus = 'clean' | 'in_progress' | 'dirty' | 'inspected';

export type RoomType = 
  | 'Standard Room'
  | 'Deluxe Suite'
  | 'Presidential Suite';

export interface FutureReservation {
  id: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  arrivalTime?: string;
  departTime?: string;
  label?: string;
  rate?: number;
  guestsCount?: number;
  paymentMethod?: PaymentMethod;
  status?: 'reserved' | 'occupied';
  notes?: string;
  extraBed?: boolean;
  extraBedCount?: number;
  vipStatus?: boolean;
  isUserUpdated?: boolean;
}

export interface RoomHistoryEntry {
  id: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalAmount?: number;
  rate?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  status: 'checked_out' | 'cancelled' | 'no_show' | 'completed';
  notes?: string;
  folioNumber?: string;
  checkedOutAt?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  name?: string;
  floor: number;
  type: RoomType;
  pricePerNight: number;
  maxGuests: number;
  status: RoomStatus;
  cleaningStatus: CleaningStatus;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate?: string;
  checkOutDate?: string;
  checkInTime?: string;
  checkOutTime?: string;
  arrivalTime?: string;
  departTime?: string;
  futureReservations?: FutureReservation[];
  history?: RoomHistoryEntry[];
  amenities: string[];
  notes?: string;
  outOfServiceReason?: string;
  assignedHousekeeper?: string;
  bedType: string;
  sizeSqM: number;
  view: string;
  isUserUpdated?: boolean;
}

export type TransactionType = 'income' | 'expense' | 'refund';

export type TransactionCategory =
  | 'Room Booking'
  | 'Food & Beverage'
  | 'Spa & Wellness'
  | 'Housekeeping & Supplies'
  | 'Maintenance & Utilities'
  | 'Staff Payroll'
  | 'Marketing'
  | 'Taxes & Fees'
  | 'Airport Shuttle'
  | 'Reservation Cancellation'
  | 'Reservation Deletion';

export type PaymentMethod = 
  | 'Cash'
  | 'Visa Card'
  | 'Master Card'
  | 'Credit Card'
  | 'Bank Transfer'
  | 'Stripe'
  | 'Apple Pay'
  | 'ABA QR Pay'
  | 'ABA PayWay';

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';

export interface Transaction {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  guestOrVendor: string;
  roomNumber?: string;
  taxAmount?: number;
  notes?: string;
  receiptUrl?: string;
  actionType?: 'cancel' | 'delete';
  cancellationReason?: string;
  operatorName?: string;
}

export type StaffRole =
  | 'General Manager'
  | 'Front Desk Manager'
  | 'Chief Accountant'
  | 'Housekeeping Lead'
  | 'Night Auditor'
  | 'Receptionist';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: 'active' | 'on_break' | 'offline';
  shift: string;
  phone: string;
  joinedDate: string;
  avatarColor: string;
  accessLevel: 'Admin' | 'Manager' | 'Standard' | 'Restricted';
}

export type AccentColor = 'amber' | 'emerald' | 'cyan' | 'violet' | 'rose' | 'blue';

export interface Currency {
  name: string;
  code: string;
  symbol: string;
  rate: number;
}

export interface UserSettings {
  hotelName: string;
  tagline: string;
  managerName: string;
  managerEmail: string;
  phone: string;
  address: string;
  houseNumber?: string;
  streetAddress?: string;
  communeSangkat?: string;
  townKhan?: string;
  provinceCity?: string;
  vatNumber?: string;
  hotelLogoUrl?: string;
  exchangeRateKHR?: number;
  exchangeRateUSDToKHR?: number;
  currency: {
    symbol: string;
    code: string;
    rate: number;
  };
  taxRatePercent: number;
  serviceChargePercent: number;
  accentColor: AccentColor;
  density: 'compact' | 'comfortable' | 'spacious';
  soundEffects: boolean;
  defaultRoomView?: 'tape_chart' | 'grid' | 'list';
  twoFactorAuth: boolean;
  dailyAutoReports: boolean;
  vipAlerts: boolean;
  instantCleaningPing: boolean;
  checkInTime: string;
  checkOutTime: string;
  wifiSsid: string;
  wifiPassword: string;
}

export interface BookingFormData {
  roomNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  guestsCount: number;
  paymentMethod: PaymentMethod;
  bookingType?: 'reservation' | 'check_in';
  notes?: string;
  extraBed: boolean;
  extraBedCount: number;
  extraBedPrice: number;
  breakfastIncluded?: boolean;
  airportShuttle?: boolean;
  spaPackage?: boolean;
  discountPercent: number;
}
