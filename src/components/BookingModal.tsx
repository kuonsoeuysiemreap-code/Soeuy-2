import React, { useState, useEffect } from 'react';
import { 
  X, 
  DoorOpen, 
  CalendarDays,
  User, 
  Sparkles, 
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Bed,
  Lock,
  Unlock,
  Edit3,
  Clock
} from 'lucide-react';
import { Room, BookingFormData, PaymentMethod, UserSettings } from '../types';
import { formatCurrency, getAccentClasses } from '../utils/helpers';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoom: Room | null;
  availableRooms: Room[];
  allRooms?: Room[];
  settings: UserSettings;
  businessDate?: string;
  defaultCheckInDate?: string;
  isAdminUser?: boolean;
  onSubmitBooking: (roomNumber: string, bookingData: BookingFormData, totalAmount: number) => void;
  onOpenAmendReservation?: (room?: Room | null, initialGuestName?: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedRoom,
  availableRooms,
  allRooms = [],
  settings,
  businessDate = '2026-08-29',
  defaultCheckInDate,
  isAdminUser = true,
  onSubmitBooking,
  onOpenAmendReservation,
}) => {
  const accent = getAccentClasses(settings.accentColor);
  const roomsList = allRooms.length > 0 ? allRooms : availableRooms;
  const initialRoomNumber = selectedRoom ? selectedRoom.roomNumber : (availableRooms[0]?.roomNumber || roomsList[0]?.roomNumber || '101');
  
  const initialCheckIn = defaultCheckInDate
    ? (businessDate && defaultCheckInDate < businessDate ? businessDate : defaultCheckInDate)
    : (businessDate || new Date().toISOString().split('T')[0]);

  const [roomNumber, setRoomNumber] = useState<string>(initialRoomNumber);
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>(initialCheckIn);
  const [checkInTime, setCheckInTime] = useState<string>(settings?.checkInTime || '14:00');
  const [checkOutDate, setCheckOutDate] = useState<string>(
    new Date(new Date(initialCheckIn).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [checkOutTime, setCheckOutTime] = useState<string>(settings?.checkOutTime || '12:00');
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [notes, setNotes] = useState<string>('');
  
  // Extra Bed configuration & Admin permissions
  const [extraBed, setExtraBed] = useState<boolean>(false);
  const [extraBedCount, setExtraBedCount] = useState<number>(1);
  const [extraBedPrice, setExtraBedPrice] = useState<number>(45);
  const [isAdmin, setIsAdmin] = useState<boolean>(isAdminUser);
  const [discountPercent] = useState<number>(0);
  const [cleanError, setCleanError] = useState<string | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [bookingType, setBookingType] = useState<'reservation' | 'check_in'>('reservation');

  useEffect(() => {
    if (isOpen) {
      if (selectedRoom) {
        setRoomNumber(selectedRoom.roomNumber);
        if (selectedRoom.status === 'reserved' && selectedRoom.guestName) {
          setGuestName(selectedRoom.guestName);
          setGuestEmail(selectedRoom.guestEmail || '');
          setGuestPhone(selectedRoom.guestPhone || '');
          if (selectedRoom.checkInDate) setCheckInDate(selectedRoom.checkInDate);
          if (selectedRoom.checkOutDate) setCheckOutDate(selectedRoom.checkOutDate);
          if (selectedRoom.checkInTime) setCheckInTime(selectedRoom.checkInTime);
          if (selectedRoom.checkOutTime) setCheckOutTime(selectedRoom.checkOutTime);
          setNotes(selectedRoom.notes || '');
          setBookingType('check_in'); // checking in the waiting reserved guest
        } else {
          // Open for fresh booking: keep fields empty
          setGuestName('');
          setGuestEmail('');
          setGuestPhone('');
          setNotes('');
        }
      } else if (availableRooms.length > 0 && !availableRooms.some(r => r.roomNumber === roomNumber)) {
        setRoomNumber(availableRooms[0].roomNumber);
        setGuestName('');
        setGuestEmail('');
        setGuestPhone('');
        setNotes('');
      } else if (!selectedRoom) {
        setGuestName('');
        setGuestEmail('');
        setGuestPhone('');
        setNotes('');
      }
      if (defaultCheckInDate) {
        const safeCheckIn = (businessDate && defaultCheckInDate < businessDate) ? businessDate : defaultCheckInDate;
        setCheckInDate(safeCheckIn);
        const nextDate = new Date(new Date(safeCheckIn).getTime() + 3 * 24 * 60 * 60 * 1000);
        setCheckOutDate(nextDate.toISOString().split('T')[0]);
      } else if (businessDate) {
        setCheckInDate(businessDate);
        const nextDate = new Date(new Date(businessDate).getTime() + 3 * 24 * 60 * 60 * 1000);
        setCheckOutDate(nextDate.toISOString().split('T')[0]);
      }
    }
  }, [isOpen, selectedRoom, availableRooms, defaultCheckInDate, roomNumber, businessDate]);

  if (!isOpen) return null;

  // Helper: check date overlap between 2 ranges
  const checkOverlap = (in1: string, out1: string, in2: string, out2: string) => {
    return in1 < out2 && out1 > in2;
  };

  // Helper: check if a room has any current or next booking conflict
  const getRoomConflict = (r: Room, checkIn: string, checkOut: string) => {
    if (r.checkInDate && r.checkOutDate && (r.status === 'occupied' || r.status === 'reserved')) {
      if (checkOverlap(checkIn, checkOut, r.checkInDate, r.checkOutDate)) {
        return {
          roomNumber: r.roomNumber,
          type: r.type,
          guestName: r.guestName || 'In-House Guest',
          checkInDate: r.checkInDate,
          checkOutDate: r.checkOutDate,
          isNextBooking: false,
          status: r.status,
        };
      }
    }
    if (r.futureReservations && r.futureReservations.length > 0) {
      const fut = r.futureReservations.find(f => checkOverlap(checkIn, checkOut, f.checkInDate, f.checkOutDate));
      if (fut) {
        return {
          roomNumber: r.roomNumber,
          type: r.type,
          guestName: fut.guestName,
          checkInDate: fut.checkInDate,
          checkOutDate: fut.checkOutDate,
          isNextBooking: true,
          status: fut.status || 'reserved',
        };
      }
    }
    return null;
  };

  const isRoomFreeForPeriod = (r: Room, checkIn: string, checkOut: string) => {
    if (r.status === 'out_of_service' || r.status === 'maintenance') return false;
    return getRoomConflict(r, checkIn, checkOut) === null;
  };

  const activeRoom = roomsList.find((r) => r.roomNumber === roomNumber) || selectedRoom;
  const pricePerNight = activeRoom ? activeRoom.pricePerNight : 200;

  const targetConflict = activeRoom ? getRoomConflict(activeRoom, checkInDate, checkOutDate) : null;

  const sameTypeRooms = roomsList.filter(r => activeRoom && r.type === activeRoom.type);
  const availableSameTypeRooms = sameTypeRooms.filter(r => 
    r.roomNumber !== roomNumber && isRoomFreeForPeriod(r, checkInDate, checkOutDate)
  );

  const allAvailableRooms = roomsList.filter(r => 
    r.roomNumber !== roomNumber && isRoomFreeForPeriod(r, checkInDate, checkOutDate)
  );

  const uniqueRoomTypes = Array.from(new Set(roomsList.map(r => r.type)));
  const roomTypeStats = uniqueRoomTypes.map(type => {
    const totalOfType = roomsList.filter(r => r.type === type);
    const availableOfType = totalOfType.filter(r => isRoomFreeForPeriod(r, checkInDate, checkOutDate));
    return {
      type,
      total: totalOfType.length,
      available: availableOfType.length,
      isFullyBooked: availableOfType.length === 0,
    };
  });

  const filteredRooms = selectedTypeFilter === 'all' 
    ? roomsList 
    : roomsList.filter(r => r.type === selectedTypeFilter);

  const d1 = new Date(checkInDate);
  const d2 = new Date(checkOutDate);
  const diffTime = Math.max(1000 * 60 * 60 * 24, d2.getTime() - d1.getTime());
  const nightsCount = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

  const baseRoomTotal = pricePerNight * nightsCount;
  const extraBedTotal = extraBed ? extraBedPrice * extraBedCount * nightsCount : 0;
  const subtotal = baseRoomTotal + extraBedTotal;
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableTotal = subtotal - discountAmount;
  // Room and Tax VAT 10% only
  const vatRatePercent = 10;
  const taxAmount = (taxableTotal * vatRatePercent) / 100;
  const grandTotal = taxableTotal + taxAmount;

  const isBeforeBusinessDate = Boolean(businessDate && checkInDate < businessDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    if (businessDate && checkInDate < businessDate) {
      setCleanError(`Policy Restriction: Cannot add reservations before the current hotel business date (${businessDate}). Please choose ${businessDate} or a future date.`);
      return;
    }

    const isFutureCheckIn = checkInDate > businessDate;
    const isReservation = bookingType === 'reservation' || isFutureCheckIn;

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      setCleanError("Rule Violation: Check-out date must be strictly after the check-in date.");
      return;
    }

    if (targetConflict) {
      setCleanError(`Rule Violation - Cannot Accept Booking: Room #${targetConflict.roomNumber} (${targetConflict.type}) has ${targetConflict.isNextBooking ? 'an upcoming next booking reserved for' : 'an active stay by'} ${targetConflict.guestName} (${targetConflict.checkInDate} to ${targetConflict.checkOutDate}). Policy strictly prohibits accepting reservations on booked dates. Please change to an available room.`);
      return;
    }

    if (!isReservation && checkInDate <= businessDate) {
      const isDirtyOrInProgress = activeRoom && (
        activeRoom.status === 'cleaning' ||
        activeRoom.status === 'maintenance' ||
        activeRoom.status === 'out_of_service' ||
        activeRoom.cleaningStatus === 'dirty' ||
        activeRoom.cleaningStatus === 'in_progress'
      );
      if (isDirtyOrInProgress) {
        setCleanError(`Direct Check-In Rule: Room #${roomNumber} is currently ${activeRoom.status === 'out_of_service' ? 'Out of Service' : activeRoom.status === 'maintenance' ? 'under Maintenance' : 'Not Clean'}. For immediate guest check-in, please mark clean first or switch booking mode to "Room Reserve Booking (Not Yet Checking In)".`);
        return;
      }
    }

    setCleanError(null);

    const bookingData: BookingFormData = {
      roomNumber,
      guestName,
      guestEmail,
      guestPhone,
      checkInDate,
      checkOutDate,
      checkInTime,
      checkOutTime,
      guestsCount,
      paymentMethod,
      bookingType: isReservation ? 'reservation' : 'check_in',
      notes,
      extraBed,
      extraBedCount,
      extraBedPrice,
      discountPercent,
    };

    onSubmitBooking(roomNumber, bookingData, grandTotal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-950/80 p-4 backdrop-blur-md animate-in fade-in">
      <div 
        className="relative w-full max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/50">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-700/60 ${accent.glow}`}>
              <DoorOpen className={`h-5 w-5 ${accent.text}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Guest Check-In & Room Reservation
              </h3>
              <p className="text-xs text-neutral-400">
                Generate guest folio, assign suite, and process check-in
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Booking Mode Selector */}
          <div className="p-3.5 rounded-2xl border border-neutral-800 bg-neutral-950/70 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-amber-400" />
                <span>Booking Mode</span>
              </label>
              <span className={`text-[11px] font-semibold ${
                bookingType === 'reservation' ? 'text-purple-300' : 'text-blue-300'
              }`}>
                {bookingType === 'reservation' ? 'Expected Guest (Reserved)' : `Direct In-House (${businessDate})`}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-mode-reserve"
                onClick={() => {
                  setBookingType('reservation');
                  setCleanError(null);
                  if (onOpenAmendReservation) {
                    const currentRoom = roomsList.find(r => r.roomNumber === roomNumber) || selectedRoom;
                    onOpenAmendReservation(currentRoom, guestName);
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  bookingType === 'reservation'
                    ? 'border-purple-500/80 bg-purple-950/40 text-purple-100 shadow-md ring-1 ring-purple-500/40'
                    : 'border-neutral-800/80 bg-transparent text-neutral-500 hover:border-neutral-700 hover:text-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <CalendarDays className={`h-4 w-4 ${bookingType === 'reservation' ? 'text-purple-400' : 'text-neutral-500'}`} />
                    <span className={bookingType === 'reservation' ? 'text-white' : 'text-neutral-400'}>Room Reserve Booking</span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    bookingType === 'reservation'
                      ? 'bg-purple-900/80 border border-purple-500/60 text-purple-200'
                      : 'border border-neutral-800 text-neutral-500'
                  }`}>
                    Waiting Guest
                  </span>
                </div>
                <p className={`text-[11px] leading-snug ${bookingType === 'reservation' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  Reserves for coming guest. No automatic check-in on business date.
                </p>
              </button>

              <button
                type="button"
                id="btn-mode-direct-checkin"
                onClick={() => {
                  setBookingType('check_in');
                  if (businessDate) setCheckInDate(businessDate);
                  setCleanError(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  bookingType === 'check_in'
                    ? 'border-blue-500/80 bg-blue-950/40 text-blue-100 shadow-md ring-1 ring-blue-500/40'
                    : 'border-neutral-800/80 bg-transparent text-neutral-500 hover:border-neutral-700 hover:text-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <DoorOpen className={`h-4 w-4 ${bookingType === 'check_in' ? 'text-blue-400' : 'text-neutral-500'}`} />
                    <span className={bookingType === 'check_in' ? 'text-white' : 'text-neutral-400'}>Immediate Direct Check-In</span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    bookingType === 'check_in'
                      ? 'bg-blue-900/80 border border-blue-500/60 text-blue-200'
                      : 'border border-neutral-800 text-neutral-500'
                  }`}>
                    Arrived Today
                  </span>
                </div>
                <p className={`text-[11px] leading-snug ${bookingType === 'check_in' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  Checks in guest directly with current business date ({businessDate}).
                </p>
              </button>
            </div>
          </div>

          {/* Room Type Selector / Filter Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                1. Select Room Type & Verify Date Inventory
              </label>
              <span className="text-[11px] text-neutral-500">
                Double reservation for the same date & room type is prohibited
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedTypeFilter === 'all'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                All Types ({roomsList.length})
              </button>

              {roomTypeStats.map(stat => (
                <button
                  key={stat.type}
                  type="button"
                  onClick={() => {
                    setSelectedTypeFilter(stat.type);
                    const firstAvail = roomsList.find(r => 
                      r.type === stat.type && 
                      r.status !== 'out_of_service' && 
                      r.status !== 'maintenance' &&
                      (!r.checkInDate || !r.checkOutDate || !checkOverlap(checkInDate, checkOutDate, r.checkInDate, r.checkOutDate))
                    );
                    if (firstAvail) {
                      setRoomNumber(firstAvail.roomNumber);
                      setCleanError(null);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                    selectedTypeFilter === stat.type
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                      : stat.isFullyBooked
                      ? 'bg-red-950/20 border-red-900/40 text-red-400/80 hover:border-red-700/60'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>{stat.type}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                    stat.isFullyBooked 
                      ? 'bg-red-900/50 text-red-300' 
                      : 'bg-neutral-800 text-emerald-400'
                  }`}>
                    {stat.isFullyBooked ? '0 Free' : `${stat.available} Avail`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Room Selection & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Target Room / Suite
              </label>
              <select
                id="booking-room-select"
                value={roomNumber}
                onChange={(e) => {
                  setRoomNumber(e.target.value);
                  setCleanError(null);
                }}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-white focus:outline-none ${
                  targetConflict 
                    ? 'border-red-500/80 bg-red-950/40 focus:border-red-400' 
                    : 'border-neutral-800 bg-neutral-950 focus:border-amber-400'
                }`}
              >
                {filteredRooms.map((r) => {
                  const hasDateCollision = r.checkInDate && r.checkOutDate && (r.status === 'occupied' || r.status === 'reserved') && checkOverlap(checkInDate, checkOutDate, r.checkInDate, r.checkOutDate);
                  return (
                    <option 
                      key={r.id} 
                      value={r.roomNumber}
                      className={hasDateCollision ? 'text-red-400 bg-neutral-900' : 'text-white bg-neutral-900'}
                    >
                      Room {r.roomNumber} - {r.type} {hasDateCollision ? ` [Booked: ${r.checkInDate} to ${r.checkOutDate}]` : ` [Available - ${formatCurrency(r.pricePerNight, settings.currency.symbol)}/nt]`}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Check-In Date & Time
                </label>
                {businessDate && (
                  <span className="text-[10px] text-amber-400 font-mono">
                    Min: {businessDate}
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                <input
                  type="date"
                  required
                  min={businessDate}
                  value={checkInDate}
                  onChange={(e) => {
                    setCheckInDate(e.target.value);
                    setCleanError(null);
                  }}
                  className={`w-full rounded-xl border bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:outline-none ${
                    isBeforeBusinessDate
                      ? 'border-rose-500 ring-1 ring-rose-500/50'
                      : 'border-neutral-800 focus:border-amber-400'
                  }`}
                />
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCheckInTime('14:00')}
                      className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                        checkInTime === '14:00'
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      2 PM
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckInTime('15:00')}
                      className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                        checkInTime === '15:00'
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      3 PM
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckInTime('12:00')}
                      className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                        checkInTime === '12:00'
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      Noon
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Check-Out Date & Time ({nightsCount} {nightsCount === 1 ? 'nt' : 'nts'})
                </label>
              </div>
              <div className="space-y-1.5">
                <input
                  type="date"
                  required
                  min={checkInDate}
                  value={checkOutDate}
                  onChange={(e) => {
                    setCheckOutDate(e.target.value);
                    setCleanError(null);
                  }}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCheckOutTime('12:00')}
                      className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                        checkOutTime === '12:00'
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      12 PM
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckOutTime('11:00')}
                      className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                        checkOutTime === '11:00'
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      11 AM
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckOutTime('14:00')}
                      className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                        checkOutTime === '14:00'
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      2 PM Late
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Past Business Date Warning Banner */}
          {isBeforeBusinessDate && (
            <div className="rounded-xl border border-rose-500/80 bg-rose-950/60 p-3 text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in shadow-md">
              <Lock className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white font-bold mb-0.5">
                  Locked: Check-in date ({checkInDate}) is prior to hotel business date ({businessDate})
                </strong>
                <span>
                  Adding reservations before the operational business date is prohibited. Please choose {businessDate} or a future date.
                </span>
              </div>
            </div>
          )}

          {/* Next/Double Booking Conflict Alert Banner */}
          {targetConflict && (
            <div className="rounded-2xl border-2 border-red-500/80 bg-red-950/50 p-4 text-xs space-y-3 animate-in fade-in shadow-xl backdrop-blur-sm">
              <div className="flex items-start gap-2.5 text-red-300 font-bold">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-sm font-black text-white tracking-wide">
                    {targetConflict.isNextBooking 
                      ? `Booking Rejected: Upcoming Next Booking on Room #${targetConflict.roomNumber}`
                      : `Booking Rejected: Room #${targetConflict.roomNumber} is Already Booked`}
                  </div>
                  <div className="text-[12px] text-red-200/90 font-medium">
                    Hotel Policy: This booking <strong>cannot be accepted</strong> while there is a next/existing booking for this period. <strong>You must change room to accept this reservation.</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-red-900/40 border border-red-500/40 text-red-100 text-[12px] space-y-1.5 ml-7">
                <div className="flex items-center justify-between">
                  <span>Conflicting Guest:</span>
                  <span className="font-bold text-white bg-red-950 px-2 py-0.5 rounded border border-red-700/50">
                    {targetConflict.guestName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Reserved Period:</span>
                  <span className="font-mono font-bold text-amber-200">
                    {targetConflict.checkInDate} - {targetConflict.checkOutDate}
                  </span>
                </div>
              </div>
              
              {/* One-click Change Room Section */}
              <div className="ml-7 pt-1 space-y-2">
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <DoorOpen className="h-3.5 w-3.5 text-amber-400" />
                    <span>Change Room to Accept Booking:</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">Click any room below to switch</span>
                </div>

                {availableSameTypeRooms.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                      Available {targetConflict.type} Rooms ({availableSameTypeRooms.length} free):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {availableSameTypeRooms.map(alt => (
                        <button
                          key={alt.id}
                          type="button"
                          onClick={() => {
                            setRoomNumber(alt.roomNumber);
                            setCleanError(null);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/60 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 transition-all font-bold text-xs shadow-md hover:scale-[1.02]"
                        >
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Change to Room #{alt.roomNumber}</span>
                          <span className="text-[10px] text-emerald-300/80 font-normal">({formatCurrency(alt.pricePerNight, settings.currency.symbol)}/nt)</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : allAvailableRooms.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-amber-300 font-medium">
                      All <strong>{targetConflict.type}</strong> suites have bookings for these dates. Change to an available room of another category:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allAvailableRooms.map(alt => (
                        <button
                          key={alt.id}
                          type="button"
                          onClick={() => {
                            setRoomNumber(alt.roomNumber);
                            setCleanError(null);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white transition-all text-xs font-semibold shadow-sm"
                        >
                          <DoorOpen className="h-3.5 w-3.5 text-amber-400" />
                          <span>Change to Room #{alt.roomNumber} ({alt.type})</span>
                          <span className="text-[10px] text-neutral-400">({formatCurrency(alt.pricePerNight, settings.currency.symbol)}/nt)</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-red-300">
                    No rooms in the resort are open for this full date span ({checkInDate} to {checkOutDate}). Please adjust the requested stay dates.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cleanliness Status & Policy Enforcement Alert */}
          {activeRoom && (
            <div className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              (bookingType === 'reservation' || checkInDate > businessDate)
                ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                : activeRoom.status === 'out_of_service' || activeRoom.status === 'maintenance'
                ? 'border-red-500/40 bg-red-950/30 text-red-200'
                : activeRoom.cleaningStatus === 'dirty' || activeRoom.cleaningStatus === 'in_progress' || activeRoom.status === 'cleaning'
                ? 'border-amber-500/40 bg-amber-950/25 text-amber-200'
                : 'border-blue-500/30 bg-blue-950/20 text-blue-200'
            }`}>
              <div className="flex items-center gap-2.5">
                {(bookingType === 'reservation' || checkInDate > businessDate) ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : activeRoom.cleaningStatus === 'clean' && activeRoom.status !== 'out_of_service' && activeRoom.status !== 'maintenance' ? (
                  <CheckCircle className="h-4 w-4 text-blue-400 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold">
                    {(bookingType === 'reservation' || checkInDate > businessDate)
                      ? `Reserve Booking Allowed Before Clean: Room #${activeRoom.roomNumber} (${activeRoom.cleaningStatus === 'clean' ? 'Currently Clean' : 'Currently Not Clean'})`
                      : `Direct Check-In Rule: Room #${activeRoom.roomNumber} is ${
                          activeRoom.status === 'out_of_service'
                            ? 'Out of Service (Red)'
                            : activeRoom.status === 'maintenance'
                            ? 'Under Maintenance (Red)'
                            : activeRoom.cleaningStatus === 'dirty' || activeRoom.cleaningStatus === 'in_progress' || activeRoom.status === 'cleaning'
                            ? 'Not Clean (Gray)'
                            : 'Clean & Ready (Blue)'
                        }`}
                  </span>
                  <p className="text-[11px] opacity-80">
                    {(bookingType === 'reservation' || checkInDate > businessDate)
                      ? `Because this is a reservation (not yet checking in), booking is permitted prior to cleaning. Housekeeping will clean and inspect room before arrival on ${checkInDate}.`
                      : activeRoom.cleaningStatus === 'clean' && activeRoom.status !== 'out_of_service' && activeRoom.status !== 'maintenance'
                      ? 'Room has been inspected and certified Clean. Ready for immediate guest check-in.'
                      : 'Direct in-house check-in requires room to be certified Clean (Blue) before guest enters.'}
                  </p>
                </div>
              </div>

              {(activeRoom.cleaningStatus === 'dirty' || activeRoom.cleaningStatus === 'in_progress' || activeRoom.status === 'cleaning' || activeRoom.status === 'out_of_service' || activeRoom.status === 'maintenance') && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeRoom) {
                      activeRoom.cleaningStatus = 'clean';
                      activeRoom.status = 'available';
                    }
                    setCleanError(null);
                  }}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg border border-blue-500/50 bg-blue-600/30 px-3 py-1.5 text-xs font-bold text-blue-200 hover:bg-blue-600/50 transition-all shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Mark Clean & Inspect Now</span>
                </button>
              )}
            </div>
          )}

          {cleanError && (
            <div className="rounded-xl border border-red-500/50 bg-red-950/40 p-3 text-xs text-red-200 flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{cleanError}</span>
            </div>
          )}

          {/* Guest Information */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-amber-400" />
              Primary Guest Contact
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lady Vivienne Montgomery"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. v.montgomery@estate.co.uk"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 492-9102"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Number of Guests
                </label>
                <select
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value={1}>1 Guest</option>
                  <option value={2}>2 Guests</option>
                  <option value={3}>3 Guests</option>
                  <option value={4}>4 Guests</option>
                  <option value={6}>6 Guests (Family / Suite)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="Credit Card">Credit Card (Visa / Master / Amex)</option>
                  <option value="Bank Transfer">Bank Wire / Corporate Account</option>
                  <option value="Stripe">Stripe Checkout</option>
                  <option value="Apple Pay">Apple Pay</option>
                  <option value="Cash">Cash on Check-In</option>
                </select>
              </div>
            </div>
          </div>

          {/* Extra Bed Add-on with Admin Control */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Bed className="h-4 w-4 text-amber-400" />
                Extra Bed & Sleeping Arrangement
              </h4>
              
              {/* Admin Role Permission Toggle Indicator */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdmin(!isAdmin)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                    isAdmin
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Click to toggle Admin Edit permissions"
                >
                  {isAdmin ? (
                    <>
                      <Unlock className="h-3 w-3 text-amber-400" />
                      <span>Admin User (Eleanor Vance)</span>
                      <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] uppercase font-bold text-amber-300">Editable</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3 text-neutral-500" />
                      <span>Standard Staff View</span>
                      <span className="rounded bg-neutral-800 px-1 py-0.2 text-[9px] uppercase text-neutral-400">Locked</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Extra Bed Selection Box */}
            <div className={`rounded-xl border p-4 transition-all ${
              extraBed 
                ? 'border-amber-500/50 bg-amber-500/10 shadow-sm' 
                : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                <label className="flex items-start sm:items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="extra-bed-checkbox"
                    checked={extraBed}
                    onChange={(e) => setExtraBed(e.target.checked)}
                    className="h-4.5 w-4.5 mt-0.5 sm:mt-0 rounded text-amber-500 focus:ring-amber-500 border-neutral-700 bg-neutral-950"
                  />
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-2">
                      <Bed className="h-3.5 w-3.5 text-amber-400" />
                      <span>Add Extra Bed</span>
                      {extraBed && (
                        <span className="rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold px-2 py-0.5 border border-amber-500/30">
                          Active
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Premium rollaway bed with hypoallergenic memory foam mattress & luxury duvet
                    </p>
                  </div>
                </label>

                {/* Extra Bed Controls */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1">
                    <span className="text-[11px] text-neutral-400 font-medium">Qty:</span>
                    <select
                      value={extraBedCount}
                      disabled={!extraBed}
                      onChange={(e) => setExtraBedCount(Number(e.target.value))}
                      className="bg-transparent text-xs font-bold text-white focus:outline-none disabled:opacity-40 cursor-pointer"
                    >
                      <option value={1}>1 Bed</option>
                      <option value={2}>2 Beds</option>
                      <option value={3}>3 Beds</option>
                    </select>
                  </div>

                  {isAdmin ? (
                    <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1" title="Admin user can customize extra bed rate">
                      <Edit3 className="h-3 w-3 text-amber-400" />
                      <span className="text-[11px] text-neutral-300 font-semibold">{settings.currency.symbol}</span>
                      <input
                        type="number"
                        min={0}
                        max={1000}
                        value={extraBedPrice}
                        disabled={!extraBed}
                        onChange={(e) => setExtraBedPrice(Math.max(0, Number(e.target.value)))}
                        className="w-14 bg-transparent text-xs font-mono font-bold text-white focus:outline-none disabled:opacity-40"
                      />
                      <span className="text-[10px] text-neutral-400 font-medium">/ night</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1">
                      <Lock className="h-3 w-3 text-neutral-500" />
                      <span className="text-xs font-mono font-bold text-neutral-200">
                        {formatCurrency(extraBedPrice, settings.currency.symbol)} / nt
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {extraBed && (
                <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                  <span className="text-neutral-400">
                    Calculated: <strong className="text-white">{extraBedCount} {extraBedCount === 1 ? 'bed' : 'beds'}</strong> × <strong className="text-white">{nightsCount} {nightsCount === 1 ? 'night' : 'nights'}</strong> @ {formatCurrency(extraBedPrice, settings.currency.symbol)}/nt = <strong className="text-amber-400 font-mono">{formatCurrency(extraBedTotal, settings.currency.symbol)}</strong>
                  </span>
                  {isAdmin ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Admin rate customization active
                    </span>
                  ) : (
                    <span className="text-neutral-500 italic">
                      Admin permission required to alter base rate
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes & Special Requests */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Special Requests / Concierge Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Anniversary setup, feather pillow preference, extra bed positioning..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Live Billing Breakdown */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
              <span>Room Rate ({nightsCount} nights @ {formatCurrency(pricePerNight, settings.currency.symbol)}):</span>
              <span className="text-white font-mono">{formatCurrency(baseRoomTotal, settings.currency.symbol)}</span>
            </div>
            {extraBed && (
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Bed className="h-3.5 w-3.5 text-amber-400" />
                  Extra Bed ({extraBedCount}x @ {formatCurrency(extraBedPrice, settings.currency.symbol)}/nt × {nightsCount} nights):
                </span>
                <span className="text-amber-400 font-mono font-semibold">{formatCurrency(extraBedTotal, settings.currency.symbol)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <span>Room Tax (VAT 10% only):</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold font-mono">10% VAT</span>
              </span>
              <span className="text-white font-mono">{formatCurrency(taxAmount, settings.currency.symbol)}</span>
            </div>
            <div className="my-2 border-t border-neutral-800"></div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Total Folio Payable:
                </span>
                <p className="text-[10px] text-neutral-500">
                  Room rate + Tax VAT 10% only (Auto-syncs with Accounting Ledger & Invoice Generator)
                </p>
              </div>
              <span className={`text-lg font-extrabold font-mono ${accent.text}`}>
                {formatCurrency(grandTotal, settings.currency.symbol, settings.currency.code)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-confirm-checkin"
              disabled={Boolean(targetConflict) || isBeforeBusinessDate}
              className={`rounded-xl px-6 py-2.5 text-xs font-bold transition-all shadow-lg ${
                targetConflict || isBeforeBusinessDate
                  ? 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed opacity-60' 
                  : `${accent.primary} ${accent.glow}`
              }`}
            >
              {isBeforeBusinessDate
                ? 'Check-In Date Prior to Business Date'
                : targetConflict 
                ? 'Double Booking Conflict (Resolve Above)' 
                : (bookingType === 'reservation' || checkInDate > businessDate)
                ? 'Confirm Room Reserve Booking (GstBlk)'
                : 'Confirm & Complete Check-In'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
