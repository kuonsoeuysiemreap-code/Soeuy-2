import React, { useState, useEffect } from 'react';
import { 
  ActiveTab, 
  Room, 
  Transaction, 
  StaffMember, 
  UserSettings, 
  RoomStatus, 
  CleaningStatus, 
  BookingFormData,
  RoomType,
  PaymentMethod 
} from './types';
import { 
  initialRooms, 
  initialTransactions, 
  initialStaff, 
  initialUserSettings 
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { RoomsView } from './components/RoomsView';
import { AccountingView } from './components/AccountingView';
import { SettingsView } from './components/SettingsView';
import { RoomDetailModal } from './components/RoomDetailModal';
import { BookingModal } from './components/BookingModal';
import { EditRoomModal } from './components/EditRoomModal';
import { EditReservationModal, ReservationEditData } from './components/EditReservationModal';
import { InvoiceModal, CustomerBookingUpdateData } from './components/InvoiceModal';
import { BillDetailsModal, BillChargeItem } from './components/BillDetailsModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { 
  InHouseGuestsModal, 
  GuestMessageModal, 
  MiscSalesModal, 
  NightAuditModal,
  UserLoginModal,
  AuthUser
} from './components/PMSActionModals';
import { NightAuditReportModal } from './components/NightAuditReportModal';
import { SuiteStatusReportModal } from './components/SuiteStatusReportModal';
import { ExchangeRateModal } from './components/ExchangeRateModal';
import { playChime, getAccentClasses, formatFolioDate } from './utils/helpers';
import { 
  Receipt, 
  FileText, 
  Search, 
  Plus, 
  Columns, 
  Printer, 
  CheckCircle2, 
  Building2, 
  User, 
  DoorOpen 
} from 'lucide-react';

export default function App() {
  // 1. Core State with Local Storage persistence
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('hotel_pms_rooms');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialRooms;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('hotel_pms_transactions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialTransactions;
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('hotel_pms_staff');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialStaff;
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('hotel_pms_settings');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        return { ...initialUserSettings, ...parsed, vatNumber: parsed.vatNumber || initialUserSettings.vatNumber };
      } catch (e) { console.error(e); }
    }
    return initialUserSettings;
  });

  // Current PMS Business Date (starts Aug 29, 2026, rolls over upon Night Audit)
  const [businessDate, setBusinessDate] = useState<string>(() => {
    const saved = localStorage.getItem('hotel_pms_business_date');
    if (!saved || saved === '2026-08-26' || saved === '2026-08-27' || saved === '2026-08-28') {
      localStorage.setItem('hotel_pms_business_date', '2026-08-29');
      return '2026-08-29';
    }
    return saved;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('rooms');

  // Modal states
  const [isRoomDetailOpen, setIsRoomDetailOpen] = useState(false);
  const [selectedRoomForDetail, setSelectedRoomForDetail] = useState<Room | null>(null);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingSelectedRoom, setBookingSelectedRoom] = useState<Room | null>(null);
  const [bookingDefaultCheckIn, setBookingDefaultCheckIn] = useState<string | undefined>(undefined);

  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
  const [isAddingNewRoom, setIsAddingNewRoom] = useState(false);
  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState<Room | null>(null);

  const [isEditReservationOpen, setIsEditReservationOpen] = useState(false);
  const [selectedReservationForEdit, setSelectedReservationForEdit] = useState<ReservationEditData | null>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceTransaction, setInvoiceTransaction] = useState<Transaction | null>(null);
  const [invoiceRoom, setInvoiceRoom] = useState<Room | null>(null);
  const [invoiceInitialTab, setInvoiceInitialTab] = useState<'booking' | 'invoice' | 'split'>('split');

  const [isBillDetailsModalOpen, setIsBillDetailsModalOpen] = useState(false);
  const [billDetailsRoom, setBillDetailsRoom] = useState<Room | null>(null);
  const [billDetailsGuestName, setBillDetailsGuestName] = useState<string>('');
  const [billDetailsSource, setBillDetailsSource] = useState<'amend_reservation' | 'direct' | null>(null);

  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isInHouseModalOpen, setIsInHouseModalOpen] = useState(false);
  const [isGuestMessageModalOpen, setIsGuestMessageModalOpen] = useState(false);
  const [isMiscSalesModalOpen, setIsMiscSalesModalOpen] = useState(false);
  const [isNightAuditModalOpen, setIsNightAuditModalOpen] = useState(false);
  const [isNightAuditReportModalOpen, setIsNightAuditReportModalOpen] = useState(false);
  const [nightAuditReportInitialTab, setNightAuditReportInitialTab] = useState<'summary' | 'room_trial' | 'cashier' | 'kpis' | 'cancel_delete'>('summary');
  const [nightAuditReportInitialMonth, setNightAuditReportInitialMonth] = useState<string | undefined>(undefined);
  const [isSuiteStatusReportModalOpen, setIsSuiteStatusReportModalOpen] = useState(false);
  const [isExchangeRateModalOpen, setIsExchangeRateModalOpen] = useState(false);
  const [isUserLoginModalOpen, setIsUserLoginModalOpen] = useState(false);
  const [roomsSubTab, setRoomsSubTab] = useState<'tape_chart' | 'grid' | 'list'>('tape_chart');

  const handleUpdateExchangeRate = (newRate: number) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        exchangeRateKHR: newRate,
        exchangeRateUSDToKHR: newRate,
      };
      try {
        localStorage.setItem('hotel_pms_settings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Authenticated Administrator User (Password: Admin1234)
  const [currentUser, setCurrentUser] = useState<AuthUser>(() => {
    const saved = localStorage.getItem('hotel_pms_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      username: 'Administrator',
      fullName: 'System Administrator',
      role: 'Super Admin',
      isLoggedIn: true,
      lastLogin: new Date().toLocaleTimeString(),
    };
  });

  const handleLogin = (username: string, password: string): boolean => {
    const cleanUser = username.trim();
    const isPassAdmin1234 = password === 'Admin1234' || password === 'admin1234';

    if (isPassAdmin1234) {
      const isAdminName = cleanUser.toLowerCase() === 'administrator' || cleanUser.toLowerCase() === 'admin' || !cleanUser;
      setCurrentUser({
        username: isAdminName ? 'Administrator' : cleanUser,
        fullName: isAdminName ? 'System Administrator' : cleanUser,
        role: isAdminName ? 'Super Admin' : 'Front Desk Operator',
        isLoggedIn: true,
        lastLogin: new Date().toLocaleTimeString(),
      });
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(prev => ({
      ...prev,
      isLoggedIn: false
    }));
  };

  // Invoices Hub search filter
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('hotel_pms_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('hotel_pms_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('hotel_pms_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('hotel_pms_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem('hotel_pms_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('hotel_pms_business_date', businessDate);
  }, [businessDate]);

  const accent = getAccentClasses(settings.accentColor);

  // ----------------------------------------------------
  // HANDLERS: ROOM & BOOKING LIFECYCLE
  // ----------------------------------------------------

  const handleOpenBooking = (room?: Room, defaultCheckIn?: string) => {
    setBookingSelectedRoom(room || null);
    const safeCheckIn = (defaultCheckIn && businessDate && defaultCheckIn < businessDate)
      ? businessDate
      : (defaultCheckIn || businessDate);
    setBookingDefaultCheckIn(safeCheckIn);
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = (roomNumber: string, bookingData: BookingFormData, totalAmount: number) => {
    if (settings.soundEffects) playChime();

    if (businessDate && bookingData.checkInDate < businessDate) {
      console.warn(`Cannot add reservations before business date (${businessDate}).`);
      return;
    }

    const targetRoom = rooms.find((r) => r.roomNumber === roomNumber);
    if (!targetRoom) return;

    const isDirectCheckIn = bookingData.bookingType === 'check_in';

    // 1. Update Room state
    if (isDirectCheckIn) {
      // Immediate Direct Check-In: guest coming and check-in to room direct with business date
      const updatedRooms = rooms.map((r) => {
        if (r.id === targetRoom.id) {
          return {
            ...r,
            status: 'occupied' as RoomStatus,
            guestName: bookingData.guestName,
            guestEmail: bookingData.guestEmail,
            guestPhone: bookingData.guestPhone,
            checkInDate: businessDate || bookingData.checkInDate,
            checkOutDate: bookingData.checkOutDate,
            checkInTime: bookingData.checkInTime || '14:00',
            checkOutTime: bookingData.checkOutTime || '12:00',
            arrivalTime: bookingData.checkInTime || '14:00',
            departTime: bookingData.checkOutTime || '12:00',
            notes: bookingData.notes,
          };
        }
        return r;
      });
      setRooms(updatedRooms);
    } else {
      // Room Reserve Booking: reserve reservation from waiting of coming guest
      // Crucial: room CANNOT automatically check-in even on the same day of business date!
      const newReservation = {
        id: `res-${Date.now()}`,
        guestName: bookingData.guestName,
        guestEmail: bookingData.guestEmail,
        guestPhone: bookingData.guestPhone,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        checkInTime: bookingData.checkInTime || '14:00',
        checkOutTime: bookingData.checkOutTime || '12:00',
        arrivalTime: bookingData.checkInTime || '14:00',
        departTime: bookingData.checkOutTime || '12:00',
        status: 'reserved' as const,
        label: `GstBlk(${bookingData.guestName.split(' ')[0]})`,
        rate: targetRoom.pricePerNight,
        guestsCount: bookingData.guestsCount,
        notes: bookingData.notes,
      };

      const updatedRooms = rooms.map((r) => {
        if (r.id === targetRoom.id) {
          const futureList = r.futureReservations ? [...r.futureReservations, newReservation] : [newReservation];
          // If room is currently available (or waiting), set status to 'reserved' (Expected Arrival)
          // It CANNOT be occupied even if on same business date!
          const shouldMarkRoomReserved = r.status !== 'occupied';
          return {
            ...r,
            status: shouldMarkRoomReserved ? ('reserved' as RoomStatus) : r.status,
            guestName: shouldMarkRoomReserved ? bookingData.guestName : r.guestName,
            guestEmail: shouldMarkRoomReserved ? bookingData.guestEmail : r.guestEmail,
            guestPhone: shouldMarkRoomReserved ? bookingData.guestPhone : r.guestPhone,
            checkInDate: shouldMarkRoomReserved ? bookingData.checkInDate : r.checkInDate,
            checkOutDate: shouldMarkRoomReserved ? bookingData.checkOutDate : r.checkOutDate,
            checkInTime: shouldMarkRoomReserved ? (bookingData.checkInTime || '14:00') : r.checkInTime,
            checkOutTime: shouldMarkRoomReserved ? (bookingData.checkOutTime || '12:00') : r.checkOutTime,
            arrivalTime: shouldMarkRoomReserved ? (bookingData.checkInTime || '14:00') : r.arrivalTime,
            departTime: shouldMarkRoomReserved ? (bookingData.checkOutTime || '12:00') : r.departTime,
            notes: shouldMarkRoomReserved ? bookingData.notes : r.notes,
            futureReservations: futureList,
          };
        }
        return r;
      });
      setRooms(updatedRooms);
    }

    // 2. Generate financial record
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      invoiceNumber: `INV-2026-${roomNumber}${Math.floor(100 + Math.random() * 899)}`,
      date: bookingData.checkInDate,
      description: `${targetRoom.type} Booking (#${roomNumber}) - ${bookingData.guestName}`,
      type: 'income',
      category: 'Room Booking',
      amount: totalAmount,
      paymentMethod: bookingData.paymentMethod,
      status: 'paid',
      guestOrVendor: bookingData.guestName,
      roomNumber: roomNumber,
      taxAmount: (totalAmount * settings.taxRatePercent) / 100,
      notes: bookingData.notes,
    };

    setTransactions([newTx, ...transactions]);
    setIsBookingModalOpen(false);
  };

  const handleUpdateRoomStatus = (roomId: string, newStatus: RoomStatus, cleaningStatus?: CleaningStatus) => {
    if (settings.soundEffects) playChime();
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          return {
            ...r,
            status: newStatus,
            cleaningStatus: cleaningStatus || (newStatus === 'available' ? 'clean' : newStatus === 'cleaning' ? 'dirty' : r.cleaningStatus),
            guestName: newStatus === 'available' ? undefined : r.guestName,
            checkInDate: newStatus === 'available' ? undefined : r.checkInDate,
            checkOutDate: newStatus === 'available' ? undefined : r.checkOutDate,
          };
        }
        return r;
      })
    );
  };

  const handleCheckOut = (room: Room) => {
    if (settings.soundEffects) playChime();

    // 1. Calculate nights & finalize settlement
    const inDate = new Date(room.checkInDate || '2026-08-26');
    const outDate = new Date(room.checkOutDate || '2026-08-28');
    const diffDays = Math.max(1, Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDue = diffDays * room.pricePerNight;

    // Check if an existing settled transaction is in ledger
    const existingTx = transactions.find(
      (t) => t.roomNumber === room.roomNumber && t.guestOrVendor === room.guestName
    );

    if (!existingTx && room.guestName) {
      const checkoutTx: Transaction = {
        id: `tx-co-${Date.now()}`,
        invoiceNumber: `INV-2026-${room.roomNumber}${Math.floor(100 + Math.random() * 899)}`,
        date: new Date().toISOString().split('T')[0],
        description: `${room.type} Stay Settlement (Room #${room.roomNumber}) - ${room.guestName}`,
        type: 'income',
        category: 'Room Booking',
        amount: totalDue,
        paymentMethod: 'Credit Card',
        status: 'paid',
        guestOrVendor: room.guestName,
        roomNumber: room.roomNumber,
        taxAmount: (totalDue * settings.taxRatePercent) / 100,
      };
      setTransactions((prev) => [checkoutTx, ...prev]);
    }

    // 2. Transition room to cleaning / vacant
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === room.id) {
          return {
            ...r,
            status: 'cleaning',
            cleaningStatus: 'dirty',
            guestName: undefined,
            guestEmail: undefined,
            guestPhone: undefined,
            checkInDate: undefined,
            checkOutDate: undefined,
            notes: undefined,
          };
        }
        return r;
      })
    );

    if (selectedRoomForDetail?.id === room.id) {
      setIsRoomDetailOpen(false);
    }
  };

  const handleDirectCheckInReservation = (
    roomId: string,
    reservationId?: string,
    customGuest?: {
      guestName: string;
      guestEmail?: string;
      guestPhone?: string;
      checkInDate: string;
      checkOutDate: string;
      rate?: number;
    }
  ) => {
    if (settings.soundEffects) playChime();

    setRooms((prevRooms) =>
      prevRooms.map((r) => {
        if (r.id !== roomId) return r;

        const matchingRes = r.futureReservations?.find(
          (res) => res.id === reservationId || (customGuest && res.guestName === customGuest.guestName)
        );

        const guestName = customGuest?.guestName || matchingRes?.guestName || r.guestName || 'In-House Guest';
        const checkInDate = customGuest?.checkInDate || matchingRes?.checkInDate || businessDate;
        const checkOutDate = customGuest?.checkOutDate || matchingRes?.checkOutDate || r.checkOutDate || '2026-09-02';
        const guestEmail = customGuest?.guestEmail || matchingRes?.guestEmail || r.guestEmail;
        const guestPhone = customGuest?.guestPhone || matchingRes?.guestPhone || r.guestPhone;

        const updatedFutureReservations = r.futureReservations?.filter(
          (res) => res.id !== (matchingRes?.id || reservationId)
        );

        return {
          ...r,
          status: 'occupied',
          cleaningStatus: 'clean',
          guestName,
          checkInDate,
          checkOutDate,
          guestEmail,
          guestPhone,
          futureReservations: updatedFutureReservations,
        };
      })
    );
  };

  const handleCheckInAllDueArrivals = () => {
    if (settings.soundEffects) playChime();

    setRooms((prevRooms) =>
      prevRooms.map((r) => {
        const dueReservation = r.futureReservations?.find((res) => res.checkInDate <= businessDate);

        if (dueReservation) {
          const remainingReservations = r.futureReservations?.filter((res) => res.id !== dueReservation.id);
          return {
            ...r,
            status: 'occupied',
            cleaningStatus: 'clean',
            guestName: dueReservation.guestName,
            guestEmail: dueReservation.guestEmail,
            guestPhone: dueReservation.guestPhone,
            checkInDate: dueReservation.checkInDate,
            checkOutDate: dueReservation.checkOutDate,
            futureReservations: remainingReservations,
          };
        } else if (r.status === 'reserved' && (!r.checkInDate || r.checkInDate <= businessDate)) {
          return {
            ...r,
            status: 'occupied',
            cleaningStatus: 'clean',
            checkInDate: r.checkInDate || businessDate,
          };
        }
        return r;
      })
    );
  };

  const handleSaveRoom = (updatedRoom: Room, originalRoomNumber: string) => {
    if (settings.soundEffects) playChime();

    setRooms((prev) => {
      const exists = prev.some((r) => r.id === updatedRoom.id);
      if (exists) {
        return prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r));
      }
      return [...prev, updatedRoom];
    });

    // Update transactions room numbers if room number changed
    if (originalRoomNumber !== updatedRoom.roomNumber) {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.roomNumber === originalRoomNumber ? { ...tx, roomNumber: updatedRoom.roomNumber } : tx
        )
      );
    }

    setIsEditRoomModalOpen(false);
    setIsAddingNewRoom(false);
  };

  const handleDeleteRoom = (roomId: string, roomNumber: string) => {
    if (settings.soundEffects) playChime();
    setRooms((prev) => prev.filter((r) => r.id !== roomId && r.roomNumber !== roomNumber));
    setIsEditRoomModalOpen(false);
    setIsAddingNewRoom(false);
    setIsRoomDetailOpen(false);
  };

  const handleOpenAddRoom = () => {
    setIsAddingNewRoom(true);
    const nextRoomNumber = (rooms.length + 101).toString();
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      roomNumber: nextRoomNumber,
      name: `Suite ${nextRoomNumber}`,
      type: 'Deluxe Suite',
      floor: 1,
      pricePerNight: 220,
      maxGuests: 2,
      bedType: '1 King Bed',
      sizeSqM: 45,
      view: 'Ocean View',
      status: 'available',
      cleaningStatus: 'clean',
      amenities: ['High-Speed WiFi', '4K Smart TV', 'Espresso Machine', 'Air Conditioning', 'En-Suite Bathroom'],
    };
    setSelectedRoomForEdit(newRoom);
    setIsEditRoomModalOpen(true);
  };

  // ----------------------------------------------------
  // HANDLERS: RESERVATIONS & FOLIOS
  // ----------------------------------------------------

  const handleOpenEditReservation = (reservation: ReservationEditData) => {
    setSelectedReservationForEdit(reservation);
    setIsEditReservationOpen(true);
  };

  const handleSaveReservation = (data: ReservationEditData, keepOpen: boolean = false) => {
    if (settings.soundEffects) playChime();

    setRooms((prev) => {
      const targetRoom = prev.find(r => r.id === data.roomId || r.roomNumber === data.roomNumber) || prev[0];
      
      return prev.map((r) => {
        const isTarget = r.id === targetRoom?.id;
        const hadOldFuture = r.futureReservations?.some(f => f.id === data.id);

        if (isTarget) {
          if (data.isCurrentStay || (r.status === 'occupied' && (!r.futureReservations || !r.futureReservations.some(f => f.id === data.id)))) {
            return {
              ...r,
              guestName: data.guestName,
              guestEmail: data.guestEmail,
              guestPhone: data.guestPhone,
              checkInDate: data.checkInDate,
              checkOutDate: data.checkOutDate,
              checkInTime: data.arrivalTime || r.checkInTime || '14:00',
              checkOutTime: data.departTime || r.checkOutTime || '12:00',
              arrivalTime: data.arrivalTime || r.arrivalTime || '14:00',
              departTime: data.departTime || r.departTime || '12:00',
              notes: data.notes,
              pricePerNight: data.rate || r.pricePerNight,
            };
          }

          const existingFutures = r.futureReservations || [];
          const exists = existingFutures.some(f => f.id === data.id);
          
          let updatedFutures;
          if (exists) {
            updatedFutures = existingFutures.map((fut) => {
              if (fut.id === data.id) {
                return {
                  ...fut,
                  guestName: data.guestName,
                  guestEmail: data.guestEmail,
                  guestPhone: data.guestPhone,
                  checkInDate: data.checkInDate,
                  checkOutDate: data.checkOutDate,
                  checkInTime: data.arrivalTime || fut.checkInTime || '14:00',
                  checkOutTime: data.departTime || fut.checkOutTime || '12:00',
                  arrivalTime: data.arrivalTime || fut.arrivalTime || '14:00',
                  departTime: data.departTime || fut.departTime || '12:00',
                  rate: data.rate,
                  guestsCount: data.guestsCount,
                  notes: data.notes,
                  extraBed: data.extraBed,
                  vipStatus: data.vipStatus,
                  roomNumber: r.roomNumber,
                };
              }
              return fut;
            });
          } else {
            updatedFutures = [
              ...existingFutures,
              {
                id: data.id || `fut-${Date.now()}`,
                guestName: data.guestName,
                guestEmail: data.guestEmail,
                guestPhone: data.guestPhone,
                checkInDate: data.checkInDate,
                checkOutDate: data.checkOutDate,
                checkInTime: data.arrivalTime || '14:00',
                checkOutTime: data.departTime || '12:00',
                arrivalTime: data.arrivalTime || '14:00',
                departTime: data.departTime || '12:00',
                rate: data.rate,
                guestsCount: data.guestsCount,
                notes: data.notes,
                extraBed: data.extraBed,
                vipStatus: data.vipStatus,
                roomNumber: r.roomNumber,
              }
            ];
          }

          return {
            ...r,
            futureReservations: updatedFutures,
          };
        } else if (hadOldFuture) {
          return {
            ...r,
            futureReservations: (r.futureReservations || []).filter(f => f.id !== data.id),
          };
        }

        return r;
      });
    });

    if (!keepOpen) {
      setIsEditReservationOpen(false);
    }
  };

  const handleCancelReservation = (
    reservationId?: string, 
    roomId?: string, 
    actionType: 'cancel' | 'delete' = 'cancel', 
    details?: {
      guestName?: string;
      roomNumber?: string;
      rate?: number;
      reason?: string;
      date?: string;
      paymentMethod?: PaymentMethod;
      notes?: string;
    }
  ) => {
    if (settings.soundEffects) playChime();

    // Locate target room and details
    const targetRoom = rooms.find(r => (roomId && r.id === roomId) || (details?.roomNumber && r.roomNumber === details.roomNumber));
    const effectiveGuest = details?.guestName || targetRoom?.guestName || 'Guest';
    const effectiveRoomNo = details?.roomNumber || targetRoom?.roomNumber || '15';
    const effectiveRate = details?.rate !== undefined ? details.rate : (targetRoom?.pricePerNight || 30);
    const effectiveDate = details?.date || businessDate || new Date().toISOString().split('T')[0];
    const seq = Math.floor(1000 + Math.random() * 9000);
    const voucherPrefix = actionType === 'delete' ? 'DEL' : 'CAN';
    const invoiceNumber = `${voucherPrefix}-2026-${seq}`;

    // Create and record transaction in Report 1 ledger
    const newTx: Transaction = {
      id: `tx-${actionType}-${Date.now()}`,
      invoiceNumber,
      date: effectiveDate,
      category: actionType === 'delete' ? 'Reservation Deletion' : 'Reservation Cancellation',
      description: actionType === 'delete' 
        ? `Deleted reservation for ${effectiveGuest} (Room ${effectiveRoomNo})`
        : `Guest cancelled reservation for ${effectiveGuest} (Room ${effectiveRoomNo})`,
      amount: effectiveRate,
      type: 'refund',
      status: 'refunded',
      paymentMethod: details?.paymentMethod || 'Cash',
      notes: details?.notes || (actionType === 'delete' ? 'Purged reservation record' : 'Guest cancel retention/release'),
      roomNumber: effectiveRoomNo,
      guestOrVendor: effectiveGuest,
      actionType,
      cancellationReason: details?.reason || (actionType === 'delete' ? 'Duplicate reservation entry' : 'Guest travel itinerary change'),
      operatorName: currentUser?.fullName || 'Receptionist',
    };

    setTransactions((prev) => [newTx, ...prev]);

    setRooms((prev) =>
      prev.map((r) => {
        if ((roomId && r.id === roomId) || (details?.roomNumber && r.roomNumber === details.roomNumber)) {
          if (reservationId && r.futureReservations) {
            return {
              ...r,
              futureReservations: r.futureReservations.filter((fut) => fut.id !== reservationId),
            };
          } else if (r.status === 'reserved') {
            return {
              ...r,
              status: 'available',
              guestName: undefined,
              guestEmail: undefined,
              guestPhone: undefined,
              checkInDate: undefined,
              checkOutDate: undefined,
              notes: undefined,
            };
          }
        } else if (reservationId && r.futureReservations) {
          return {
            ...r,
            futureReservations: r.futureReservations.filter((fut) => fut.id !== reservationId),
          };
        }
        return r;
      })
    );
  };

  const handleSaveCustomerBooking = (data: CustomerBookingUpdateData) => {
    if (settings.soundEffects) playChime();

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === data.roomId || r.roomNumber === data.roomNumber) {
          return {
            ...r,
            guestName: data.guestName,
            guestEmail: data.guestEmail,
            guestPhone: data.guestPhone,
            checkInDate: data.checkInDate,
            checkOutDate: data.checkOutDate,
            pricePerNight: data.rate || r.pricePerNight,
            type: (data.roomType as RoomType) || r.type,
            notes: data.notes,
          };
        }
        return r;
      })
    );
  };

  // ----------------------------------------------------
  // HANDLERS: INVOICE MODAL OPENERS
  // ----------------------------------------------------

  const handleViewInvoiceFromTransaction = (transaction: Transaction, room?: Room) => {
    setInvoiceTransaction(transaction);
    setInvoiceRoom(room || (transaction.roomNumber ? rooms.find((r) => r.roomNumber === transaction.roomNumber) || null : null));
    setInvoiceInitialTab('split');
    setIsInvoiceModalOpen(true);
  };

  const handleViewInvoiceFromRoom = (room: Room, guestNameOverride?: string) => {
    const existingTx = transactions.find((t) => t.roomNumber === room.roomNumber);
    if (existingTx) {
      setInvoiceTransaction(existingTx);
    } else {
      setInvoiceTransaction(null);
    }
    const targetRoom = guestNameOverride ? { ...room, guestName: guestNameOverride } : room;
    setInvoiceRoom(targetRoom);
    setInvoiceInitialTab('split');
    setIsInvoiceModalOpen(true);
  };

  const handleOpenSampleInvoice = () => {
    setInvoiceTransaction(null);
    setInvoiceRoom(rooms[0] || null);
    setInvoiceInitialTab('split');
    setIsInvoiceModalOpen(true);
  };

  const handleOpenGuestProfile = () => {
    const occupiedRoom = rooms.find((r) => r.status === 'occupied' && r.guestName) || rooms[0];
    setSelectedReservationForEdit({
      id: `stay-${occupiedRoom.id}`,
      roomId: occupiedRoom.id,
      roomNumber: occupiedRoom.roomNumber,
      guestName: occupiedRoom.guestName || 'Mr. SOK ELEONORE',
      guestEmail: occupiedRoom.guestEmail || 'guest@example.com',
      guestPhone: occupiedRoom.guestPhone || '(+855) 12 345 678',
      checkInDate: occupiedRoom.checkInDate || '2026-08-26',
      checkOutDate: occupiedRoom.checkOutDate || '2026-08-29',
      rate: occupiedRoom.pricePerNight,
      guestsCount: occupiedRoom.maxGuests,
      paymentMethod: 'Credit Card',
      notes: occupiedRoom.notes || '',
      isCurrentStay: occupiedRoom.status === 'occupied',
    });
    setIsEditReservationOpen(true);
  };

  // ----------------------------------------------------
  // HANDLERS: TRANSACTIONS & RESET
  // ----------------------------------------------------

  const handleAddTransaction = (newTx: Transaction) => {
    if (settings.soundEffects) playChime();
    setTransactions([newTx, ...transactions]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRunNightAuditAndRollDate = (
    targetNextDate?: string,
    daysCount: number = 1,
    postToFolio: boolean = true,
    targetSplit: number = 1
  ) => {
    const closedDate = businessDate;
    const count = Math.max(1, daysCount || 1);
    const occupiedRooms = rooms.filter((r) => r.status === 'occupied');
    const newTransactions: Transaction[] = [];
    const taxRate = settings.taxRatePercent || 10;

    // Iterate through each day in count day-by-day
    for (let dayIdx = 0; dayIdx < count; dayIdx++) {
      const d = new Date(closedDate);
      d.setDate(d.getDate() + dayIdx);
      const auditDateIso = isNaN(d.getTime()) ? closedDate : d.toISOString().split('T')[0];
      const auditDateFolio = formatFolioDate(auditDateIso);

      // 1. Post Accommodation Charge directly to each occupied room's Bill Detail (localStorage)
      if (postToFolio) {
        occupiedRooms.forEach((r) => {
          const guestName = r.guestName || `Guest Room ${r.roomNumber}`;
          const storageKey = `winhms_bill_${r.roomNumber}_${guestName.replace(/[^a-zA-Z0-9]/g, '_')}`;

          let currentCharges: BillChargeItem[] = [];
          let existingFolioData: Record<string, any> = {};

          try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
              existingFolioData = JSON.parse(raw);
              if (Array.isArray(existingFolioData.charges)) {
                // Filter out any legacy mock demo charges (c-1..c-18)
                currentCharges = existingFolioData.charges.filter(
                  (c: BillChargeItem) => !/^c-(?:[1-9]|1[0-8])(?:-pay)?$/.test(c.id || '')
                );
              }
            } else {
              currentCharges = [];
            }
          } catch (e) {
            console.error('Error reading folio for night audit', e);
          }

          // Check if charge already exists for this exact date to prevent duplicate double-posting
          const alreadyExists = currentCharges.some(
            (c) =>
              c.date === auditDateFolio &&
              (c.category === 'Accommodation' || c.description.toLowerCase().includes('accommodation') || c.description.toLowerCase().includes('room charge'))
          );

          if (!alreadyExists) {
            const roomTariff = r.pricePerNight || existingFolioData.tariffRate || 40.00;
            const newChargeItem: BillChargeItem = {
              id: `c-na-rm-${r.roomNumber}-${auditDateIso.replace(/-/g, '')}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              date: auditDateFolio,
              description: 'Room Charge - Tariff',
              amount: roomTariff,
              splitId: targetSplit || 1,
              category: 'Accommodation',
              referenceNo: `NA-TARIFF-${auditDateIso.replace(/-/g, '')}-${r.roomNumber}`,
              postedBy: 'Night Audit (Auto)',
              tariffRate: roomTariff,
            };
            currentCharges.push(newChargeItem);

            const updatedFolio = {
              ...existingFolioData,
              charges: currentCharges,
              tariffRate: roomTariff,
              isSplitEnabled: existingFolioData.isSplitEnabled ?? true,
              numSplits: existingFolioData.numSplits ?? 2,
              arrivalDate: r.checkInDate ? formatFolioDate(r.checkInDate) : existingFolioData.arrivalDate || auditDateFolio,
              departureDate: r.checkOutDate ? formatFolioDate(r.checkOutDate) : existingFolioData.departureDate || '',
              ratePlan: existingFolioData.ratePlan || 'Regular Tariff',
              paxCount: r.maxGuests || existingFolioData.paxCount || 2,
              companyName: existingFolioData.companyName || 'DIRECT BOOKING - SELF BOOKING',
              lastAuditPostedDate: auditDateFolio,
            };

            localStorage.setItem(storageKey, JSON.stringify(updatedFolio));
            try {
              window.dispatchEvent(new CustomEvent('pms_folio_updated', { detail: { roomNumber: r.roomNumber } }));
            } catch (evErr) {
              console.error('Error dispatching pms_folio_updated', evErr);
            }
          }
        });
      }

      // 2. Post financial ledger transactions for accounting and manager flash reports
      occupiedRooms.forEach((r, idx) => {
        const roomTariff = r.pricePerNight || 40.00;
        newTransactions.push({
          id: `tx-na-rm-${auditDateIso}-${r.roomNumber}-${Date.now()}-${idx}`,
          invoiceNumber: `NA-TARIFF-${auditDateIso.replace(/-/g, '')}-${r.roomNumber}`,
          guestOrVendor: r.guestName || `Room ${r.roomNumber} Guest`,
          category: 'Room Booking',
          description: `Room ${r.roomNumber} Night Stay (${auditDateFolio}) - Room Charge from Tariff ($${roomTariff.toFixed(2)})`,
          amount: roomTariff,
          type: 'income',
          paymentMethod: 'Credit Card',
          status: 'paid',
          date: auditDateIso,
          roomNumber: r.roomNumber,
          notes: `Night Audit auto-posted room charge from room tariff ($${roomTariff.toFixed(2)}) for business date ${auditDateIso}`,
        });
        const taxAmount = (r.pricePerNight * taxRate) / 100;
        if (taxAmount > 0) {
          newTransactions.push({
            id: `tx-na-tax-${auditDateIso}-${r.roomNumber}-${Date.now()}-${idx}`,
            invoiceNumber: `TAX-${auditDateIso.replace(/-/g, '')}-${r.roomNumber}`,
            guestOrVendor: r.guestName || `Room ${r.roomNumber} Guest`,
            category: 'Taxes & Fees',
            description: `Room ${r.roomNumber} Government Tax / VAT (${taxRate}%)`,
            amount: parseFloat(taxAmount.toFixed(2)),
            type: 'income',
            paymentMethod: 'Credit Card',
            status: 'paid',
            date: auditDateIso,
            roomNumber: r.roomNumber,
            notes: `Night Audit tax posting for business date ${auditDateIso}`,
          });
        }
      });
    }

    if (newTransactions.length > 0) {
      setTransactions((prev) => [...newTransactions, ...prev]);
    }

    // 3. Compute target rolled date
    let finalNextDate = targetNextDate;
    if (!finalNextDate) {
      const lastD = new Date(closedDate);
      lastD.setDate(lastD.getDate() + count);
      finalNextDate = isNaN(lastD.getTime()) ? '2026-08-27' : lastD.toISOString().split('T')[0];
    }

    setBusinessDate(finalNextDate);

    // Notify all open views and modals that folios were updated
    window.dispatchEvent(
      new CustomEvent('pms_folio_updated', {
        detail: {
          daysCount: count,
          businessDate: finalNextDate,
          roomsCount: occupiedRooms.length,
        },
      })
    );

    if (settings.soundEffects) playChime();
  };

  const handleResetData = () => {
    if (settings.soundEffects) playChime();
    localStorage.removeItem('hotel_pms_rooms');
    localStorage.removeItem('hotel_pms_transactions');
    localStorage.removeItem('hotel_pms_staff');
    localStorage.removeItem('hotel_pms_settings');
    localStorage.removeItem('hotel_pms_business_date');
    setRooms(initialRooms);
    setTransactions(initialTransactions);
    setStaff(initialStaff);
    setSettings(initialUserSettings);
    setBusinessDate('2026-08-29');
  };

  // Filtered list for Invoices tab
  const filteredInvoicesList = transactions.filter((tx) => {
    const q = invoiceSearchQuery.toLowerCase();
    return (
      tx.invoiceNumber.toLowerCase().includes(q) ||
      tx.description.toLowerCase().includes(q) ||
      tx.guestOrVendor.toLowerCase().includes(q) ||
      (tx.roomNumber && tx.roomNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9fbfe] via-[#ebf2fa] to-[#d6e5f7] text-[#1c2d42] flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-950">
      
      {/* 1. Header Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        rooms={rooms}
        transactions={transactions}
        businessDate={businessDate}
        currentUser={currentUser}
        onOpenLoginModal={() => setIsUserLoginModalOpen(true)}
        onOpenQuickBooking={() => handleOpenBooking()}
        onOpenAddTransaction={() => setIsAddTransactionOpen(true)}
        onOpenSampleInvoice={handleOpenSampleInvoice}
        onOpenBillDetails={() => {
          const occupiedRoom = rooms.find(r => r.status === 'occupied') || rooms[0];
          setBillDetailsRoom(occupiedRoom || null);
          setBillDetailsGuestName(occupiedRoom?.guestName || 'Mr.BONG SMBATH, .');
          setIsBillDetailsModalOpen(true);
        }}
        onOpenGuestProfile={handleOpenGuestProfile}
        onOpenCheckIn={() => {
          const availableRoom = rooms.find(r => r.status === 'available') || rooms[0];
          handleOpenBooking(availableRoom);
        }}
        onOpenChangeRoom={() => {
          const occupiedRoom = rooms.find(r => r.status === 'occupied') || rooms[0];
          setSelectedRoomForEdit(occupiedRoom);
          setIsEditRoomModalOpen(true);
        }}
        onOpenGuestMessages={() => setIsGuestMessageModalOpen(true)}
        onOpenAdvanceDeposit={() => setIsAddTransactionOpen(true)}
        onOpenMiscSales={() => setIsMiscSalesModalOpen(true)}
        onOpenCheckOut={() => {
          const occupiedRoom = rooms.find(r => r.status === 'occupied');
          if (occupiedRoom) {
            setSelectedRoomForDetail(occupiedRoom);
            setIsRoomDetailOpen(true);
          } else {
            setIsInHouseModalOpen(true);
          }
        }}
        onOpenInHouse={() => setIsInHouseModalOpen(true)}
        onOpenNightAudit={() => setIsNightAuditModalOpen(true)}
        onOpenNightAuditReport={() => setIsNightAuditReportModalOpen(true)}
        onOpenExchangeRateModal={() => setIsExchangeRateModalOpen(true)}
        onOpenTapeChart={() => {
          setActiveTab('rooms');
          setRoomsSubTab('tape_chart');
        }}
        onOpenRoomStatus={() => setIsSuiteStatusReportModalOpen(true)}
        onOpenAddRoom={handleOpenAddRoom}
        onSelectRoomsSubTab={setRoomsSubTab}
        onExit={() => {
          setActiveTab('rooms');
        }}
      />

      {/* 2. Main Content View Router */}
      <main className={`flex-1 w-full max-w-none ${activeTab === 'rooms' && roomsSubTab === 'tape_chart' ? 'p-0 flex flex-col min-h-0' : 'px-3 sm:px-5 lg:px-6 py-4'}`}>
        
        {/* ROOMS TAB (PMS Tape Chart, Room Cards, Room Table) */}
        {activeTab === 'rooms' && (
          <RoomsView
            rooms={rooms}
            settings={settings}
            currentUser={currentUser}
            businessDate={businessDate}
            activeSubTab={roomsSubTab}
            onSubTabChange={setRoomsSubTab}
            onSelectRoom={(room) => {
              setSelectedRoomForDetail(room);
              setIsRoomDetailOpen(true);
            }}
            onOpenBooking={handleOpenBooking}
            onOpenEditRoom={(room) => {
              setIsAddingNewRoom(false);
              setSelectedRoomForEdit(room);
              setIsEditRoomModalOpen(true);
            }}
            onDeleteRoom={handleDeleteRoom}
            onOpenAddRoom={handleOpenAddRoom}
            onUpdateRoomStatus={handleUpdateRoomStatus}
            onCheckOut={handleCheckOut}
            onViewInvoice={handleViewInvoiceFromRoom}
            onEditReservation={handleOpenEditReservation}
            onCancelReservation={handleCancelReservation}
            onOpenCheckIn={() => {
              const availableRoom = rooms.find((r) => r.status === 'available') || rooms[0];
              handleOpenBooking(availableRoom);
            }}
            onOpenChangeRoom={() => {
              const targetRoom = rooms.find((r) => r.status === 'occupied') || rooms[0];
              setSelectedRoomForEdit(targetRoom);
              setIsEditRoomModalOpen(true);
            }}
            onOpenAdvanceDeposit={() => setIsAddTransactionOpen(true)}
            onOpenCharges={() => setIsAddTransactionOpen(true)}
            onOpenMiscSales={() => setIsMiscSalesModalOpen(true)}
            onOpenInHouse={() => setIsInHouseModalOpen(true)}
            onOpenGuestAmend={handleOpenGuestProfile}
            onOpenGuestMessages={() => setIsGuestMessageModalOpen(true)}
            onOpenNightAudit={() => setIsNightAuditModalOpen(true)}
            onOpenRoomStatus={() => setIsSuiteStatusReportModalOpen(true)}
            onDirectCheckInReservation={handleDirectCheckInReservation}
            onCheckInAllDueArrivals={handleCheckInAllDueArrivals}
          />
        )}

        {/* INVOICES & GUEST FOLIOS TAB */}
        {activeTab === 'invoices' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Top Invoice Hub Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-inner">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Guest Folio & Official Invoice Hub</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                      Standard Template
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Dual-currency billing (USD & KHR), customer registration profiles, and print-ready tax invoices
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  id="btn-open-sample-invoice"
                  onClick={handleOpenSampleInvoice}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md active:scale-95 ${accent.primary}`}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create / View Invoice</span>
                </button>
              </div>
            </div>

            {/* Quick Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/80 border border-neutral-800 p-3.5 rounded-2xl">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search invoice number, guest name, room..."
                  value={invoiceSearchQuery}
                  onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span>Total Active Folios: <strong className="text-white">{transactions.length}</strong></span>
              </div>
            </div>

            {/* Invoices List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInvoicesList.map((tx) => {
                const matchingRoom = tx.roomNumber ? rooms.find((r) => r.roomNumber === tx.roomNumber) : undefined;
                return (
                  <div
                    key={tx.id}
                    onClick={() => handleViewInvoiceFromTransaction(tx, matchingRoom)}
                    className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-4 hover:border-neutral-700 transition-all cursor-pointer shadow-lg flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/40">
                          {tx.invoiceNumber}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          tx.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {tx.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {tx.guestOrVendor}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                        {tx.description}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800 pt-2 font-mono">
                        <span>Date: {tx.date}</span>
                        {tx.roomNumber && (
                          <span className="text-amber-400 font-bold">Room #{tx.roomNumber}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-neutral-500 block">Total Amount</span>
                        <span className="font-mono text-base font-black text-white">
                          ${tx.amount.toFixed(2)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewInvoiceFromTransaction(tx, matchingRoom);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 text-xs font-bold transition-all shadow-sm"
                      >
                        <Receipt className="h-3.5 w-3.5 text-purple-400" />
                        <span>Open Folio</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ACCOUNTING TAB (Revenue, Expenses, Ledger Records) */}
        {activeTab === 'accounting' && (
          <AccountingView
            transactions={transactions}
            rooms={rooms}
            settings={settings}
            onOpenAddTransaction={() => setIsAddTransactionOpen(true)}
            onViewInvoice={handleViewInvoiceFromTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {/* SETTINGS TAB (Hotel branding, Address Sync, KHR Exchange, Audio) */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={(newSettings) => {
              setSettings(newSettings);
              if (newSettings.defaultRoomView) {
                setRoomsSubTab(newSettings.defaultRoomView);
              }
            }}
            onResetData={handleResetData}
            onSelectRoomView={(view) => {
              setRoomsSubTab(view);
              setActiveTab('rooms');
            }}
          />
        )}
      </main>

      {/* 3. MODALS */}

      {/* Room Detail Modal */}
      <RoomDetailModal
        isOpen={isRoomDetailOpen}
        onClose={() => setIsRoomDetailOpen(false)}
        room={selectedRoomForDetail}
        settings={settings}
        onUpdateRoomStatus={handleUpdateRoomStatus}
        onCheckOut={handleCheckOut}
        onOpenBookingForRoom={handleOpenBooking}
        onViewInvoiceForRoom={handleViewInvoiceFromRoom}
        onOpenEditRoom={(room) => {
          setIsAddingNewRoom(false);
          setSelectedRoomForEdit(room);
          setIsEditRoomModalOpen(true);
        }}
        onDeleteRoom={handleDeleteRoom}
        onEditReservation={handleOpenEditReservation}
        onCancelReservation={handleCancelReservation}
      />

      {/* Booking / Check-in Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedRoom={bookingSelectedRoom}
        availableRooms={rooms.filter((r) => r.status === 'available' || r.status === 'cleaning')}
        allRooms={rooms}
        settings={settings}
        businessDate={businessDate}
        defaultCheckInDate={bookingDefaultCheckIn}
        isAdminUser={true}
        onSubmitBooking={handleBookingSubmit}
        onOpenAmendReservation={(targetRoom, initialGuestName) => {
          setIsBookingModalOpen(false);
          const r = targetRoom || bookingSelectedRoom || rooms.find((rm) => rm.status === 'reserved' || (rm.status === 'occupied' && rm.guestName)) || rooms[0];
          const hasExistingGuest = (r.status === 'reserved' || r.status === 'occupied') && Boolean(r.guestName);
          setSelectedReservationForEdit({
            id: `res-${r.id}-${Date.now()}`,
            roomId: r.id,
            roomNumber: r.roomNumber,
            guestName: initialGuestName || (hasExistingGuest ? (r.guestName || '') : ''),
            guestEmail: hasExistingGuest ? (r.guestEmail || '') : '',
            guestPhone: hasExistingGuest ? (r.guestPhone || '') : '',
            checkInDate: r.checkInDate || businessDate || '2026-08-27',
            checkOutDate: r.checkOutDate || '2026-08-31',
            rate: r.pricePerNight || 160,
            guestsCount: r.maxGuests || 2,
            paymentMethod: 'Cash',
            notes: hasExistingGuest ? (r.notes || '') : '',
            isCurrentStay: false,
            isReservationOnly: true,
            guestExpectedStatus: 'Expected',
            bookingStatus: 'Confirmed',
            depositAmount: 0,
            vipStatus: r.status === 'reserved' ? 'VIP' : undefined,
          });
          setIsEditReservationOpen(true);
        }}
      />

      {/* Edit Room Modal */}
      <EditRoomModal
        isOpen={isEditRoomModalOpen}
        onClose={() => {
          setIsEditRoomModalOpen(false);
          setIsAddingNewRoom(false);
        }}
        room={selectedRoomForEdit}
        settings={settings}
        isNewRoom={isAddingNewRoom}
        onSaveRoom={handleSaveRoom}
        onDeleteRoom={handleDeleteRoom}
      />

      {/* Edit Reservation / Windows PMS Modal */}
      <EditReservationModal
        isOpen={isEditReservationOpen}
        onClose={() => setIsEditReservationOpen(false)}
        reservation={selectedReservationForEdit}
        rooms={rooms}
        settings={settings}
        currentUser={currentUser}
        onSaveReservation={handleSaveReservation}
        onCancelReservation={handleCancelReservation}
        onOpenReport1={(tab, month) => {
          setIsEditReservationOpen(false);
          setNightAuditReportInitialTab(tab || 'cancel_delete');
          setNightAuditReportInitialMonth(month);
          setIsNightAuditReportModalOpen(true);
        }}
        onCheckInReservation={(data) => {
          handleSaveReservation(data);
          const targetRoom = rooms.find((r) => r.roomNumber === data.roomNumber);
          if (targetRoom) {
            handleUpdateRoomStatus(targetRoom.id, 'occupied');
          }
        }}
        onViewFolio={(room, guestName) => {
          setIsEditReservationOpen(false);
          setBillDetailsSource('amend_reservation');
          setBillDetailsRoom(room);
          setBillDetailsGuestName(guestName);
          setIsBillDetailsModalOpen(true);
        }}
      />

      {/* WINHMS Front Office Bill Details Modal (Split Folios) */}
      <BillDetailsModal
        isOpen={isBillDetailsModalOpen}
        onClose={() => {
          setIsBillDetailsModalOpen(false);
          if (billDetailsSource === 'amend_reservation') {
            setIsEditReservationOpen(true);
            setBillDetailsSource(null);
          }
        }}
        room={billDetailsRoom}
        guestName={billDetailsGuestName}
        settings={settings}
        currentUser={currentUser}
        businessDate={businessDate}
      />

      {/* Master Invoice Modal: Guest Folio */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        transaction={invoiceTransaction}
        room={invoiceRoom}
        settings={settings}
        initialTab={invoiceInitialTab}
        onSaveCustomerBooking={handleSaveCustomerBooking}
      />

      {/* Record Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        rooms={rooms}
        settings={settings}
        onAddTransaction={handleAddTransaction}
      />

      {/* In-House Guests Directory Modal */}
      <InHouseGuestsModal
        isOpen={isInHouseModalOpen}
        onClose={() => setIsInHouseModalOpen(false)}
        rooms={rooms}
        settings={settings}
        onSelectRoom={(room) => {
          setSelectedRoomForDetail(room);
          setIsRoomDetailOpen(true);
        }}
        onOpenFolio={(room, guestName) => {
          handleViewInvoiceFromRoom(room, guestName);
        }}
      />

      {/* Guest Messages Modal */}
      <GuestMessageModal
        isOpen={isGuestMessageModalOpen}
        onClose={() => setIsGuestMessageModalOpen(false)}
        rooms={rooms}
      />

      {/* Miscellaneous POS Sales Modal */}
      <MiscSalesModal
        isOpen={isMiscSalesModalOpen}
        onClose={() => setIsMiscSalesModalOpen(false)}
        rooms={rooms}
        onAddTransaction={handleAddTransaction}
      />

      {/* Night Audit Wizard Modal */}
      <NightAuditModal
        isOpen={isNightAuditModalOpen}
        onClose={() => setIsNightAuditModalOpen(false)}
        rooms={rooms}
        transactions={transactions}
        settings={settings}
        businessDate={businessDate}
        currentUser={currentUser}
        onRunAuditAndRollDate={handleRunNightAuditAndRollDate}
        onOpenReport={() => setIsNightAuditReportModalOpen(true)}
        onOpenBillDetails={(room, guestName) => {
          setBillDetailsRoom(room || null);
          setBillDetailsGuestName(guestName || (room ? room.guestName || '' : ''));
          setBillDetailsSource('direct');
          setIsBillDetailsModalOpen(true);
        }}
        onCheckInAllDueRooms={handleCheckInAllDueArrivals}
        onOpenTapeChart={() => {
          setActiveTab('rooms');
          setRoomsSubTab('tape_chart');
        }}
      />

      {/* Daily Night Audit Closing Report (Manager Flash) Modal */}
      <NightAuditReportModal
        isOpen={isNightAuditReportModalOpen}
        onClose={() => {
          setIsNightAuditReportModalOpen(false);
          setNightAuditReportInitialTab('summary');
        }}
        rooms={rooms}
        transactions={transactions}
        settings={settings}
        businessDate={businessDate}
        currentUser={currentUser}
        initialTab={nightAuditReportInitialTab}
        initialMonth={nightAuditReportInitialMonth}
        onUpdateExchangeRate={handleUpdateExchangeRate}
      />

      {/* Suite & Room Operations Status Report (Reports 2) */}
      <SuiteStatusReportModal
        isOpen={isSuiteStatusReportModalOpen}
        onClose={() => setIsSuiteStatusReportModalOpen(false)}
        rooms={rooms}
        settings={settings}
        businessDate={businessDate}
        currentUser={currentUser}
      />

      {/* KHR / USD Exchange Rate Manager Modal */}
      <ExchangeRateModal
        isOpen={isExchangeRateModalOpen}
        onClose={() => setIsExchangeRateModalOpen(false)}
        settings={settings}
        onUpdateExchangeRate={handleUpdateExchangeRate}
      />

      {/* User Login & Switch User Modal (Administrator / Admin1234) */}
      <UserLoginModal
        isOpen={isUserLoginModalOpen}
        onClose={() => setIsUserLoginModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

    </div>
  );
}
