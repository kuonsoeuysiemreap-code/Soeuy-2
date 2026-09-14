import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  DoorOpen, 
  FileText, 
  LogOut, 
  Edit3, 
  Sparkles, 
  Plus, 
  Info, 
  Wrench, 
  Brush, 
  AlertCircle, 
  User, 
  Mail, 
  Phone, 
  Crown, 
  Trash2,
  X,
  Search,
  Printer,
  Save,
  Maximize2,
  Minimize2,
  Filter,
  RotateCcw,
  Receipt,
  ShoppingBag,
  Users,
  Bell,
  KeyRound,
  Coins,
  MessageSquare,
  CheckCircle,
  CalendarCheck,
  ShieldCheck,
  ShieldAlert,
  Settings,
  Lock,
  AlertTriangle,
  Clock,
  ChevronDown
} from 'lucide-react';
import { Room, RoomStatus, UserSettings } from '../types';
import { formatCurrency, getAccentClasses } from '../utils/helpers';
import { ReservationEditData } from './EditReservationModal';
import { AuthUser } from './PMSActionModals';

export interface BookingBlock {
  id: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  arrivalTime?: string;
  departTime?: string;
  status: 'occupied' | 'reserved' | 'cleaning' | 'out_of_service' | 'maintenance';
  type: 'in_house' | 'guest_block' | 'mgmt_block' | 'maint_block' | 'out_of_service' | 'turnover';
  label: string;
  rate?: number;
  guestsCount?: number;
  notes?: string;
  extraBed?: boolean;
  vipStatus?: boolean;
  isFutureRes?: boolean;
}

export function parseHourFraction(timeStr?: string, fallbackHour: number = 14): number {
  if (!timeStr) return fallbackHour / 24;
  const str = String(timeStr).trim().toUpperCase();

  // Match 12hr format e.g. "02:00 PM", "2:00 PM", "11:30 AM", "2 PM"
  const ampmMatch = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const isPM = ampmMatch[3] === 'PM';
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    const frac = (hours + minutes / 60) / 24;
    return Math.min(Math.max(frac, 0), 1);
  }

  // Match 24hr format "14:00", "09:30", "14"
  const hhmmMatch = str.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (hhmmMatch) {
    const hours = parseInt(hhmmMatch[1], 10);
    const minutes = hhmmMatch[2] ? parseInt(hhmmMatch[2], 10) : 0;
    const frac = (hours + minutes / 60) / 24;
    return Math.min(Math.max(frac, 0), 1);
  }

  return fallbackHour / 24;
}

export function formatTimeDisplay(timeStr?: string, fallbackHour: number = 14): string {
  const frac = parseHourFraction(timeStr, fallbackHour);
  const totalMinutes = Math.round(frac * 24 * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

export function to24HourInput(timeStr?: string, fallbackHour: number = 14): string {
  const frac = parseHourFraction(timeStr, fallbackHour);
  const totalMinutes = Math.round(frac * 24 * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const hh = hours < 10 ? `0${hours}` : `${hours}`;
  const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hh}:${mm}`;
}

interface TapeChartRackViewProps {
  rooms: Room[];
  settings: UserSettings;
  currentUser?: AuthUser;
  businessDate?: string;
  onOpenBooking: (room?: Room, defaultCheckIn?: string) => void;
  onSelectRoom: (room: Room) => void;
  onOpenEditRoom: (room: Room) => void;
  onOpenAddRoom: () => void;
  onQuickStatusChange: (roomId: string, status: RoomStatus) => void;
  onCheckOut: (room: Room) => void;
  onViewInvoice: (room: Room, guestNameOverride?: string) => void;
  onEditReservation?: (reservation: ReservationEditData) => void;
  onCancelReservation?: (reservationId?: string, roomId?: string) => void;
  onOpenCheckIn?: () => void;
  onOpenChangeRoom?: () => void;
  onOpenAdvanceDeposit?: () => void;
  onOpenCharges?: () => void;
  onOpenMiscSales?: () => void;
  onOpenInHouse?: () => void;
  onOpenGuestAmend?: () => void;
  onOpenGuestMessages?: () => void;
  onOpenNightAudit?: () => void;
  onOpenRoomStatus?: () => void;
  onDeleteRoom?: (roomId: string, roomNumber: string) => void;
  onDirectCheckInReservation?: (roomId: string, reservationId?: string, customGuest?: any) => void;
  onCheckInAllDueArrivals?: () => void;
}

// 23 authentic WINHMS rooms from screenshot
const WINHMS_DEFAULT_ROOMS: { roomNumber: string; type: string; label: string; floor: number; rate: number }[] = [
  { roomNumber: '1', type: 'FAM', label: '1 FAM', floor: 1, rate: 220 },
  { roomNumber: '2', type: 'DLT', label: '2 DLT', floor: 1, rate: 180 },
  { roomNumber: '3', type: 'DLT', label: '3 DLT', floor: 1, rate: 180 },
  { roomNumber: '4', type: 'DLT', label: '4 DLT', floor: 1, rate: 180 },
  { roomNumber: '5', type: 'JUN', label: '5 JUN', floor: 1, rate: 240 },
  { roomNumber: '6', type: 'DLD', label: '6 DLD', floor: 1, rate: 190 },
  { roomNumber: '7', type: 'DLD', label: '7 DLD', floor: 1, rate: 190 },
  { roomNumber: '8', type: 'DLT', label: '8 DLT', floor: 1, rate: 180 },
  { roomNumber: '9', type: 'JUN', label: '9 JUN', floor: 1, rate: 240 },
  { roomNumber: '10', type: 'DLD', label: '10 DLD', floor: 2, rate: 190 },
  { roomNumber: '11', type: 'DLT', label: '11 DLT', floor: 2, rate: 180 },
  { roomNumber: '12', type: 'DLT', label: '12 DLT', floor: 2, rate: 180 },
  { roomNumber: '13', type: 'DLT', label: '13 DLT', floor: 2, rate: 180 },
  { roomNumber: '14', type: 'DLT', label: '14 DLT', floor: 2, rate: 180 },
  { roomNumber: '15', type: 'DLD', label: '15 DLD', floor: 2, rate: 190 },
  { roomNumber: '16', type: 'DLT', label: '16 DLT', floor: 2, rate: 180 },
  { roomNumber: '17', type: 'DLD', label: '17 DLD', floor: 3, rate: 190 },
  { roomNumber: '18', type: 'DLT', label: '18 DLT', floor: 3, rate: 180 },
  { roomNumber: '19', type: 'DLT', label: '19 DLT', floor: 3, rate: 180 },
  { roomNumber: '20', type: 'DLD', label: '20 DLD', floor: 3, rate: 190 },
  { roomNumber: '21', type: 'DLT', label: '21 DLT', floor: 3, rate: 180 },
  { roomNumber: '22', type: 'DLD', label: '22 DLD', floor: 3, rate: 190 },
  { roomNumber: '23', type: 'DLT', label: '23 DLT', floor: 3, rate: 180 },
];

// Exact bookings from screenshot matching 24/07/2020 through 13/08/2020
const WINHMS_DEFAULT_BLOCKS: BookingBlock[] = [
  // Room 1 FAM
  {
    id: 'win-1-1',
    roomId: 'win-rm-1',
    roomNumber: '1',
    guestName: 'ESPINOSA, PAULA',
    checkInDate: '2020-07-29',
    checkOutDate: '2020-08-03',
    status: 'reserved',
    type: 'guest_block',
    label: 'GstBlk(Mr.E SPINOSA, PAULA)',
    rate: 220,
  },
  {
    id: 'win-1-2',
    roomId: 'win-rm-1',
    roomNumber: '1',
    guestName: 'Ms.B',
    checkInDate: '2020-08-07',
    checkOutDate: '2020-08-09',
    status: 'reserved',
    type: 'guest_block',
    label: 'GstBlk(Ms.B',
    rate: 220,
  },
  // Room 3 DLT
  {
    id: 'win-3-1',
    roomId: 'win-rm-3',
    roomNumber: '3',
    guestName: 'Mrs.CH',
    checkInDate: '2020-07-24',
    checkOutDate: '2020-07-25',
    status: 'occupied',
    type: 'in_house',
    label: 'Mrs.CH',
    rate: 180,
  },
  {
    id: 'win-3-2',
    roomId: 'win-rm-3',
    roomNumber: '3',
    guestName: 'Mr.K',
    checkInDate: '2020-07-27',
    checkOutDate: '2020-07-29',
    status: 'reserved',
    type: 'guest_block',
    label: 'GstBlk(Mr.K',
    rate: 180,
  },
  {
    id: 'win-3-3',
    roomId: 'win-rm-3',
    roomNumber: '3',
    guestName: 'Ms.KAKADA..',
    checkInDate: '2020-08-05',
    checkOutDate: '2020-08-09',
    status: 'reserved',
    type: 'guest_block',
    label: 'GstBlk(Ms.KAKADA..)',
    rate: 180,
  },
  // Room 4 DLT
  {
    id: 'win-4-1',
    roomId: 'win-rm-4',
    roomNumber: '4',
    guestName: 'Mr.SOMRET..',
    checkInDate: '2020-08-01',
    checkOutDate: '2020-08-03',
    status: 'reserved',
    type: 'guest_block',
    label: 'GstBlk(Mr.SOMRET..)',
    rate: 180,
  },
  // Room 5 JUN
  {
    id: 'win-5-1',
    roomId: 'win-rm-5',
    roomNumber: '5',
    guestName: 'Mr.BA',
    checkInDate: '2020-07-24',
    checkOutDate: '2020-07-25',
    status: 'occupied',
    type: 'in_house',
    label: 'Mr.BA',
    rate: 240,
  },
  // Room 7 DLD
  {
    id: 'win-7-1',
    roomId: 'win-rm-7',
    roomNumber: '7',
    guestName: 'Mr.VA',
    checkInDate: '2020-07-24',
    checkOutDate: '2020-07-25',
    status: 'occupied',
    type: 'in_house',
    label: 'Mr.VA',
    rate: 190,
  },
  // Room 8 DLT
  {
    id: 'win-8-1',
    roomId: 'win-rm-8',
    roomNumber: '8',
    guestName: 'Mr.VA',
    checkInDate: '2020-07-24',
    checkOutDate: '2020-07-25',
    status: 'occupied',
    type: 'in_house',
    label: 'Mr.VA',
    rate: 180,
  },
  // Room 12 DLT
  {
    id: 'win-12-1',
    roomId: 'win-rm-12',
    roomNumber: '12',
    guestName: 'Mr.Sophea.',
    checkInDate: '2020-08-01',
    checkOutDate: '2020-08-03',
    status: 'reserved',
    type: 'guest_block',
    label: 'GstBlk(Mr.Sophea.)',
    rate: 180,
  },
  // Room 13 DLT (Full Span Management Block + end notch)
  {
    id: 'win-13-1',
    roomId: 'win-rm-13',
    roomNumber: '13',
    guestName: 'Management Block',
    checkInDate: '2020-07-24',
    checkOutDate: '2020-08-13',
    status: 'occupied',
    type: 'mgmt_block',
    label: 'Management Block',
    rate: 0,
  },
  {
    id: 'win-13-2',
    roomId: 'win-rm-13',
    roomNumber: '13',
    guestName: 'Block',
    checkInDate: '2020-08-13',
    checkOutDate: '2020-08-14',
    status: 'reserved',
    type: 'guest_block',
    label: '',
    rate: 180,
  },
  // Room 14 DLT
  {
    id: 'win-14-1',
    roomId: 'win-rm-14',
    roomNumber: '14',
    guestName: 'Mr.RICHARD',
    checkInDate: '2020-07-24',
    checkOutDate: '2020-07-25',
    status: 'occupied',
    type: 'in_house',
    label: 'Mr.RICHARD',
    rate: 180,
  },
  {
    id: 'win-14-2',
    roomId: 'win-rm-14',
    roomNumber: '14',
    guestName: 'Mr.LYNN, KHM',
    checkInDate: '2020-07-28',
    checkOutDate: '2020-07-30',
    status: 'reserved',
    type: 'guest_block',
    label: 'GstBlk(Mr.LYNN, KHM',
    rate: 180,
  },
  {
    id: 'win-14-3',
    roomId: 'win-rm-14',
    roomNumber: '14',
    guestName: 'Mr.SAMRETH.',
    checkInDate: '2020-08-01',
    checkOutDate: '2020-08-03',
    status: 'reserved',
    type: 'guest_block',
    label: 'GstBlk(Mr.SAMRETH.',
    rate: 180,
  },
  {
    id: 'win-14-4',
    roomId: 'win-rm-14',
    roomNumber: '14',
    guestName: 'Block',
    checkInDate: '2020-08-13',
    checkOutDate: '2020-08-14',
    status: 'reserved',
    type: 'guest_block',
    label: '',
    rate: 180,
  },
  // Room 15 DLD
  {
    id: 'win-15-1',
    roomId: 'win-rm-15',
    roomNumber: '15',
    guestName: 'Mr.BONG, SAM',
    checkInDate: '2020-07-25',
    checkOutDate: '2020-07-27',
    status: 'reserved',
    type: 'guest_block',
    label: 'GstBlk(Mr.BONG, SAM',
    rate: 190,
  },
  {
    id: 'win-15-2',
    roomId: 'win-rm-15',
    roomNumber: '15',
    guestName: 'Mr.SAMRETH.',
    checkInDate: '2020-08-01',
    checkOutDate: '2020-08-03',
    status: 'reserved',
    type: 'guest_block',
    label: 'GstBlk(Mr.SAMRETH.',
    rate: 190,
  },
  // Room 16 DLT
  {
    id: 'win-16-1',
    roomId: 'win-rm-16',
    roomNumber: '16',
    guestName: 'Block',
    checkInDate: '2020-08-13',
    checkOutDate: '2020-08-14',
    status: 'reserved',
    type: 'guest_block',
    label: '',
    rate: 180,
  },
  // Room 20 DLD
  {
    id: 'win-20-1',
    roomId: 'win-rm-20',
    roomNumber: '20',
    guestName: 'Ms.SAI',
    checkInDate: '2020-07-24',
    checkOutDate: '2020-07-25',
    status: 'occupied',
    type: 'in_house',
    label: 'Ms.SAI',
    rate: 190,
  },
  {
    id: 'win-20-2',
    roomId: 'win-rm-20',
    roomNumber: '20',
    guestName: 'Mr.SAMBATH.',
    checkInDate: '2020-07-27',
    checkOutDate: '2020-07-29',
    status: 'reserved',
    type: 'guest_block',
    label: 'GstBlk(Mr.SAMBATH.',
    rate: 190,
  },
  // Room 21 DLT
  {
    id: 'win-21-1',
    roomId: 'win-rm-21',
    roomNumber: '21',
    guestName: 'Mr.SAMBATH.',
    checkInDate: '2020-07-27',
    checkOutDate: '2020-07-29',
    status: 'reserved',
    type: 'guest_block',
    label: 'GstBlk(Mr.SAMBATH.',
    rate: 180,
  },
  // Room 22 DLD
  {
    id: 'win-22-1',
    roomId: 'win-rm-22',
    roomNumber: '22',
    guestName: 'Mr.SAMBATH.',
    checkInDate: '2020-07-27',
    checkOutDate: '2020-07-29',
    status: 'reserved',
    type: 'guest_block',
    label: 'GstBlk(Mr.SAMBATH.',
    rate: 190,
  },
  // Room 23 DLT
  {
    id: 'win-23-1',
    roomId: 'win-rm-23',
    roomNumber: '23',
    guestName: 'Mr.SAMBATH.',
    checkInDate: '2020-07-27',
    checkOutDate: '2020-07-29',
    status: 'reserved',
    type: 'guest_block',
    label: 'GstBlk(Mr.SAMBATH.',
    rate: 180,
  },
];

// Helper to get compact WINHMS-style room type abbreviation
export const getRoomTypeAbbr = (type?: string): string => {
  if (!type) return 'STD';
  const t = type.trim().toUpperCase();
  if (t === 'FAM' || t.includes('FAMILY')) return 'FAM';
  if (t === 'DLT' || t.includes('DELUXE')) return 'DLT';
  if (t === 'JUN' || t.includes('JUNIOR')) return 'JUN';
  if (t === 'DLD' || t.includes('DOUBLE')) return 'DLD';
  if (t === 'STD' || t.includes('STANDARD')) return 'STD';
  if (t === 'PRS' || t.includes('PRESIDENTIAL') || t.includes('PENTHOUSE')) return 'PRS';
  if (t === 'EXE' || t.includes('EXECUTIVE')) return 'EXE';
  if (t.includes('SUITE')) return 'STE';
  return t.length <= 4 ? t : t.slice(0, 3);
};

export const TapeChartRackView: React.FC<TapeChartRackViewProps> = ({
  rooms,
  settings,
  currentUser,
  businessDate = '2026-08-29',
  onOpenBooking,
  onSelectRoom,
  onOpenEditRoom,
  onOpenAddRoom,
  onQuickStatusChange,
  onCheckOut,
  onViewInvoice,
  onEditReservation,
  onCancelReservation,
  onOpenCheckIn,
  onOpenChangeRoom,
  onOpenAdvanceDeposit,
  onOpenCharges,
  onOpenMiscSales,
  onOpenInHouse,
  onOpenGuestAmend,
  onOpenGuestMessages,
  onOpenNightAudit,
  onOpenRoomStatus,
  onDeleteRoom,
  onDirectCheckInReservation,
  onCheckInAllDueArrivals,
}) => {
  const accent = getAccentClasses(settings.accentColor);

  // Check for pending arrivals that must be checked in before running Night Audit
  const pendingArrivals = useMemo(() => {
    return rooms.filter((r) => {
      if (r.status === 'reserved' && (!r.checkInDate || (businessDate && r.checkInDate <= businessDate))) {
        return true;
      }
      if (r.futureReservations && r.futureReservations.some((res) => businessDate ? res.checkInDate <= businessDate : false)) {
        return true;
      }
      return false;
    });
  }, [rooms, businessDate]);

  // Configurable Role Permissions for Adding Room Properties
  const [allowedAddRoomRoles, setAllowedAddRoomRoles] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hotel_pms_add_room_roles');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['Super Admin', 'General Manager', 'Front Desk Manager'];
  });

  const [isRoleConfigModalOpen, setIsRoleConfigModalOpen] = useState(false);
  const [isUnauthorizedPromptOpen, setIsUnauthorizedPromptOpen] = useState(false);
  const [tempAllowedRoles, setTempAllowedRoles] = useState<string[]>(allowedAddRoomRoles);

  const activeUserRole = currentUser?.role || 'Super Admin';
  const isUserAuthorizedToAddRoom = useMemo(() => {
    return (
      allowedAddRoomRoles.includes(activeUserRole) ||
      allowedAddRoomRoles.includes('All Staff Roles') ||
      activeUserRole === 'Super Admin'
    );
  }, [allowedAddRoomRoles, activeUserRole]);

  const handleAddRoomWithRoleCheck = () => {
    if (isUserAuthorizedToAddRoom) {
      setSavedNotification(`Authorized (${activeUserRole}) — Opening Room Card specification creator`);
      setTimeout(() => setSavedNotification(null), 3000);
      onOpenAddRoom();
    } else {
      setIsUnauthorizedPromptOpen(true);
    }
  };

  const handleSaveRolePermissions = () => {
    const rolesToSave = tempAllowedRoles.length === 0 ? ['Super Admin'] : tempAllowedRoles;
    setAllowedAddRoomRoles(rolesToSave);
    localStorage.setItem('hotel_pms_add_room_roles', JSON.stringify(rolesToSave));
    setIsRoleConfigModalOpen(false);
    setSavedNotification(`Role permissions updated: [${rolesToSave.join(', ')}] can add room properties.`);
    setTimeout(() => setSavedNotification(null), 4000);
  };
  
  // Default start date aligns directly with businessDate (starts on selected businessDate)
  const defaultStartDate = useMemo(() => {
    return businessDate || '2026-08-29';
  }, [businessDate]);

  const [startDateStr, setStartDateStr] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('hotel_pms_tapechart_start_date');
      if (saved) return saved;
    } catch {}
    return businessDate || '2026-08-29';
  });
  const [visibleDaysCount, setVisibleDaysCount] = useState<number>(21);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);
  const [warningNotification, setWarningNotification] = useState<string | null>(null);

  // User-configurable check-in and check-out default hours (e.g. 2:00 PM / 14:00 and 12:00 PM / 12:00)
  const [policyCheckInTime, setPolicyCheckInTime] = useState<string>(() => {
    try {
      return localStorage.getItem('hotel_pms_tapechart_checkin_time') || settings.checkInTime || '14:00';
    } catch {
      return '14:00';
    }
  });
  const [policyCheckOutTime, setPolicyCheckOutTime] = useState<string>(() => {
    try {
      return localStorage.getItem('hotel_pms_tapechart_checkout_time') || settings.checkOutTime || '12:00';
    } catch {
      return '12:00';
    }
  });
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);
  const [tempCheckInTime, setTempCheckInTime] = useState<string>(policyCheckInTime);
  const [tempCheckOutTime, setTempCheckOutTime] = useState<string>(policyCheckOutTime);

  useEffect(() => {
    if (isPolicyModalOpen) {
      setTempCheckInTime(to24HourInput(policyCheckInTime));
      setTempCheckOutTime(to24HourInput(policyCheckOutTime));
    }
  }, [isPolicyModalOpen, policyCheckInTime, policyCheckOutTime]);

  const handleSavePolicyHours = (newCheckIn: string, newCheckOut: string) => {
    setPolicyCheckInTime(newCheckIn);
    setPolicyCheckOutTime(newCheckOut);
    try {
      localStorage.setItem('hotel_pms_tapechart_checkin_time', newCheckIn);
      localStorage.setItem('hotel_pms_tapechart_checkout_time', newCheckOut);
    } catch {}
    setIsPolicyModalOpen(false);
    setSavedNotification(`Policy hours applied: Check-In at ${formatTimeDisplay(newCheckIn)}, Check-Out at ${formatTimeDisplay(newCheckOut)}`);
    setTimeout(() => setSavedNotification(null), 4000);
  };

  // Helper to update start date and persist user view selection
  const updateStartDate = (newDateStr: string) => {
    setStartDateStr(newDateStr);
    try {
      localStorage.setItem('hotel_pms_tapechart_start_date', newDateStr);
    } catch {}
  };

  // Filters
  const [selectedRoomType, setSelectedRoomType] = useState<string>('<ALL>');
  const [selectedFloor, setSelectedFloor] = useState<string>('<ALL>');
  const [selectedBlock, setSelectedBlock] = useState<string>('<ALL>');
  const [searchRoomNo, setSearchRoomNo] = useState<string>('');

  // Selected cell (defaults to first room from Room Cards on businessDate)
  const [selectedCell, setSelectedCell] = useState<{ roomNumber: string; dateStr: string } | null>(() => {
    const firstRoom = rooms[0];
    return {
      roomNumber: firstRoom?.roomNumber || '101',
      dateStr: businessDate || '2026-08-29',
    };
  });

  useEffect(() => {
    if (businessDate && rooms.length > 0) {
      setSelectedCell({
        roomNumber: rooms[0].roomNumber,
        dateStr: businessDate,
      });
    }
  }, [businessDate, rooms]);

  const [activeBlock, setActiveBlock] = useState<{
    block: BookingBlock;
    room: Room;
    x: number;
    y: number;
  } | null>(null);

  const [activeCellAction, setActiveCellAction] = useState<{
    room: Room;
    dateStr: string;
    dayLabel: string;
    existingBlock?: BookingBlock;
  } | null>(null);

  // 100% Synchronized from Room Cards (rooms prop)
  const effectiveRooms: Room[] = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const numA = parseInt(a.roomNumber, 10);
      const numB = parseInt(b.roomNumber, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
    });
  }, [rooms]);

  // Synchronized bookings and blocks for all rooms from Room Cards
  const effectiveBlocks: BookingBlock[] = useMemo(() => {
    const list: BookingBlock[] = [];

    rooms.forEach((r) => {
      // 1. In-house occupied room stay
      if (r.status === 'occupied' && r.guestName && r.checkInDate && r.checkOutDate) {
        list.push({
          id: `stay-${r.id}`,
          roomId: r.id,
          roomNumber: r.roomNumber,
          guestName: r.guestName,
          guestEmail: r.guestEmail,
          guestPhone: r.guestPhone,
          checkInDate: r.checkInDate,
          checkOutDate: r.checkOutDate,
          checkInTime: r.checkInTime || r.arrivalTime || policyCheckInTime,
          checkOutTime: r.checkOutTime || r.departTime || policyCheckOutTime,
          arrivalTime: r.arrivalTime || r.checkInTime || policyCheckInTime,
          departTime: r.departTime || r.checkOutTime || policyCheckOutTime,
          status: 'occupied',
          type: 'in_house',
          label: r.guestName.toUpperCase(),
          rate: r.pricePerNight,
          notes: r.notes,
        });
      }

      // 2. Active reserved guest block
      if (r.status === 'reserved' && r.guestName && r.checkInDate && r.checkOutDate) {
        list.push({
          id: `res-${r.id}`,
          roomId: r.id,
          roomNumber: r.roomNumber,
          guestName: r.guestName,
          guestEmail: r.guestEmail,
          guestPhone: r.guestPhone,
          checkInDate: r.checkInDate,
          checkOutDate: r.checkOutDate,
          checkInTime: r.checkInTime || r.arrivalTime || policyCheckInTime,
          checkOutTime: r.checkOutTime || r.departTime || policyCheckOutTime,
          arrivalTime: r.arrivalTime || r.checkInTime || policyCheckInTime,
          departTime: r.departTime || r.checkOutTime || policyCheckOutTime,
          status: 'reserved',
          type: 'guest_block',
          label: `GstBlk(${r.guestName})`,
          rate: r.pricePerNight,
          notes: r.notes,
        });
      }

      // 3. Out of service (Management block)
      if (r.status === 'out_of_service') {
        const checkIn = r.checkInDate || defaultStartDate;
        const checkOut = r.checkOutDate || '2026-09-08';
        list.push({
          id: `mgmt-${r.id}`,
          roomId: r.id,
          roomNumber: r.roomNumber,
          guestName: 'Management Block (Refurbishment)',
          checkInDate: checkIn,
          checkOutDate: checkOut,
          checkInTime: '00:00',
          checkOutTime: '23:59',
          status: 'out_of_service',
          type: 'mgmt_block',
          label: 'Mgmt.Block (Refurbishment)',
          rate: 0,
          notes: r.notes || 'Room undergoing scheduled refurbishment',
        });
      }

      // 4. Maintenance block
      if (r.status === 'maintenance') {
        const checkIn = r.checkInDate || defaultStartDate;
        const checkOut = r.checkOutDate || '2026-09-02';
        list.push({
          id: `maint-${r.id}`,
          roomId: r.id,
          roomNumber: r.roomNumber,
          guestName: 'Maintenance Block',
          checkInDate: checkIn,
          checkOutDate: checkOut,
          checkInTime: '08:00',
          checkOutTime: '17:00',
          status: 'maintenance',
          type: 'maint_block',
          label: 'Maint.Block',
          rate: 0,
          notes: r.notes || 'Scheduled maintenance service',
        });
      }

      // 5. Future reservations for this room
      if (r.futureReservations && r.futureReservations.length > 0) {
        r.futureReservations.forEach((fut) => {
          list.push({
            id: fut.id || `fut-${r.id}-${fut.checkInDate}`,
            roomId: r.id,
            roomNumber: r.roomNumber,
            guestName: fut.guestName,
            guestEmail: fut.guestEmail,
            guestPhone: fut.guestPhone,
            checkInDate: fut.checkInDate,
            checkOutDate: fut.checkOutDate,
            checkInTime: fut.checkInTime || fut.arrivalTime || policyCheckInTime,
            checkOutTime: fut.checkOutTime || fut.departTime || policyCheckOutTime,
            arrivalTime: fut.arrivalTime || fut.checkInTime || policyCheckInTime,
            departTime: fut.departTime || fut.checkOutTime || policyCheckOutTime,
            status: fut.status || 'reserved',
            type: 'guest_block',
            label: fut.label || `GstBlk(${fut.guestName})`,
            rate: fut.rate || r.pricePerNight,
            notes: fut.notes,
          });
        });
      }
    });

    return list;
  }, [rooms, defaultStartDate, policyCheckInTime, policyCheckOutTime]);

  // Dynamic available types and floors derived from Room Cards
  const availableRoomTypes = useMemo(() => {
    const set = new Set<string>();
    effectiveRooms.forEach((r) => {
      set.add(getRoomTypeAbbr(r.type));
    });
    return Array.from(set);
  }, [effectiveRooms]);

  const availableFloors = useMemo(() => {
    const set = new Set<number>();
    effectiveRooms.forEach((r) => {
      if (r.floor !== undefined) {
        set.add(r.floor);
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [effectiveRooms]);

  // Filtered rooms based on toolbar controls
  const filteredRooms = useMemo(() => {
    return effectiveRooms.filter((r) => {
      const abbr = getRoomTypeAbbr(r.type);
      if (selectedRoomType !== '<ALL>' && abbr !== selectedRoomType && !r.type.toUpperCase().includes(selectedRoomType)) {
        return false;
      }
      if (selectedFloor !== '<ALL>' && String(r.floor) !== selectedFloor) {
        return false;
      }
      if (searchRoomNo.trim() !== '' && !r.roomNumber.toLowerCase().includes(searchRoomNo.toLowerCase().trim())) {
        return false;
      }
      return true;
    });
  }, [effectiveRooms, selectedRoomType, selectedFloor, searchRoomNo]);

  // Calendar Days calculation (21 days starting from startDateStr)
  const calendarDays = useMemo(() => {
    const days: { 
      date: Date; 
      dateStr: string; 
      dayLabel: string; 
      headerDateStr: string; 
      isSunday: boolean;
      isToday: boolean;
      isPast: boolean;
    }[] = [];
    
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const parts = startDateStr.split('-');
    const baseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    
    for (let i = 0; i < visibleDaysCount; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const headerDateStr = `${dd}/${mm}/${String(yyyy).slice(2)}`;
      const dayLabel = weekdays[d.getDay()];
      const isSunday = d.getDay() === 0;
      const isPast = Boolean(businessDate && dateStr < businessDate);
      
      days.push({
        date: d,
        dateStr,
        dayLabel,
        headerDateStr,
        isSunday,
        isToday: dateStr === businessDate,
        isPast,
      });
    }
    return days;
  }, [startDateStr, visibleDaysCount, businessDate]);

  // Handle Save
  const handleSave = () => {
    setSavedNotification('Tape Chart layout and allocations saved.');
    setTimeout(() => setSavedNotification(null), 3000);
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  const handlePrevDay = () => {
    const d = new Date(startDateStr);
    d.setDate(d.getDate() - 1);
    updateStartDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(startDateStr);
    d.setDate(d.getDate() + 1);
    updateStartDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className={`w-full flex-1 flex flex-col select-none ${isFullscreen ? 'fixed inset-0 z-50 bg-[#e4dfcf] p-2 overflow-auto' : ''}`}>

      {/* Tape Chart Parameter Bar & Controls */}
      <div className="w-full bg-[#ece9d8] border-b border-[#7f9db9] px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Room Type */}
          <div className="flex items-center gap-1">
            <span className="font-semibold text-neutral-800">Room Type</span>
            <select
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
              className="bg-white border border-[#7f9db9] px-1 py-0.5 text-xs text-neutral-900 font-sans cursor-pointer"
            >
              <option value="<ALL>">&lt;ALL&gt;</option>
              {availableRoomTypes.map((t) => (
                <option key={`type-opt-${t}`} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Floor */}
          <div className="flex items-center gap-1">
            <span className="font-semibold text-neutral-800">Floor</span>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="bg-white border border-[#7f9db9] px-1 py-0.5 text-xs text-neutral-900 font-sans cursor-pointer"
            >
              <option value="<ALL>">&lt;ALL&gt;</option>
              {availableFloors.map((f) => (
                <option key={`floor-opt-${f}`} value={String(f)}>Floor {f}</option>
              ))}
            </select>
          </div>

          {/* Block */}
          <div className="flex items-center gap-1">
            <span className="font-semibold text-neutral-800">Block</span>
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="bg-white border border-[#7f9db9] px-1 py-0.5 text-xs text-neutral-900 font-sans cursor-pointer"
            >
              <option value="<ALL>">&lt;ALL&gt;</option>
              <option value="GUEST">Guest Block</option>
              <option value="MGMT">Mgmt.Block</option>
              <option value="MAINT">Maint.Block</option>
            </select>
          </div>

          {/* Room No Search */}
          <div className="flex items-center gap-1">
            <span className="font-semibold text-neutral-800">Room No</span>
            <div className="flex items-center bg-white border border-[#7f9db9]">
              <input
                type="text"
                value={searchRoomNo}
                onChange={(e) => setSearchRoomNo(e.target.value)}
                placeholder=""
                className="w-16 px-1 py-0.5 text-xs font-mono focus:outline-none"
              />
              <button
                type="button"
                className="p-1 hover:bg-neutral-100 text-neutral-600 border-l border-[#7f9db9] cursor-pointer"
                title="Search Room"
              >
                <Search className="h-3 w-3 text-neutral-700" />
              </button>
            </div>
            
            <button
              type="button"
              className="p-1 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-[#a09a8a] text-blue-700 rounded-xs cursor-pointer ml-1"
              title="Filter"
            >
              <Filter className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Center: Title & Date Span */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-base text-neutral-900 tracking-wide font-sans">
            Tape Chart
          </span>

          {businessDate && (
            <button
              type="button"
              onClick={() => updateStartDate(businessDate)}
              className="flex items-center gap-1 px-2 py-0.5 bg-[#fef3c7] hover:bg-[#fde68a] border border-amber-500 rounded-2xs text-[11px] font-bold text-amber-950 shadow-2xs cursor-pointer transition-colors"
              title={`Hotel Business Date: ${businessDate} - Click to center view`}
            >
              <span className="text-amber-700">★</span>
              <span>Business Date: <strong>{businessDate}</strong></span>
            </button>
          )}
          
          <div className="flex items-center gap-1 ml-1">
            <span className="font-semibold text-neutral-800">Start Date</span>
            <button
              type="button"
              onClick={handlePrevDay}
              className="px-1.5 py-0.5 bg-white hover:bg-[#ded9c8] border border-[#7f9db9] text-neutral-800 font-bold text-xs cursor-pointer"
              title="Previous Day"
            >
              &lt;
            </button>
            <input
              type="date"
              value={startDateStr}
              onChange={(e) => e.target.value && updateStartDate(e.target.value)}
              className="bg-white border border-[#7f9db9] px-1 py-0.5 text-xs font-mono cursor-pointer"
            />
            <button
              type="button"
              onClick={handleNextDay}
              className="px-1.5 py-0.5 bg-white hover:bg-[#ded9c8] border border-[#7f9db9] text-neutral-800 font-bold text-xs cursor-pointer"
              title="Next Day"
            >
              &gt;
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-semibold text-neutral-800">Display</span>
            <div className="flex items-center bg-white border border-[#7f9db9]">
              <input
                type="number"
                min="7"
                max="31"
                value={visibleDaysCount}
                onChange={(e) => setVisibleDaysCount(Math.max(7, Math.min(31, parseInt(e.target.value, 10) || 21)))}
                className="w-10 px-1 py-0.5 text-xs text-center font-mono focus:outline-none"
              />
              <span className="px-1 text-[11px] text-neutral-600 border-l border-[#7f9db9]">Days</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              updateStartDate(defaultStartDate);
              setVisibleDaysCount(21);
              setSelectedRoomType('<ALL>');
              setSelectedFloor('<ALL>');
              setSelectedBlock('<ALL>');
              setSearchRoomNo('');
            }}
            className="p-1 hover:bg-[#d8d4c4] border border-[#a09a8a] bg-[#ece9d8] text-green-700 rounded-xs cursor-pointer"
            title="Reset & Sync to Hotel Business Date (21 Days)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right: Legend Box & Actions */}
        <div className="flex items-center gap-3">
          
          {/* Legend Grid Box */}
          <div className="border border-[#7f9db9] bg-[#f7f5ea] p-1 grid grid-cols-3 gap-x-2 gap-y-0.5 text-[11px] leading-tight">
            <div className="flex items-center gap-1">
              <span className="h-3 w-4 bg-[#cc1a1a] border border-red-950 inline-block shadow-2xs"></span>
              <span className="text-neutral-900 font-medium">Occupied</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-3 w-4 bg-[#80deea] border border-cyan-800 inline-block shadow-2xs"></span>
              <span className="text-neutral-900 font-medium">Mgmt.Block</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-3 w-4 bg-[#b388ff] border border-purple-900 inline-block shadow-2xs"></span>
              <span className="text-neutral-900 font-medium">Guest Block</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-3 w-4 bg-[#ffcc80] border border-amber-800 inline-block shadow-2xs"></span>
              <span className="text-neutral-900 font-medium">Maint.Block</span>
            </div>
            <div className="flex items-center gap-1 col-span-2">
              <span className="h-3 w-4 bg-[#e5e0d3] border border-[#a09a8a] inline-block shadow-2xs" style={{ filter: 'blur(0.3px)' }}></span>
              <span className="text-neutral-600 font-medium">Past &lt; Business Date (Low Blur / Locked)</span>
            </div>
          </div>

          {/* Check-In / Check-Out Policy Hours Button */}
          <button
            type="button"
            onClick={() => setIsPolicyModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#fffde7] hover:bg-[#fff9c4] border border-[#d4af37] text-neutral-900 rounded-2xs text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
            title="Configure Hotel Check-In (e.g. 2:00 PM) & Check-Out (e.g. 12:00 PM) Policy Hours for Tape Chart"
          >
            <Clock className="h-3.5 w-3.5 text-amber-700 shrink-0" />
            <span className="text-[11px] font-sans">
              Hours: In <strong>{formatTimeDisplay(policyCheckInTime)}</strong> / Out <strong>{formatTimeDisplay(policyCheckOutTime)}</strong>
            </span>
            <span className="text-[10px] text-blue-700 underline font-normal ml-0.5">Edit</span>
          </button>

          {/* Add New Room Property & Save / Print Buttons */}
          <div className="flex items-center gap-1">
            <button
              id="btn-tape-add-new-room-property"
              type="button"
              onClick={handleAddRoomWithRoleCheck}
              style={{ display: 'none' }}
              className="hidden"
              title={`Add New Room Property to Inventory (Authorized Roles: ${allowedAddRoomRoles.join(', ')}) — Creates a new room specification. Not for changing existing room details.`}
            >
              <Plus className="h-3.5 w-3.5 text-emerald-200 stroke-[3] shrink-0" />
              <span className="tracking-tight">+ Add New Room Property</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setTempAllowedRoles([...allowedAddRoomRoles]);
                  setIsRoleConfigModalOpen(true);
                }}
                className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 bg-black/30 hover:bg-black/45 border border-emerald-300/40 text-emerald-100 rounded-2xs text-[9.5px] font-mono font-bold tracking-tight cursor-pointer transition-colors shadow-2xs"
                title="Click to Configure which Roles can Add New Room Properties"
              >
                <ShieldCheck className="h-2.5 w-2.5 text-emerald-300 shrink-0" />
                <span>Role: {allowedAddRoomRoles.includes('All Staff Roles') ? 'All' : (allowedAddRoomRoles.length <= 2 ? allowedAddRoomRoles.join('/') : 'Admin/Mgr')}</span>
                <Settings className="h-2.5 w-2.5 text-emerald-200/80 hover:text-white shrink-0 ml-0.5" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTempAllowedRoles([...allowedAddRoomRoles]);
                setIsRoleConfigModalOpen(true);
              }}
              style={{ display: 'none' }}
              className="hidden"
              title="Set Role Permissions for Adding Room Properties"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-blue-900 shrink-0" />
              <span>Set Role</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{ display: 'none' }}
              className="hidden"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handlePrint}
              style={{ display: 'none' }}
              className="hidden"
            >
              Print
            </button>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{ display: 'none' }}
              className="hidden"
              title="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Pre-Night Audit Rule Notification: All Rooms Must Be Checked In From Chart */}
      {pendingArrivals.length > 0 && (
        <div className="bg-[#fffbeb] border-b border-amber-400 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950 font-sans shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              <strong>Pre-Night Audit Rule:</strong> <strong>{pendingArrivals.length}</strong> room{pendingArrivals.length > 1 ? 's' : ''} ({pendingArrivals.map((p) => `#${p.roomNumber}`).join(', ')}) scheduled for arrival on or before business date (<strong>{businessDate}</strong>) must be checked in from the chart before running Night Audit.
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onCheckInAllDueArrivals && (
              <button
                type="button"
                onClick={() => {
                  onCheckInAllDueArrivals();
                  setSavedNotification(`✓ All ${pendingArrivals.length} pending room(s) checked in successfully from Tape Chart.`);
                  setTimeout(() => setSavedNotification(null), 4000);
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xs cursor-pointer text-xs shadow-xs transition-colors"
                title="Check in all rooms scheduled for today immediately"
              >
                <DoorOpen className="h-3.5 w-3.5" />
                <span>Check In All Rooms from Chart Now</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Save Notification */}
      {savedNotification && (
        <div className="bg-emerald-100 border border-emerald-400 text-emerald-800 px-3 py-1 text-xs font-semibold rounded-xs shadow-xs">
          ✓ {savedNotification}
        </div>
      )}

      {/* Warning Notification for Past Business Date Restriction */}
      {warningNotification && (
        <div className="bg-amber-100 border border-amber-400 text-amber-900 px-3 py-1.5 text-xs font-semibold rounded-xs shadow-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
            <span>{warningNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setWarningNotification(null)}
            className="text-amber-800 hover:text-amber-950 font-bold ml-2 cursor-pointer text-sm leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* 5. Main Tape Chart Grid (Exact visual replica of the picture) */}
      <div className="w-full border-b border-[#7f9db9] bg-[#fbf9f1] shadow-xs overflow-x-auto overflow-y-auto max-h-[calc(100vh-170px)]">
        <table 
          className="border-collapse text-left w-full"
          style={{ minWidth: `${90 + visibleDaysCount * 60}px` }}
        >
          <thead>
            {/* Top Date Numbers Row */}
            <tr className="border-b border-[#a09a8a] text-center font-mono text-[11px] font-bold">
              
              {/* Top-Left Corner Header: "Room# Ty" */}
              <th 
                rowSpan={2}
                className="w-24 min-w-[90px] p-1 bg-[#dfd9cb] border-r border-[#a09a8a] text-neutral-900 font-bold font-sans text-xs select-none tracking-tight shadow-xs"
                title="Room Column: Synchronized from Room Cards. Room numbers are protected from inline modification."
              >
                <div className="flex items-center justify-between px-1">
                  <span className="font-bold">Room#</span>
                  <span className="text-neutral-950 font-black text-[10px] uppercase tracking-wider bg-[#d0caba] px-1 rounded-2xs">Ty</span>
                </div>
              </th>

              {/* 21 Day Headers */}
              {calendarDays.map((day) => {
                const isSelectedStart = day.dateStr === startDateStr;
                const isSelectedCol = selectedCell?.dateStr === day.dateStr;

                return (
                  <th
                    key={`day-header-${day.dateStr}`}
                    onClick={() => {
                      updateStartDate(day.dateStr);
                      setSelectedCell((prev) => ({
                        roomNumber: prev?.roomNumber || rooms[0]?.roomNumber || '101',
                        dateStr: day.dateStr,
                      }));
                    }}
                    className={`p-1 border-r border-[#a09a8a] font-mono text-[11px] leading-tight select-none transition-all cursor-pointer hover:brightness-95 ${
                      isSelectedStart
                        ? 'ring-2 ring-inset ring-blue-700 font-black shadow-inner z-10'
                        : isSelectedCol
                        ? 'ring-1 ring-inset ring-blue-500 font-bold'
                        : ''
                    } ${
                      day.isToday
                        ? 'bg-[#ffe082] text-amber-950 font-black ring-1 ring-inset ring-amber-500'
                        : day.isPast
                        ? 'bg-[#ded8cb] text-neutral-500'
                        : day.isSunday
                        ? 'bg-[#d32f2f] text-white font-black'
                        : 'bg-[#ded9cb] text-neutral-900'
                    }`}
                    style={{
                      width: `${100 / visibleDaysCount}%`,
                      minWidth: '58px',
                    }}
                    title={`Date: ${day.headerDateStr} (${day.dayLabel})${
                      day.isToday ? ' - Hotel Business Date' : day.isPast ? ' - Past Date (Closed)' : ''
                    } • Click to keep view starting from this date`}
                  >
                    <div className="font-bold flex items-center justify-center gap-0.5">
                      {day.headerDateStr}
                    </div>
                    <div className={`text-[10px] uppercase font-bold ${
                      day.isToday
                        ? 'text-amber-900'
                        : day.isPast
                        ? 'text-neutral-500'
                        : day.isSunday
                        ? 'text-white'
                        : 'text-neutral-800'
                    }`}>
                      {day.dayLabel} {day.isToday ? '★' : day.isPast ? '🔒' : ''}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#c8c2b2] text-xs">
            {filteredRooms.map((room) => {
              const blocks = effectiveBlocks.filter((b) => b.roomNumber === room.roomNumber);

              return (
                <tr key={`room-row-${room.id}`} className="hover:bg-[#f3efdf] transition-colors h-7 min-h-[28px]">
                  
                  {/* Left Column: "Room# Ty" (Synchronized from Room Cards - fully modifiable & deletable) */}
                  <td 
                    className="p-1 px-2 border-r border-[#a09a8a] bg-[#ebe7db] font-mono font-bold text-neutral-900 text-[11px] whitespace-nowrap select-none transition-colors group/roomcell"
                    title={`Room #${room.roomNumber} (${room.type}, Floor ${room.floor}) • Click to Modify, or use Edit/Delete actions`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenEditRoom(room)}
                        className="font-bold text-neutral-950 text-xs tracking-tight hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
                        title={`Modify Room #${room.roomNumber} specifications`}
                      >
                        <span>{room.roomNumber}</span>
                      </button>
                      
                      <div className="flex items-center gap-1">
                        <span className="font-sans font-bold text-[9px] px-1 py-0.5 bg-[#dad4c4] border border-[#beb7a5] rounded-xs text-neutral-800 tracking-wider">
                          {getRoomTypeAbbr(room.type)}
                        </span>

                        {/* Quick Check-In Button for Pending Arrivals */}
                        {(() => {
                          const dueRes = room.futureReservations?.find((fr) => businessDate ? fr.checkInDate <= businessDate : true);
                          const isPending = (room.status === 'reserved' && (!room.checkInDate || (businessDate && room.checkInDate <= businessDate))) || !!dueRes;
                          if (!isPending) return null;
                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDirectCheckInReservation) {
                                  onDirectCheckInReservation(room.id, dueRes?.id, {
                                    guestName: dueRes?.guestName || room.guestName || 'In-House Guest',
                                    guestEmail: dueRes?.guestEmail || room.guestEmail,
                                    guestPhone: dueRes?.guestPhone || room.guestPhone,
                                    checkInDate: dueRes?.checkInDate || businessDate,
                                    checkOutDate: dueRes?.checkOutDate || room.checkOutDate || '2026-09-02',
                                    rate: dueRes?.rate || room.pricePerNight,
                                  });
                                  setSavedNotification(`✓ Room #${room.roomNumber} Checked In: ${dueRes?.guestName || room.guestName} is now in-house.`);
                                  setTimeout(() => setSavedNotification(null), 4000);
                                } else {
                                  onOpenBooking(room, dueRes?.checkInDate || businessDate);
                                }
                              }}
                              className="px-1 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[8.5px] rounded-2xs cursor-pointer shadow-2xs transition-colors shrink-0 tracking-tight"
                              title={`Check in Room #${room.roomNumber} immediately (${dueRes?.guestName || room.guestName || 'Pending Guest'})`}
                            >
                              Check In
                            </button>
                          );
                        })()}
                        
                        {/* Quick action icons visible on row/cell hover */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/roomcell:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenEditRoom(room);
                            }}
                            className="p-0.5 hover:bg-neutral-300 text-blue-700 rounded-xs cursor-pointer"
                            title={`Modify Room #${room.roomNumber}`}
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          {onDeleteRoom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteRoom(room.id, room.roomNumber);
                              }}
                              className="p-0.5 hover:bg-rose-200 text-rose-700 rounded-xs cursor-pointer"
                              title={`Delete Room #${room.roomNumber}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 21 Date Grid Cells */}
                  {calendarDays.map((day) => {
                    const isSelected =
                      selectedCell?.roomNumber === room.roomNumber &&
                      selectedCell?.dateStr === day.dateStr;

                    // Find all blocks that touch this day (including checkout day up to departure time and checkin day from arrival time)
                    const dayBlocks = blocks.filter((b) => {
                      if (b.checkInDate === b.checkOutDate) {
                        return day.dateStr === b.checkInDate;
                      }
                      return day.dateStr >= b.checkInDate && day.dateStr <= b.checkOutDate;
                    });

                    const primaryBlock = dayBlocks[0];

                    return (
                      <td
                        key={`cell-${room.id}-${day.dateStr}`}
                        onClick={() => {
                          setSelectedCell({ roomNumber: room.roomNumber, dateStr: day.dateStr });
                          if (day.isPast && dayBlocks.length === 0) {
                            setWarningNotification(`Date ${day.headerDateStr} is before hotel business date (${businessDate}). Adding reservations is prohibited for past dates.`);
                            setTimeout(() => setWarningNotification(null), 4000);
                          }
                        }}
                        onDoubleClick={() => {
                          setSelectedCell({ roomNumber: room.roomNumber, dateStr: day.dateStr });
                          if (primaryBlock) {
                            setActiveBlock({
                              block: primaryBlock,
                              room,
                              x: 0,
                              y: 0,
                            });
                          } else {
                            if (day.isPast) {
                              setWarningNotification(`Cannot add reservations before business date (${businessDate}). Date ${day.headerDateStr} is closed.`);
                              setTimeout(() => setWarningNotification(null), 4000);
                              return;
                            }
                            onOpenBooking(room, day.dateStr);
                          }
                        }}
                        className={`relative p-0 border-r border-[#c8c2b2] h-7 min-h-[28px] transition-all overflow-hidden ${
                          day.isPast
                            ? 'bg-[#f0ece1] opacity-75 cursor-not-allowed select-none'
                            : day.isSunday
                            ? 'bg-[#faf6ee] hover:bg-[#fff9e6] cursor-pointer'
                            : 'bg-[#fcfaf4] hover:bg-[#fff9e6] cursor-pointer'
                        }`}
                        style={day.isPast ? { filter: 'blur(0.3px)' } : undefined}
                        title={
                          primaryBlock
                            ? `Double-click to view reservation: ${primaryBlock.guestName || primaryBlock.label} (${primaryBlock.checkInDate} ${formatTimeDisplay(primaryBlock.checkInTime || policyCheckInTime)} → ${primaryBlock.checkOutDate} ${formatTimeDisplay(primaryBlock.checkOutTime || policyCheckOutTime)})`
                            : day.isPast
                            ? `Closed Date: ${day.headerDateStr} is before business date (${businessDate}). Adding reservations is blocked.`
                            : `Double-click to make reservation for Room #${room.roomNumber} on ${day.dateStr} (Check-in ${formatTimeDisplay(policyCheckInTime)})`
                        }
                      >
                        {/* Authentic Selection Rectangle */}
                        {isSelected && (
                          <div className="absolute inset-0 border-2 border-black z-20 pointer-events-none"></div>
                        )}

                        {/* Stays & Booking Block Hourly Render */}
                        {dayBlocks.map((blk) => {
                          const bInTime = blk.checkInTime || blk.arrivalTime || policyCheckInTime;
                          const bOutTime = blk.checkOutTime || blk.departTime || policyCheckOutTime;
                          const inFrac = parseHourFraction(bInTime, 14);
                          const outFrac = parseHourFraction(bOutTime, 12);

                          let startFrac = 0.0;
                          let endFrac = 1.0;
                          const isCheckInDay = day.dateStr === blk.checkInDate;
                          const isCheckOutDay = day.dateStr === blk.checkOutDate;

                          if (isCheckInDay && isCheckOutDay) {
                            startFrac = inFrac;
                            endFrac = Math.max(startFrac + 0.12, outFrac);
                          } else if (isCheckInDay) {
                            startFrac = inFrac;
                            endFrac = 1.0;
                          } else if (isCheckOutDay) {
                            startFrac = 0.0;
                            endFrac = outFrac;
                          } else {
                            startFrac = 0.0;
                            endFrac = 1.0;
                          }

                          // Avoid rendering zero-width slivers
                          if (endFrac <= startFrac) return null;
                          if (isCheckOutDay && !isCheckInDay && endFrac <= 0.02) return null;
                          if (isCheckInDay && !isCheckOutDay && startFrac >= 0.98) return null;

                          const leftPct = Math.max(0, Math.min(100, Math.round(startFrac * 1000) / 10));
                          const widthPct = Math.max(4, Math.min(100 - leftPct, Math.round((endFrac - startFrac) * 1000) / 10));
                          const isStartDay = isCheckInDay || day.dateStr === calendarDays[0].dateStr;

                          return (
                            <div
                              key={`blk-${blk.id}-${day.dateStr}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCell({ roomNumber: room.roomNumber, dateStr: day.dateStr });
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                setActiveBlock({
                                  block: blk,
                                  room,
                                  x: rect.left,
                                  y: rect.bottom + 4,
                                });
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setSelectedCell({ roomNumber: room.roomNumber, dateStr: day.dateStr });
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                setActiveBlock({
                                  block: blk,
                                  room,
                                  x: rect.left,
                                  y: rect.bottom + 4,
                                });
                              }}
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                              }}
                              className={`absolute inset-y-0.5 flex items-center px-1 z-10 text-[10.5px] font-sans font-bold select-none cursor-pointer overflow-hidden transition-shadow hover:brightness-105 ${
                                blk.type === 'in_house'
                                  ? 'bg-[#cc1a1a] text-white'
                                  : blk.type === 'mgmt_block'
                                  ? 'bg-[#80deea] text-[#004d40] border-y border-cyan-700'
                                  : blk.type === 'maint_block'
                                  ? 'bg-[#ffcc80] text-amber-950 border-y border-amber-800'
                                  : 'bg-[#b388ff] text-neutral-900'
                              } ${
                                isCheckOutDay
                                  ? 'border-r-2 border-[#cc1a1a] shadow-xs'
                                  : ''
                              } ${
                                isCheckInDay
                                  ? 'border-l border-neutral-900/40'
                                  : ''
                              } ${day.isPast ? 'opacity-85' : ''}`}
                              title={`${blk.label || blk.guestName} (${blk.type.replace('_', ' ').toUpperCase()})
Room #${room.roomNumber} - ${room.type}
Check-In: ${blk.checkInDate} @ ${formatTimeDisplay(bInTime)}
Check-Out: ${blk.checkOutDate} @ ${formatTimeDisplay(bOutTime)}
Rate: ${formatCurrency(blk.rate || room.pricePerNight, settings.currency.symbol)}/night
Double-click to view details, amend, or check-in`}
                            >
                              {/* Display Label on start day or beginning of view */}
                              {isStartDay && (
                                <span className="truncate whitespace-nowrap font-mono text-[10px] tracking-tight leading-none">
                                  {blk.label || blk.guestName}
                                </span>
                              )}
                              {/* If checkout slice is wide enough, show departure time indicator */}
                              {!isStartDay && isCheckOutDay && widthPct >= 35 && (
                                <span className="truncate whitespace-nowrap font-mono text-[9px] font-semibold text-neutral-800 opacity-90 leading-none">
                                  ↳ {formatTimeDisplay(bOutTime)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cell Booking / Action Modal */}
      {activeCellAction && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setActiveCellAction(null)}
        >
          <div 
            className="w-full max-w-md bg-[#ece9d8] border-2 border-[#7f9db9] p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#a09a8a] pb-2">
              <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <span>Room #{activeCellAction.room.roomNumber} ({activeCellAction.room.type})</span>
                <span className="font-mono text-xs px-1.5 py-0.5 bg-white border border-[#7f9db9]">
                  {activeCellAction.dateStr} ({activeCellAction.dayLabel})
                </span>
              </h4>
              <button 
                onClick={() => setActiveCellAction(null)} 
                className="text-neutral-700 hover:text-black font-bold px-1.5"
              >
                ✕
              </button>
            </div>

            <div className="bg-white border border-[#7f9db9] p-2.5 text-xs space-y-1">
              <p className="text-neutral-800">
                Rate: <strong>{formatCurrency(activeCellAction.room.pricePerNight, settings.currency.symbol)} / night</strong>
              </p>
              <p className="text-neutral-600">
                {businessDate && activeCellAction.dateStr < businessDate 
                  ? 'Past date before business date. Reservations are closed.' 
                  : 'Ready for check-in or reservation for selected date.'}
              </p>
            </div>

            {businessDate && activeCellAction.dateStr < businessDate && (
              <div className="bg-amber-100 border border-amber-400 p-2 text-xs text-amber-900 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                <span>Date {activeCellAction.dateStr} is before hotel business date ({businessDate}). Adding reservations is prohibited.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={Boolean(businessDate && activeCellAction.dateStr < businessDate)}
                onClick={() => {
                  if (businessDate && activeCellAction.dateStr < businessDate) return;
                  setActiveCellAction(null);
                  onOpenBooking(activeCellAction.room, activeCellAction.dateStr);
                }}
                className={`col-span-2 flex items-center justify-center gap-1.5 p-2.5 font-bold text-xs rounded-xs shadow-xs ${
                  businessDate && activeCellAction.dateStr < businessDate
                    ? 'bg-neutral-400 text-neutral-200 cursor-not-allowed'
                    : 'bg-[#2e7d32] hover:bg-[#1b5e20] text-white cursor-pointer'
                }`}
              >
                {businessDate && activeCellAction.dateStr < businessDate ? (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Closed — Before Business Date</span>
                  </>
                ) : (
                  <>
                    <DoorOpen className="h-4 w-4" />
                    <span>Reserve / Book</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetRoom = activeCellAction.room;
                  setActiveCellAction(null);
                  onOpenEditRoom(targetRoom);
                }}
                className={`flex items-center justify-center gap-1.5 p-2 bg-[#1976d2] hover:bg-[#1565c0] text-white font-bold text-xs rounded-xs cursor-pointer shadow-xs ${!onDeleteRoom ? 'col-span-2' : ''}`}
                title="Modify Room Specifications"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Modify Room</span>
              </button>

              {onDeleteRoom && (
                <button
                  type="button"
                  onClick={() => {
                    const targetRoom = activeCellAction.room;
                    setActiveCellAction(null);
                    onDeleteRoom(targetRoom.id, targetRoom.roomNumber);
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold text-xs rounded-xs cursor-pointer shadow-xs"
                  title="Delete Room Property from Inventory"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Room</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Block Details / Actions Modal */}
      {activeBlock && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setActiveBlock(null)}
        >
          <div 
            className="w-full max-w-md bg-[#ece9d8] border-2 border-[#7f9db9] p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#a09a8a] pb-2">
              <div className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-xs flex items-center justify-center text-xs font-bold ${
                  activeBlock.block.type === 'in_house' ? 'bg-red-600 text-white' : 'bg-purple-600 text-white'
                }`}>
                  {activeBlock.room.roomNumber}
                </div>
                <h4 className="font-bold text-sm text-neutral-900">
                  {activeBlock.block.guestName}
                </h4>
              </div>
              <button 
                onClick={() => setActiveBlock(null)} 
                className="text-neutral-700 hover:text-black font-bold px-1.5"
              >
                ✕
              </button>
            </div>

            <div className="bg-white border border-[#7f9db9] p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Block Tag:</span>
                <span className="font-mono font-bold text-neutral-900">{activeBlock.block.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Dates:</span>
                <span className="font-mono font-semibold text-neutral-900">
                  {activeBlock.block.checkInDate} → {activeBlock.block.checkOutDate}
                </span>
              </div>
              <div className="flex justify-between items-center bg-[#f0f9ff] px-2 py-1 border border-sky-200 rounded-2xs">
                <span className="text-sky-900 font-semibold flex items-center gap-1">
                  <Clock className="h-3 w-3 text-sky-700" />
                  Check-In:
                </span>
                <span className="font-mono font-bold text-sky-950">
                  {formatTimeDisplay(activeBlock.block.checkInTime || activeBlock.block.arrivalTime || policyCheckInTime)}
                </span>
              </div>
              <div className="flex justify-between items-center bg-[#fefce8] px-2 py-1 border border-amber-200 rounded-2xs">
                <span className="text-amber-900 font-semibold flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-700" />
                  Check-Out:
                </span>
                <span className="font-mono font-bold text-amber-950">
                  {formatTimeDisplay(activeBlock.block.checkOutTime || activeBlock.block.departTime || policyCheckOutTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Type:</span>
                <span className="uppercase font-bold text-neutral-800">{activeBlock.block.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Rate:</span>
                <span className="font-mono font-bold text-neutral-900">
                  {formatCurrency(activeBlock.block.rate || activeBlock.room.pricePerNight, settings.currency.symbol)} / night
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {onEditReservation && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveBlock(null);
                    onEditReservation({
                      id: activeBlock.block.id,
                      roomId: activeBlock.room.id,
                      roomNumber: activeBlock.room.roomNumber,
                      guestName: activeBlock.block.guestName,
                      checkInDate: activeBlock.block.checkInDate,
                      checkOutDate: activeBlock.block.checkOutDate,
                      checkInTime: activeBlock.block.checkInTime || activeBlock.block.arrivalTime || policyCheckInTime,
                      checkOutTime: activeBlock.block.checkOutTime || activeBlock.block.departTime || policyCheckOutTime,
                      arrivalTime: activeBlock.block.checkInTime || activeBlock.block.arrivalTime || policyCheckInTime,
                      departTime: activeBlock.block.checkOutTime || activeBlock.block.departTime || policyCheckOutTime,
                      rate: activeBlock.block.rate || activeBlock.room.pricePerNight,
                      guestsCount: 2,
                      paymentMethod: 'Cash',
                      isCurrentStay: activeBlock.block.type === 'in_house',
                    });
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 bg-[#3f51b5] hover:bg-[#303f9f] text-white font-bold text-xs rounded-xs cursor-pointer shadow-xs"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Amend Gst</span>
                </button>
              )}

              {activeBlock.block.type === 'in_house' ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveBlock(null);
                    onCheckOut(activeBlock.room);
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 bg-[#c62828] hover:bg-[#b71c1c] text-white font-bold text-xs rounded-xs cursor-pointer shadow-xs"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Check Out</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      const blk = activeBlock.block;
                      const rm = activeBlock.room;
                      setActiveBlock(null);
                      if (onDirectCheckInReservation) {
                        onDirectCheckInReservation(rm.id, blk.id, {
                          guestName: blk.guestName,
                          guestEmail: blk.guestEmail,
                          guestPhone: blk.guestPhone,
                          checkInDate: blk.checkInDate,
                          checkOutDate: blk.checkOutDate,
                          checkInTime: blk.checkInTime || blk.arrivalTime || policyCheckInTime,
                          checkOutTime: blk.checkOutTime || blk.departTime || policyCheckOutTime,
                          arrivalTime: blk.checkInTime || blk.arrivalTime || policyCheckInTime,
                          departTime: blk.checkOutTime || blk.departTime || policyCheckOutTime,
                          rate: blk.rate || rm.pricePerNight,
                        });
                        setSavedNotification(`✓ Room #${rm.roomNumber} Checked In: ${blk.guestName} is now in-house.`);
                        setTimeout(() => setSavedNotification(null), 4000);
                      } else {
                        onOpenBooking(rm, blk.checkInDate);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-bold text-xs rounded-xs cursor-pointer shadow-xs transition-colors"
                    title={`Check In Guest ${activeBlock.block.guestName} immediately`}
                  >
                    <DoorOpen className="h-4 w-4" />
                    <span>Check In (Room #{activeBlock.room.roomNumber})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const blk = activeBlock.block;
                      const rm = activeBlock.room;
                      setActiveBlock(null);
                      onOpenBooking(rm, blk.checkInDate);
                    }}
                    className="px-2.5 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold text-xs rounded-xs cursor-pointer border border-[#7f9db9]"
                    title="Open full booking form to review or change rates/guest details"
                  >
                    Details
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WINHMS Role Permission Setup Modal for Adding Room Property */}
      {isRoleConfigModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setIsRoleConfigModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-[#ece9d8] border-2 border-[#0055ea] shadow-2xl rounded-xs overflow-hidden text-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Window Titlebar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-[#0055ea] via-[#2a77f4] to-[#0055ea] text-white select-none">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-300" />
                <span className="font-bold text-xs tracking-wide">
                  {settings?.hotelName ? `${settings.hotelName} — Room Property Authorization` : 'Security & Role Setup — Room Property Authorization'}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setIsRoleConfigModalOpen(false)}
                className="hover:bg-red-600 px-1.5 py-0.5 rounded-2xs text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              {/* Description & current user status */}
              <div className="bg-white border border-[#7f9db9] p-3 rounded-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                  <span className="text-neutral-600 font-semibold">Active Staff Operator:</span>
                  <span className="font-bold text-neutral-900">{currentUser?.fullName || 'System Administrator'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 font-semibold">Logged Role:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 border border-blue-200 rounded-2xs">
                      {activeUserRole}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-2xs ${
                      isUserAuthorizedToAddRoom 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {isUserAuthorizedToAddRoom ? '✓ Authorized' : '✗ Restricted'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-neutral-800 flex items-center gap-1">
                  <span>Roles Permitted to "+ Add Room Property":</span>
                  <span className="text-neutral-500 font-normal">(Select all that apply)</span>
                </label>
                <div className="bg-white border border-[#7f9db9] p-2.5 rounded-xs space-y-2 max-h-48 overflow-y-auto">
                  {[
                    { role: 'Super Admin', desc: 'Highest authority (Full configuration & room assets)' },
                    { role: 'General Manager', desc: 'Hotel executive (Can manage suites & rate plans)' },
                    { role: 'Front Desk Manager', desc: 'Supervisory front office (Room rack allocation)' },
                    { role: 'Front Desk Operator', desc: 'Standard staff (Check-in, checkout, cashiering)' },
                    { role: 'Receptionist', desc: 'Frontline reception and guest assistance' },
                    { role: 'All Staff Roles', desc: 'Allow any logged-in staff member without restriction' },
                  ].map((item) => {
                    const isChecked = tempAllowedRoles.includes(item.role);
                    return (
                      <label 
                        key={item.role} 
                        className={`flex items-start gap-2.5 p-2 rounded-xs border cursor-pointer transition-colors ${
                          isChecked 
                            ? 'bg-amber-50/80 border-amber-300' 
                            : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempAllowedRoles([...tempAllowedRoles, item.role]);
                            } else {
                              setTempAllowedRoles(tempAllowedRoles.filter((r) => r !== item.role));
                            }
                          }}
                          className="mt-0.5 rounded border-neutral-400 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-neutral-900 flex items-center justify-between">
                            <span>{item.role}</span>
                            {isChecked && (
                              <span className="text-[10px] text-amber-800 font-mono font-bold bg-amber-200/60 px-1 py-0.2 rounded-2xs">
                                Enabled
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-600 leading-tight mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d8d2bd]">
                <button
                  type="button"
                  onClick={() => setIsRoleConfigModalOpen(false)}
                  className="px-3 py-1 bg-[#ece9d8] hover:bg-[#ded9c8] border border-[#7f9db9] text-neutral-800 font-semibold rounded-xs cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRolePermissions}
                  className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#144254] to-[#1a556d] hover:from-[#0f3442] hover:to-[#144356] border border-[#09222c] text-white font-bold rounded-xs cursor-pointer shadow-xs transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                  <span>Save Role Permissions</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unauthorized Role Alert Dialog */}
      {isUnauthorizedPromptOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setIsUnauthorizedPromptOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-[#ece9d8] border-2 border-[#c62828] shadow-2xl rounded-xs overflow-hidden text-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Red Titlebar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-[#c62828] via-[#e53935] to-[#c62828] text-white select-none">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-white" />
                <span className="font-bold text-xs tracking-wide">
                  {settings?.hotelName ? `${settings.hotelName} Access Control — Role Permission Required` : 'Access Control — Role Permission Required'}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setIsUnauthorizedPromptOpen(false)}
                className="hover:bg-red-800 px-1.5 py-0.5 rounded-2xs text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-3 rounded-xs">
                <ShieldAlert className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-red-900 text-sm">
                    Access Denied: "+ Add Room Property"
                  </div>
                  <p className="text-neutral-700 leading-relaxed">
                    Adding new rooms to the hotel property inventory is restricted by policy.
                  </p>
                  <div className="pt-1 space-y-1">
                    <p className="text-neutral-600">
                      • Your Current Role: <strong className="text-neutral-900 font-mono">{activeUserRole}</strong>
                    </p>
                    <p className="text-neutral-600">
                      • Authorized Roles: <strong className="text-neutral-900 font-mono">{allowedAddRoomRoles.join(', ')}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-neutral-600 text-[11px] italic">
                To enable access, ask an administrator or configure the authorized roles below.
              </p>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsUnauthorizedPromptOpen(false)}
                  className="px-3 py-1 bg-[#ece9d8] hover:bg-[#ded9c8] border border-[#7f9db9] text-neutral-800 font-semibold rounded-xs cursor-pointer shadow-xs"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUnauthorizedPromptOpen(false);
                    setTempAllowedRoles([...allowedAddRoomRoles]);
                    setIsRoleConfigModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#144254] to-[#1a556d] hover:from-[#0f3442] hover:to-[#144356] border border-[#09222c] text-white font-bold rounded-xs cursor-pointer shadow-xs"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                  <span>Configure Role Access</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hotel Tape Chart Booking Policy Hours Modal */}
      {isPolicyModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setIsPolicyModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-[#ece9d8] border-2 border-[#0055ea] shadow-2xl rounded-xs overflow-hidden text-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Titlebar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-[#0055ea] via-[#2a77f4] to-[#0055ea] text-white select-none">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-300" />
                <span className="font-bold text-xs tracking-wide">
                  Tape Chart Booking Policy — Check-In & Check-Out Hours
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setIsPolicyModalOpen(false)}
                className="hover:bg-red-600 px-1.5 py-0.5 rounded-2xs text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div className="bg-[#fffde7] border border-[#d4af37] p-2.5 rounded-xs flex items-start gap-2.5">
                <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-950 leading-relaxed">
                  <strong>Hotel Hourly Allocation Rule:</strong> Reservations on the Tape Chart represent arrival and departure times (e.g. check-in at <strong>2:00 PM</strong> and check-out at <strong>12:00 PM</strong>). You can configure the hotel standard rule here, and users can also select custom times for any booking.
                </div>
              </div>

              {/* 24-Hour Interactive Timeline Visualizer */}
              <div className="bg-white border border-[#7f9db9] p-3 rounded-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-neutral-700 text-[11px]">
                  <span>24-Hour Daily Turnover Cycle</span>
                  <span className="font-mono text-blue-900">
                    Turnaround Gap: {(() => {
                      const inH = parseHourFraction(tempCheckInTime, 14) * 24;
                      const outH = parseHourFraction(tempCheckOutTime, 12) * 24;
                      const gap = inH - outH;
                      return gap >= 0 ? `${gap.toFixed(1)} hrs` : 'Overnight/Custom';
                    })()}
                  </span>
                </div>

                <div className="relative h-7 bg-neutral-100 border border-neutral-300 rounded-2xs overflow-hidden flex shadow-inner">
                  {/* Checkout portion */}
                  <div 
                    style={{ width: `${Math.max(5, Math.min(95, parseHourFraction(tempCheckOutTime, 12) * 100))}%` }}
                    className="h-full bg-amber-200 border-r border-amber-400 flex items-center justify-center font-mono font-bold text-[10px] text-amber-950 px-1"
                    title={`Check-Out by ${formatTimeDisplay(tempCheckOutTime)}`}
                  >
                    Out by {formatTimeDisplay(tempCheckOutTime)}
                  </div>
                  {/* Housekeeping / Turnaround buffer */}
                  <div 
                    style={{ 
                      width: `${Math.max(4, Math.min(90, (parseHourFraction(tempCheckInTime, 14) - parseHourFraction(tempCheckOutTime, 12)) * 100))}%` 
                    }}
                    className="h-full bg-slate-200/80 border-r border-slate-400 flex items-center justify-center font-mono font-bold text-[9px] text-slate-700 px-0.5 italic"
                    title="Housekeeping, inspection, and room preparation window"
                  >
                    Cleaning
                  </div>
                  {/* Checkin portion */}
                  <div 
                    className="flex-1 h-full bg-sky-200 flex items-center justify-center font-mono font-bold text-[10px] text-sky-950 px-1"
                    title={`Check-In starting ${formatTimeDisplay(tempCheckInTime)}`}
                  >
                    In at {formatTimeDisplay(tempCheckInTime)}
                  </div>
                </div>

                <div className="flex justify-between text-[10px] font-mono text-neutral-500 pt-0.5">
                  <span>00:00 (Midnight)</span>
                  <span>12:00 (Noon)</span>
                  <span>14:00 (2 PM)</span>
                  <span>23:59 (EOD)</span>
                </div>
              </div>

              {/* Time Configuration Inputs */}
              <div className="grid grid-cols-2 gap-3">
                {/* Check-In Rule */}
                <div className="bg-white border border-[#7f9db9] p-3 rounded-xs space-y-2">
                  <label className="font-bold text-neutral-900 block flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block"></span>
                    Standard Check-In Time
                  </label>
                  <input
                    type="time"
                    value={tempCheckInTime}
                    onChange={(e) => setTempCheckInTime(e.target.value)}
                    className="w-full px-2 py-1 border border-[#7f9db9] font-mono text-sm bg-sky-50/50 text-sky-950 rounded-2xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-bold"
                  />
                  <div className="text-[10px] text-neutral-600">Quick Presets:</div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: '2:00 PM (Standard)', val: '14:00' },
                      { label: '3:00 PM', val: '15:00' },
                      { label: '1:00 PM', val: '13:00' },
                      { label: '12:00 PM', val: '12:00' },
                    ].map((p) => (
                      <button
                        key={`in-preset-${p.val}`}
                        type="button"
                        onClick={() => setTempCheckInTime(p.val)}
                        className={`px-1.5 py-0.5 border text-[10px] rounded-2xs font-mono cursor-pointer transition-colors ${
                          tempCheckInTime === p.val
                            ? 'bg-sky-600 border-sky-700 text-white font-bold'
                            : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Check-Out Rule */}
                <div className="bg-white border border-[#7f9db9] p-3 rounded-xs space-y-2">
                  <label className="font-bold text-neutral-900 block flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>
                    Standard Check-Out Time
                  </label>
                  <input
                    type="time"
                    value={tempCheckOutTime}
                    onChange={(e) => setTempCheckOutTime(e.target.value)}
                    className="w-full px-2 py-1 border border-[#7f9db9] font-mono text-sm bg-amber-50/50 text-amber-950 rounded-2xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                  />
                  <div className="text-[10px] text-neutral-600">Quick Presets:</div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: '12:00 PM (Standard)', val: '12:00' },
                      { label: '11:00 AM', val: '11:00' },
                      { label: '10:00 AM', val: '10:00' },
                      { label: '1:00 PM', val: '13:00' },
                    ].map((p) => (
                      <button
                        key={`out-preset-${p.val}`}
                        type="button"
                        onClick={() => setTempCheckOutTime(p.val)}
                        className={`px-1.5 py-0.5 border text-[10px] rounded-2xs font-mono cursor-pointer transition-colors ${
                          tempCheckOutTime === p.val
                            ? 'bg-amber-600 border-amber-700 text-white font-bold'
                            : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-[#a09a8a] pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setTempCheckInTime('14:00');
                    setTempCheckOutTime('12:00');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-[#7f9db9] text-neutral-800 rounded-2xs font-semibold cursor-pointer shadow-2xs"
                >
                  Reset to 2:00 PM In / 12:00 PM Out
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPolicyModalOpen(false)}
                    className="px-3 py-1 bg-[#ece9d8] hover:bg-[#ded9c8] border border-[#7f9db9] text-neutral-800 rounded-2xs font-semibold cursor-pointer shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePolicyHours(tempCheckInTime, tempCheckOutTime)}
                    className="px-4 py-1 bg-gradient-to-r from-[#0055ea] to-[#1a6bfb] hover:from-[#0047c4] hover:to-[#1457d0] text-white border border-[#003da8] rounded-2xs font-bold cursor-pointer shadow-xs transition-colors"
                  >
                    Apply to Tape Chart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
