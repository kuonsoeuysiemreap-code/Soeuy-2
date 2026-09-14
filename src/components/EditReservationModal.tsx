import React, { useState, useEffect } from 'react';
import { 
  X, 
  Minus, 
  Square, 
  BarChart2, 
  Users, 
  BookOpen,
  FileText,
  Receipt,
  Trash2,
  Plus,
  Search,
  Check,
  Save,
  ListFilter,
  Tag,
  Database,
  PlusCircle,
  DollarSign,
  Wallet,
  CreditCard,
  History,
  UserCheck,
  Clock,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Unlock,
  Ban,
  ChevronDown,
  ChevronUp,
  Settings as SettingsIcon
} from 'lucide-react';
import { Room, UserSettings, PaymentMethod } from '../types';
import { playChime } from '../utils/helpers';
import { ReservationAuditModal, ReservationAuditRecord } from './ReservationAuditModal';
import { AuthUser } from './PMSActionModals';

export interface RoomRowItem {
  id: string;
  type: string;
  roomTypeName: string;
  arrival: string;
  arrivalTime: string;
  arrivalDay: string;
  nights: number;
  depart: string;
  departTime: string;
  departDay: string;
  rms: number;
  adult: number;
  child: number;
  room: string;
  rateCode: string;
  tariffUSD: number;
  plan: string;
  status: string;
}

export interface ReservationEditData {
  id?: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  rate: number;
  guestsCount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  extraBed?: boolean;
  extraBedCount?: number;
  vipStatus?: boolean;
  isCurrentStay?: boolean;
  title?: string;
  firstName?: string;
  lastName?: string;
  reservationNumber?: string;
  guestStatus?: string;
  guestType?: string;
  segment?: string;
  payMode?: string;
  reserveMode?: string;
  billingInstruction?: string;
  businessSource?: string;
  memberNumber?: string;
  currency?: string;
  skipTariffInRegCard?: boolean;
  upgrade?: string;
  visitPurpose?: string;
  tariffDiscountPercent?: number;
  tariffDiscountAmount?: number;
  netTariff?: number;
  planAmount?: number;
  planDiscountPercent?: number;
  planDiscountAmount?: number;
  companyName?: string;
  groupName?: string;
  reservationInstructions?: string;
  gstSpecialRequest?: string;
  checkInRemarks?: string;
  checkOutRemarks?: string;
  posRemarks?: string;
  voucherCode?: string;
  referNumber?: string;
  roomTypeName?: string;
  roomTypeCode?: string;
  rateCode?: string;
  planCode?: string;
  bookingStatus?: string;
  depositAmount?: number;
  arrivalTime?: string;
  departTime?: string;
  checkInTime?: string;
  checkOutTime?: string;
  roomRows?: RoomRowItem[];
  guestExpectedStatus?: string;
  isReservationOnly?: boolean;
}

interface EditReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationEditData | null;
  rooms: Room[];
  settings: UserSettings;
  currentUser?: AuthUser;
  onSaveReservation: (data: ReservationEditData, keepOpen?: boolean) => void;
  onCancelReservation?: (
    reservationId?: string, 
    roomId?: string, 
    actionType?: 'cancel' | 'delete', 
    details?: {
      guestName?: string;
      roomNumber?: string;
      rate?: number;
      reason?: string;
      date?: string;
      paymentMethod?: PaymentMethod;
      notes?: string;
    }
  ) => void;
  onCheckInReservation?: (data: ReservationEditData) => void;
  onViewFolio?: (room: Room, guestName: string) => void;
  onOpenReport1?: (tab?: 'summary' | 'cancel_delete', month?: string) => void;
}

// Date parsing & calculation helpers
function parseCustomDate(str: string): Date | null {
  if (!str) return null;
  const trimmed = str.trim();
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  const ymdMatch = trimmed.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateToDDMMYY(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function getDayName(d: Date): string {
  return SHORT_DAY_NAMES[d.getDay()] || 'Sun';
}

// 12-Hour AM/PM Time Formatters and Toggles
export function formatTo12Hour(timeStr: string | undefined): string {
  if (!timeStr) return '02:00 PM';
  const trimmed = timeStr.trim();
  if (!trimmed) return '02:00 PM';

  // Check if it already has AM or PM (e.g. "02:00 PM", "2:00pm", "11:30 AM")
  const amPmRegex = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i;
  const amPmMatch = trimmed.match(amPmRegex);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const mins = amPmMatch[2];
    const period = amPmMatch[3].toUpperCase();
    if (hours > 12) hours = hours % 12 || 12;
    if (hours === 0) hours = 12;
    return `${hours.toString().padStart(2, '0')}:${mins} ${period}`;
  }

  // Check 24-hour format: e.g. "14:00" or "9:30" or "14:00:00"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    let hours = parseInt(match24[1], 10);
    const mins = match24[2];
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, '0')}:${mins} ${period}`;
  }

  // Check simple e.g. "2pm", "9am", "2 pm"
  const simpleAmPm = trimmed.match(/^(\d{1,2})\s*(AM|PM)$/i);
  if (simpleAmPm) {
    let hours = parseInt(simpleAmPm[1], 10);
    const period = simpleAmPm[2].toUpperCase();
    if (hours > 12) hours = hours % 12 || 12;
    if (hours === 0) hours = 12;
    return `${hours.toString().padStart(2, '0')}:00 ${period}`;
  }

  return trimmed;
}

export function toggleAmPm(timeStr: string | undefined): string {
  const formatted = formatTo12Hour(timeStr);
  const isPm = formatted.toUpperCase().includes('PM');
  const timeOnly = formatted.replace(/\s*(AM|PM)/i, '').trim();
  const newPeriod = isPm ? 'AM' : 'PM';
  return `${timeOnly || '02:00'} ${newPeriod}`;
}

export const EditReservationModal: React.FC<EditReservationModalProps> = ({
  isOpen,
  onClose,
  reservation,
  rooms,
  settings,
  currentUser,
  onSaveReservation,
  onCancelReservation,
  onCheckInReservation,
  onViewFolio,
  onOpenReport1,
}) => {
  const [rsrNo, setRsrNo] = useState('1213');
  const [roomRows, setRoomRows] = useState<RoomRowItem[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);

  // Cancellation & Deletion flow states (Report 1 integration)
  const [showCancelDropdown, setShowCancelDropdown] = useState(false);
  const [cancelModalAction, setCancelModalAction] = useState<'none' | 'guest_cancel' | 'delete'>('none');
  const [cancelReasonPreset, setCancelReasonPreset] = useState('Guest travel itinerary change');
  const [cancelCustomNotes, setCancelCustomNotes] = useState('');
  const [cancelRefundPolicy, setCancelRefundPolicy] = useState<'full' | 'one_night' | 'no_refund'>('full');
  const [deleteReasonPreset, setDeleteReasonPreset] = useState('Duplicate reservation entry');
  const [deleteCustomNotes, setDeleteCustomNotes] = useState('');
  const [cancelResultToast, setCancelResultToast] = useState<{
    type: 'cancel' | 'delete';
    guest: string;
    room: string;
    voucher: string;
    month: string;
  } | null>(null);

  const [guestStatusOptions, setGuestStatusOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('winhms_master_guest_status');
      return saved ? JSON.parse(saved) : [
        'Cambodian Guest',
        'Foreign Guest',
        'VIP Guest',
        'Corporate Client',
        'Resident',
      ];
    } catch {
      return ['Cambodian Guest', 'Foreign Guest', 'VIP Guest', 'Corporate Client', 'Resident'];
    }
  });

  const [reserveModeOptions, setReserveModeOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('winhms_master_reserve_mode');
      return saved ? JSON.parse(saved) : [
        'Telephone',
        'Walk-In',
        'Email',
        'Online / OTA',
        'WhatsApp / Telegram',
      ];
    } catch {
      return ['Telephone', 'Walk-In', 'Email', 'Online / OTA', 'WhatsApp / Telegram'];
    }
  });

  const [guestTypeOptions, setGuestTypeOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('winhms_master_guest_type');
      return saved ? JSON.parse(saved) : [
        'Self Booking',
        'Corporate',
        'Travel Agency',
        'Government',
        'Group Member',
      ];
    } catch {
      return ['Self Booking', 'Corporate', 'Travel Agency', 'Government', 'Group Member'];
    }
  });

  const [billingInstructionOptions, setBillingInstructionOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('winhms_master_billing_instruction');
      return saved ? JSON.parse(saved) : [
        'Direct Payment',
        'Bill to Company',
        'BTC - Agent',
        'Credit Card Auth',
      ];
    } catch {
      return ['Direct Payment', 'Bill to Company', 'BTC - Agent', 'Credit Card Auth'];
    }
  });

  const [segmentOptions, setSegmentOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('winhms_master_segment');
      return saved ? JSON.parse(saved) : [
        'Transient Discount',
        'Rack Rate',
        'Corporate Discount',
        'Promotion Rate',
      ];
    } catch {
      return ['Transient Discount', 'Rack Rate', 'Corporate Discount', 'Promotion Rate'];
    }
  });

  const [businessSourceOptions, setBusinessSourceOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('winhms_master_business_source');
      return saved ? JSON.parse(saved) : [
        'Self Booking',
        'Agoda',
        'Booking.com',
        'Expedia',
        'Traveloka',
        'Direct Contact',
      ];
    } catch {
      return ['Self Booking', 'Agoda', 'Booking.com', 'Expedia', 'Traveloka', 'Direct Contact'];
    }
  });

  const [payModeOptions, setPayModeOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('winhms_master_pay_mode');
      return saved ? JSON.parse(saved) : [
        'Cash',
        'Credit Card',
        'Bank Transfer',
        'ABA PayWay',
        'Stripe',
      ];
    } catch {
      return ['Cash', 'Credit Card', 'Bank Transfer', 'ABA PayWay', 'Stripe'];
    }
  });

  const [upgradeOptions, setUpgradeOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('winhms_master_upgrade');
      return saved ? JSON.parse(saved) : [
        '<None>',
        'Deluxe Suite',
        'Presidential Suite',
        'Executive Twin',
      ];
    } catch {
      return ['<None>', 'Deluxe Suite', 'Presidential Suite', 'Executive Twin'];
    }
  });

  // Direct Master Listing Modal State
  const [directListingModal, setDirectListingModal] = useState<{
    isOpen: boolean;
    fieldKey: string;
    fieldLabel: string;
    options: string[];
    currentValue: string;
    setOptions: React.Dispatch<React.SetStateAction<string[]>>;
    setSelected: React.Dispatch<React.SetStateAction<string>>;
  } | null>(null);

  const [directListingSearch, setDirectListingSearch] = useState<string>('');
  const [newDirectListingEntry, setNewDirectListingEntry] = useState<string>('');

  const openDirectListing = (
    fieldKey: string,
    fieldLabel: string,
    options: string[],
    currentValue: string,
    setOptions: React.Dispatch<React.SetStateAction<string[]>>,
    setSelected: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setDirectListingModal({
      isOpen: true,
      fieldKey,
      fieldLabel,
      options,
      currentValue,
      setOptions,
      setSelected,
    });
    setDirectListingSearch('');
    setNewDirectListingEntry('');
    if (settings.soundEffects) playChime();
  };

  const handleSelectFromListing = (item: string) => {
    if (!directListingModal) return;
    directListingModal.setSelected(item);
    if (settings.soundEffects) playChime();
    setDirectListingModal(null);
  };

  const handleAddNewToDirectListing = (selectImmediately = true) => {
    if (!directListingModal || !newDirectListingEntry.trim()) return;
    const clean = newDirectListingEntry.trim();
    
    // Update options list
    directListingModal.setOptions(prev => {
      const updated = prev.includes(clean) ? prev : [...prev, clean];
      try {
        localStorage.setItem(`winhms_master_${directListingModal.fieldKey}`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    if (selectImmediately) {
      directListingModal.setSelected(clean);
      if (settings.soundEffects) playChime();
      setDirectListingModal(null);
    } else {
      setNewDirectListingEntry('');
      if (settings.soundEffects) playChime();
    }
  };

  const handleDeleteFromDirectListing = (itemToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!directListingModal) return;
    if (directListingModal.options.length <= 1) {
      alert('You cannot delete all options.');
      return;
    }
    if (!confirm(`Remove "${itemToDelete}" from ${directListingModal.fieldLabel} direct list?`)) return;

    directListingModal.setOptions(prev => {
      const updated = prev.filter(item => item !== itemToDelete);
      try {
        localStorage.setItem(`winhms_master_${directListingModal.fieldKey}`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    // If current selected was deleted, fallback to first available
    if (directListingModal.currentValue === itemToDelete) {
      const fallback = directListingModal.options.find(i => i !== itemToDelete) || '';
      directListingModal.setSelected(fallback);
    }
  };

  // Deposit Manager Modal State
  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);
  const [depositModalAmount, setDepositModalAmount] = useState<number>(0);
  const [depositModalPayMode, setDepositModalPayMode] = useState<string>('Cash');
  const [depositModalRef, setDepositModalRef] = useState<string>('');
  const [depositModalNotes, setDepositModalNotes] = useState<string>('');
  const [isDepositAutoPostEnabled, setIsDepositAutoPostEnabled] = useState<boolean>(true);

  // Reservation Audit Trail Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<ReservationAuditRecord[]>([]);

  // Click Refresh Before Edit Role Policy State
  const [isRefreshed, setIsRefreshed] = useState<boolean>(false);
  const [showRefreshAlert, setShowRefreshAlert] = useState<boolean>(false);
  const [isRoleConfigModalOpen, setIsRoleConfigModalOpen] = useState<boolean>(false);
  const [refreshNotification, setRefreshNotification] = useState<string | null>(null);

  // Policy Settings persisted in localStorage
  const [isRefreshPolicyEnabled, setIsRefreshPolicyEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('winhms_refresh_policy_enabled');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true; // Enabled by default
  });

  const [refreshRequiredRoles, setRefreshRequiredRoles] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('winhms_refresh_required_roles');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['Front Desk Operator', 'Receptionist', 'Front Desk Manager', 'Night Auditor', 'All Staff Roles'];
  });

  const [tempRefreshRoles, setTempRefreshRoles] = useState<string[]>(refreshRequiredRoles);
  const [tempPolicyEnabled, setTempPolicyEnabled] = useState<boolean>(isRefreshPolicyEnabled);

  const [simulatedRole, setSimulatedRole] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('winhms_current_operator_role');
      if (saved) return saved;
    } catch (e) {}
    return currentUser?.role || 'Front Desk Operator';
  });

  const activeOperatorRole = currentUser?.role || simulatedRole || 'Front Desk Operator';

  const isRoleRequireRefresh = React.useMemo(() => {
    if (!isRefreshPolicyEnabled) return false;
    return (
      refreshRequiredRoles.includes(activeOperatorRole) ||
      refreshRequiredRoles.includes('All Staff Roles')
    );
  }, [isRefreshPolicyEnabled, refreshRequiredRoles, activeOperatorRole]);

  const handleAddAuditLog = (record: ReservationAuditRecord) => {
    const updated = [record, ...auditLogs];
    setAuditLogs(updated);
    const resIdKey = rsrNo || reservation?.reservationNumber || reservation?.id || '15';
    try {
      localStorage.setItem(`winhms_res_audit_${resIdKey}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const [title, setTitle] = useState('Ms.');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [guestExpectedStatus, setGuestExpectedStatus] = useState('Expected');
  const [guestStatus, setGuestStatus] = useState('Cambodian Guest');
  const [guestType, setGuestType] = useState('Self Booking');
  const [segment, setSegment] = useState('Transient Discount');
  const [payMode, setPayMode] = useState('Cash');
  const [reserveMode, setReserveMode] = useState('Telephone');
  const [billingInstruction, setBillingInstruction] = useState('Direct Payment');
  const [businessSource, setBusinessSource] = useState('Self Booking');
  const [member, setMember] = useState('');
  const [currency, setCurrency] = useState('US DOLLAR');
  const [skipTariffInRegCard, setSkipTariffInRegCard] = useState(false);
  const [upgrade, setUpgrade] = useState('<None>');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [depositAmount, setDepositAmount] = useState<number>(0.00);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Helper to sync advance deposit automatically into Guest Folio & Bill Details
  const syncDepositToGuestFolio = (
    amt: number, 
    method?: string, 
    ref?: string, 
    targetGuestName?: string, 
    targetRoomNum?: string
  ) => {
    try {
      const gName = (targetGuestName || `${title} ${lastName} ${firstName}`).trim();
      const rNum = targetRoomNum || roomRows[0]?.room || currentRoom?.roomNumber || '15';
      const cleanGuestKey = gName.replace(/[^a-zA-Z0-9]/g, '_');
      const storageKey = `winhms_bill_${rNum}_${cleanGuestKey}`;

      const existingRaw = localStorage.getItem(storageKey);
      let billData: any = existingRaw ? JSON.parse(existingRaw) : null;

      if (!billData) {
        billData = {
          charges: [],
          isSplitEnabled: true,
          numSplits: 2,
          arrivalDate: roomRows[0]?.arrival || '22/08/2026',
          departureDate: roomRows[0]?.depart || '24/08/2026',
          ratePlan: 'Regular Tariff',
          paxCount: 2,
          companyName: company || 'DIRECT BOOKING - SELF BOOKING',
          groupName: group || '',
          billingInfo: billingInstruction || 'Direct Payment',
          currency: 'USD',
          savedAt: new Date().toISOString(),
        };
      }

      let currentCharges: any[] = Array.isArray(billData.charges) ? [...billData.charges] : [];

      // Filter out previous auto-posted advance deposits
      currentCharges = currentCharges.filter(c => 
        !c.id?.startsWith('deposit-') && 
        !c.description?.toLowerCase().includes('advance deposit')
      );

      // If deposit amount is greater than 0, post automatic credit entry
      if (amt > 0) {
        const depositEntry = {
          id: `deposit-${Date.now()}`,
          date: '22-Aug-2026',
          description: `Advance Deposit Paid (${method || payMode || 'Cash'})${ref ? ` - Ref: ${ref}` : (referNumber ? ` - Ref: ${referNumber}` : '')}`,
          amount: -Math.abs(amt), // Negative amount credits/reduces the folio balance
          splitId: 1,
          category: 'Misc'
        };
        currentCharges.unshift(depositEntry);
      }

      billData.charges = currentCharges;
      billData.savedAt = new Date().toISOString();
      localStorage.setItem(storageKey, JSON.stringify(billData));
    } catch (e) {
      console.error('Failed to sync deposit to guest folio storage', e);
    }
  };

  const openDepositManager = () => {
    if (!checkCanEdit()) return;
    setDepositModalAmount(depositAmount);
    setDepositModalPayMode(payMode || 'Cash');
    setDepositModalRef(referNumber || voucherCode || '');
    setDepositModalNotes(instructionsReservation || '');
    setIsDepositModalOpen(true);
    if (settings.soundEffects) playChime();
  };

  const handleSaveDepositFromModal = () => {
    setDepositAmount(depositModalAmount);
    if (depositModalPayMode) setPayMode(depositModalPayMode);
    if (depositModalRef) setReferNumber(depositModalRef);
    
    // Auto-post deposit to guest bill
    syncDepositToGuestFolio(depositModalAmount, depositModalPayMode, depositModalRef);

    setIsDepositModalOpen(false);
    if (settings.soundEffects) playChime();
  };

  const [tariffDiscPercent, setTariffDiscPercent] = useState<string>('');
  const [tariffDiscAmt, setTariffDiscAmt] = useState<number>(0.00);
  const [netTariff, setNetTariff] = useState<number>(30.00);
  const [planAmount, setPlanAmount] = useState<number>(0.00);
  const [planDiscAmt, setPlanDiscAmt] = useState<number>(0.00);
  const [planDiscPercent, setPlanDiscPercent] = useState<string>('');
  const [company, setCompany] = useState('DIRECT BOOKING - SELF BOOKING');
  const [group, setGroup] = useState('');

  const [instructionsReservation, setInstructionsReservation] = useState(
    'ROOM ONLY CHARGE TO GUEST OWN ACCOUNT\n01 DOUBLE & 01 TWIN ROOM WITH RATE US$30NETT PER NIGHT PER ROOM\nTEL: 092 807 116'
  );
  const [gstSpecialRequest, setGstSpecialRequest] = useState('');
  const [checkInRemarks, setCheckInRemarks] = useState('');
  const [checkOutRemarks, setCheckOutRemarks] = useState('');
  const [posRemarks, setPosRemarks] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [referNumber, setReferNumber] = useState('');

  const getDayOfWeek = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] || 'Sat';
    } catch {
      return 'Sat';
    }
  };

  const formatDateToYY = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsRefreshed(false);
      setShowRefreshAlert(false);
      setRefreshNotification(null);
      if (reservation) {
        const currentRoom = rooms.find((r) => r.id === reservation.roomId) || rooms.find((r) => r.roomNumber === reservation.roomNumber);
        
        const rawName = (reservation.guestName || '').trim();
        if (!rawName || rawName.toUpperCase() === 'LEAKENA') {
          setLastName('');
          setFirstName('');
        } else {
          const nameParts = rawName.split(' ');
          if (nameParts.length > 1) {
            setLastName(nameParts[nameParts.length - 1].toUpperCase());
            setFirstName(nameParts.slice(0, nameParts.length - 1).join(' '));
          } else {
            setLastName(rawName.toUpperCase());
            setFirstName('');
          }
        }

        setRsrNo(reservation.reservationNumber || reservation.id?.replace(/\D/g, '').slice(-4) || '1213');
        const inDate = reservation.checkInDate || '2026-08-22';
        const outDate = reservation.checkOutDate || '2026-08-23';
        
        const inDay = getDayOfWeek(inDate);
        const outDay = getDayOfWeek(outDate);
        const inFormatted = formatDateToYY(inDate);
        const outFormatted = formatDateToYY(outDate);
        const nights = Math.max(
          1,
          Math.round(
            (new Date(outDate).getTime() - new Date(inDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) || 1
        );
        const roomRate = reservation.rate || (currentRoom ? currentRoom.pricePerNight : 30.00);
        setNetTariff(roomRate);

        const roomType = currentRoom?.type || 'Deluxe Double';
        const typeCode = roomType.toLowerCase().includes('twin') ? 'DLT' : 'DLD';

        let rows: RoomRowItem[] = [];
        if (reservation.roomRows && Array.isArray(reservation.roomRows) && reservation.roomRows.length > 0) {
          rows = reservation.roomRows;
        } else {
          rows = [
            {
              id: 'row-1',
              type: typeCode,
              roomTypeName: roomType,
              arrival: inFormatted,
              arrivalTime: formatTo12Hour(reservation.arrivalTime || reservation.checkInTime || '02:00 PM'),
              arrivalDay: inDay,
              nights: nights,
              depart: outFormatted,
              departTime: formatTo12Hour(reservation.departTime || reservation.checkOutTime || '12:00 PM'),
              departDay: outDay,
              rms: 1,
              adult: reservation.guestsCount || (currentRoom?.maxGuests || 2),
              child: 0,
              room: currentRoom?.roomNumber || reservation.roomNumber || '15',
              rateCode: reservation.rateCode || 'Room Only',
              tariffUSD: roomRate,
              plan: reservation.planCode || 'Onl',
              status: reservation.bookingStatus || 'Confirmed',
            }
          ];
        }

        setRoomRows(rows);
        setSelectedRowIndex(0);

        if (reservation.paymentMethod === 'Cash') setPayMode('Cash');
        else if (reservation.paymentMethod === 'Credit Card') setPayMode('Credit Card');
        else if (reservation.paymentMethod === 'Bank Transfer') setPayMode('Bank Transfer');

        if (reservation.guestStatus) {
          setGuestStatus(reservation.guestStatus);
          setGuestStatusOptions(prev => prev.includes(reservation.guestStatus!) ? prev : [...prev, reservation.guestStatus!]);
        }
        if (reservation.guestType) {
          setGuestType(reservation.guestType);
          setGuestTypeOptions(prev => prev.includes(reservation.guestType!) ? prev : [...prev, reservation.guestType!]);
        }
        if (reservation.segment) {
          setSegment(reservation.segment);
          setSegmentOptions(prev => prev.includes(reservation.segment!) ? prev : [...prev, reservation.segment!]);
        }
        if (reservation.payMode) {
          setPayMode(reservation.payMode);
          setPayModeOptions(prev => prev.includes(reservation.payMode!) ? prev : [...prev, reservation.payMode!]);
        }
        if (reservation.reserveMode) {
          setReserveMode(reservation.reserveMode);
          setReserveModeOptions(prev => prev.includes(reservation.reserveMode!) ? prev : [...prev, reservation.reserveMode!]);
        }
        if (reservation.billingInstruction) {
          setBillingInstruction(reservation.billingInstruction);
          setBillingInstructionOptions(prev => prev.includes(reservation.billingInstruction!) ? prev : [...prev, reservation.billingInstruction!]);
        }
        if (reservation.businessSource) {
          setBusinessSource(reservation.businessSource);
          setBusinessSourceOptions(prev => prev.includes(reservation.businessSource!) ? prev : [...prev, reservation.businessSource!]);
        }
        if (reservation.upgrade) {
          setUpgrade(reservation.upgrade);
          setUpgradeOptions(prev => prev.includes(reservation.upgrade!) ? prev : [...prev, reservation.upgrade!]);
        }

        if ((reservation as any).depositAmount || (reservation as any).deposit) {
          setDepositAmount(Number((reservation as any).depositAmount || (reservation as any).deposit) || 0.00);
        } else {
          setDepositAmount(0.00);
        }

        // Load or initialize audit trail history for this reservation
        const resIdKey = reservation.reservationNumber || reservation.id?.replace(/\D/g, '').slice(-4) || '15';
        const auditStorageKey = `winhms_res_audit_${resIdKey}`;
        const existingAuditRaw = localStorage.getItem(auditStorageKey);
        if (existingAuditRaw) {
          try {
            setAuditLogs(JSON.parse(existingAuditRaw));
          } catch (e) {
            console.error('Failed to parse audit logs', e);
          }
        } else {
          const seedLogs: ReservationAuditRecord[] = [
            {
              id: `audit-${resIdKey}-1`,
              timestamp: '22/08/26 11:08:14',
              userName: 'Julian Vance',
              userRole: 'Front Desk Manager',
              actionType: 'Created',
              details: `Reservation initial entry created. Guest: ${reservation.guestName || 'Ms. LEAKENA'}, Room ${reservation.roomNumber || '15'}, Rate: $${roomRate.toFixed(2)}, Plan: ${reservation.rateCode || 'Room Only'} (${reservation.planCode || 'RO'})`,
              terminal: 'WS-FRONTDESK-01 (Front Desk #1)'
            },
            {
              id: `audit-${resIdKey}-2`,
              timestamp: '22/08/26 11:45:20',
              userName: 'Carlos Gomez',
              userRole: 'Receptionist',
              actionType: 'Amended',
              details: `Rate Code set to '${reservation.rateCode || 'Room Only'}'. Guest contact and special instructions verified.`,
              terminal: 'WS-RESERVATION-02 (Terminal #2)'
            }
          ];

          if (Number((reservation as any).depositAmount || (reservation as any).deposit || 0) > 0) {
            seedLogs.unshift({
              id: `audit-${resIdKey}-3`,
              timestamp: '23/08/26 09:30:00',
              userName: 'Nathalie Dupont',
              userRole: 'Chief Accountant',
              actionType: 'Deposit / Payment',
              details: `Advance deposit of $${Number((reservation as any).depositAmount || (reservation as any).deposit).toFixed(2)} received and posted to guest folio.`,
              terminal: 'WS-CASHIER-01 (Cashier Counter)'
            });
          }

          setAuditLogs(seedLogs);
          try {
            localStorage.setItem(auditStorageKey, JSON.stringify(seedLogs));
          } catch (e) {
            console.error(e);
          }
        }

        if (reservation.guestExpectedStatus) {
          setGuestExpectedStatus(reservation.guestExpectedStatus);
        } else if (reservation.isReservationOnly) {
          setGuestExpectedStatus('Expected');
        } else if (reservation.isCurrentStay && currentRoom?.status === 'occupied') {
          setGuestExpectedStatus('Checked In');
        } else {
          setGuestExpectedStatus(reservation.bookingStatus === 'Checked In' ? 'Checked In' : 'Expected');
        }

        if (reservation.notes) {
          setInstructionsReservation(reservation.notes);
        } else {
          const phone = reservation.guestPhone ? `\nTEL: ${reservation.guestPhone}` : '\nTEL: 092 807 116';
          setInstructionsReservation(
            `ROOM ONLY CHARGE TO GUEST OWN ACCOUNT\n01 ${roomType.toUpperCase()} WITH RATE US$${roomRate.toFixed(2)}NETT PER NIGHT PER ROOM${phone}`
          );
        }
      } else {
        const defaultRoom = rooms[0];
        const defaultRate = defaultRoom ? defaultRoom.pricePerNight : 30.00;
        const defaultType = defaultRoom?.type || 'Deluxe Double';
        const defaultTypeCode = defaultType.toLowerCase().includes('twin') ? 'DLT' : 'DLD';
        setLastName('');
        setFirstName('');
        setRsrNo('1213');
        setNetTariff(defaultRate);
        setRoomRows([
          {
            id: 'row-1',
            type: defaultTypeCode,
            roomTypeName: defaultType,
            arrival: '22/08/26',
            arrivalTime: '02:00 PM',
            arrivalDay: 'Sat',
            nights: 2,
            depart: '24/08/26',
            departTime: '12:00 PM',
            departDay: 'Mon',
            rms: 1,
            adult: 2,
            child: 0,
            room: defaultRoom?.roomNumber || '15',
            rateCode: 'Room Only',
            tariffUSD: defaultRate,
            plan: 'Onl',
            status: 'Confirmed',
          }
        ]);

        const defaultKey = '15';
        const defaultStorageKey = `winhms_res_audit_${defaultKey}`;
        const existingDefaultAudit = localStorage.getItem(defaultStorageKey);
        if (existingDefaultAudit) {
          try {
            setAuditLogs(JSON.parse(existingDefaultAudit));
          } catch (e) {
            console.error(e);
          }
        } else {
          const defaultSeedLogs: ReservationAuditRecord[] = [
            {
              id: `audit-def-1`,
              timestamp: '22/08/26 11:08:14',
              userName: 'Julian Vance',
              userRole: 'Front Desk Manager',
              actionType: 'Created',
              details: 'Reservation initial entry created. Guest: Ms. LEAKENA, Room 15, Rate: $30.00, Plan: Room Only (RO)',
              terminal: 'WS-FRONTDESK-01 (Front Desk #1)'
            },
            {
              id: `audit-def-2`,
              timestamp: '22/08/26 11:45:20',
              userName: 'Carlos Gomez',
              userRole: 'Receptionist',
              actionType: 'Amended',
              details: "Rate Code verified: 'Room Only'. Special requests recorded.",
              terminal: 'WS-RESERVATION-02 (Terminal #2)'
            }
          ];
          setAuditLogs(defaultSeedLogs);
          try {
            localStorage.setItem(defaultStorageKey, JSON.stringify(defaultSeedLogs));
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }, [reservation, isOpen, rooms]);

  if (!isOpen) return null;

  const currentRoom = reservation 
    ? (rooms.find((r) => r.id === reservation.roomId) || rooms.find((r) => r.roomNumber === reservation.roomNumber))
    : rooms[0];

  const isCheckedIn = 
    !reservation?.isReservationOnly &&
    (guestExpectedStatus === 'Checked In' || 
     guestExpectedStatus === 'In House' || 
     (Boolean(reservation?.isCurrentStay) && currentRoom?.status === 'occupied'));

  const isGuestDeposited = depositAmount > 0;
  const canAccessGuestBill = isCheckedIn || isGuestDeposited;

  const handleUpdateRoomRow = (id: string, field: keyof RoomRowItem, value: any) => {
    setRoomRows(prev => prev.map(row => {
      if (row.id === id) {
        let updated = { ...row, [field]: value };
        
        if (field === 'tariffUSD') {
          setNetTariff(Number(value) || 0);
        }

        // 1. If arrival date is updated: calculate day of week and adjust nights or departure
        if (field === 'arrival') {
          const arrD = parseCustomDate(value);
          if (arrD) {
            updated.arrivalDay = getDayName(arrD);
            const depD = parseCustomDate(updated.depart);
            if (depD && depD.getTime() > arrD.getTime()) {
              const diffNights = Math.max(1, Math.round((depD.getTime() - arrD.getTime()) / (1000 * 60 * 60 * 24)));
              updated.nights = diffNights;
            } else {
              // Recalculate departure date from arrival + nights
              const newDepD = new Date(arrD.getTime() + (Number(updated.nights) || 1) * 86400000);
              updated.depart = formatDateToDDMMYY(newDepD);
              updated.departDay = getDayName(newDepD);
            }
          }
        }

        // 2. If depart date is updated: calculate day of week and adjust nights based on arrival
        if (field === 'depart') {
          const depD = parseCustomDate(value);
          if (depD) {
            updated.departDay = getDayName(depD);
            const arrD = parseCustomDate(updated.arrival);
            if (arrD) {
              const diffNights = Math.max(1, Math.round((depD.getTime() - arrD.getTime()) / (1000 * 60 * 60 * 24)));
              updated.nights = diffNights;
            }
          }
        }

        // 3. If nights count is updated: recalculate departure date and departure day
        if (field === 'nights') {
          const n = Math.max(1, Number(value) || 1);
          updated.nights = n;
          const arrD = parseCustomDate(updated.arrival);
          if (arrD) {
            const newDepD = new Date(arrD.getTime() + n * 86400000);
            updated.depart = formatDateToDDMMYY(newDepD);
            updated.departDay = getDayName(newDepD);
          }
        }

        return updated;
      }
      return row;
    }));
  };

  // Click Refresh Before Edit Handlers & Role Policy Guards
  const handleRefresh = () => {
    if (reservation) {
      const baseRate = reservation.rate || rooms.find(r => r.id === reservation.roomId)?.pricePerNight || 30.00;
      setNetTariff(baseRate);
      setTariffDiscPercent('');
      setTariffDiscAmt(0);
    } else {
      setTariffDiscPercent('');
      setTariffDiscAmt(0);
      setNetTariff(30.00);
    }
    setIsRefreshed(true);
    setShowRefreshAlert(false);
    if (settings.soundEffects) playChime();

    setRefreshNotification('✓ Reservation data refreshed & synchronized. Editing is now unlocked.');
    setTimeout(() => setRefreshNotification(null), 4000);
  };

  const checkCanEdit = (e?: React.SyntheticEvent): boolean => {
    if (isRoleRequireRefresh && !isRefreshed) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setShowRefreshAlert(true);
      if (settings.soundEffects) playChime();
      return false;
    }
    return true;
  };

  const handleFormChangeCapture = (e: React.FormEvent) => {
    if (isRoleRequireRefresh && !isRefreshed) {
      e.preventDefault();
      e.stopPropagation();
      setShowRefreshAlert(true);
      if (settings.soundEffects) playChime();
    }
  };

  const handleFormKeyDownCapture = (e: React.KeyboardEvent) => {
    if (['Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Control', 'Alt', 'Meta', 'Shift'].includes(e.key)) {
      return;
    }
    if (isRoleRequireRefresh && !isRefreshed) {
      const target = e.target as HTMLElement;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
        e.preventDefault();
        e.stopPropagation();
        setShowRefreshAlert(true);
        if (settings.soundEffects) playChime();
      }
    }
  };

  const handleSaveRoleSettings = () => {
    setIsRefreshPolicyEnabled(tempPolicyEnabled);
    setRefreshRequiredRoles(tempRefreshRoles);
    try {
      localStorage.setItem('winhms_refresh_policy_enabled', String(tempPolicyEnabled));
      localStorage.setItem('winhms_refresh_required_roles', JSON.stringify(tempRefreshRoles));
      localStorage.setItem('winhms_current_operator_role', simulatedRole);
    } catch (e) {
      console.error(e);
    }
    setIsRoleConfigModalOpen(false);
    setRefreshNotification(`Role policy saved. Active role: ${activeOperatorRole}.`);
    setTimeout(() => setRefreshNotification(null), 4000);
    if (settings.soundEffects) playChime();
  };

  const handleAddRoomRow = () => {
    if (!checkCanEdit()) return;
    const nextRoom = rooms.find(r => !roomRows.some(row => row.room === r.roomNumber)) || rooms[0];
    const newId = `row-${Date.now()}`;
    const newRow: RoomRowItem = {
      id: newId,
      type: nextRoom?.type?.toLowerCase().includes('twin') ? 'DLT' : 'DLD',
      roomTypeName: nextRoom?.type || 'Deluxe Suite',
      arrival: roomRows[0]?.arrival || '22/08/26',
      arrivalTime: roomRows[0]?.arrivalTime ? formatTo12Hour(roomRows[0].arrivalTime) : '02:00 PM',
      arrivalDay: roomRows[0]?.arrivalDay || 'Sat',
      nights: roomRows[0]?.nights || 1,
      depart: roomRows[0]?.depart || '23/08/26',
      departTime: roomRows[0]?.departTime ? formatTo12Hour(roomRows[0].departTime) : '12:00 PM',
      departDay: roomRows[0]?.departDay || 'Sun',
      rms: 1,
      adult: nextRoom?.maxGuests || 2,
      child: 0,
      room: nextRoom?.roomNumber || '101',
      rateCode: 'Room Only',
      tariffUSD: nextRoom?.pricePerNight || 30.00,
      plan: 'Onl',
      status: 'Confirmed',
    };
    setRoomRows(prev => [...prev, newRow]);
    setSelectedRowIndex(roomRows.length);
  };

  const handleRemoveRoomRow = (id: string) => {
    if (!checkCanEdit()) return;
    if (roomRows.length <= 1) return;
    setRoomRows(prev => prev.filter(r => r.id !== id));
    setSelectedRowIndex(0);
  };

  const handleOpenFolio = () => {
    const combinedName = `${title} ${lastName} ${firstName}`.trim();
    const targetRoom = currentRoom || rooms.find(r => r.roomNumber === (roomRows[0]?.room || '15')) || rooms[0];
    if (onViewFolio && targetRoom) {
      onViewFolio(targetRoom, combinedName);
    }
  };

  const handleSave = (keepOpen: boolean = false) => {
    if (!checkCanEdit()) return;
    const combinedName = `${title} ${lastName} ${firstName}`.trim();
    if (settings.soundEffects) playChime();

    // Auto-post deposit to guest bill / folio ledger
    syncDepositToGuestFolio(depositAmount, payMode, referNumber, combinedName, roomRows[0]?.room);

    // Record amendment audit entry in audit trail ledger
    const resIdKey = rsrNo || reservation?.reservationNumber || reservation?.id || '15';
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)}`;
    const timeFormatted = now.toTimeString().split(' ')[0];
    const saveTimestamp = `${dateFormatted} ${timeFormatted}`;

    const amendAuditRecord: ReservationAuditRecord = {
      id: `audit-${Date.now()}`,
      timestamp: saveTimestamp,
      userName: settings.managerName || 'Alexandre Laurent',
      userRole: 'General Manager / Front Office',
      actionType: 'Amended',
      details: `Reservation amended: Room ${roomRows[0]?.room || '15'} (${roomRows[0]?.type || 'DLD'}), Rate Plan: ${roomRows[0]?.rateCode || 'Room Only'} (${roomRows[0]?.plan || 'RO'}), Tariff: $${netTariff.toFixed(2)}, Arrival: ${roomRows[0]?.arrivalTime ? formatTo12Hour(roomRows[0].arrivalTime) : '02:00 PM'}, Depart: ${roomRows[0]?.departTime ? formatTo12Hour(roomRows[0].departTime) : '12:00 PM'}, Deposit: $${depositAmount.toFixed(2)}, Status: ${guestExpectedStatus}`,
      terminal: 'WS-DESK-MGR (Current Workstation)'
    };

    const updatedLogs = [amendAuditRecord, ...auditLogs];
    setAuditLogs(updatedLogs);
    try {
      localStorage.setItem(`winhms_res_audit_${resIdKey}`, JSON.stringify(updatedLogs));
    } catch (e) {
      console.error(e);
    }

    const savedReservationPayload: ReservationEditData = {
      ...(reservation || {
        id: `res-${Date.now()}`,
        roomId: currentRoom?.id || '1',
        roomNumber: roomRows[0]?.room || '15',
        checkInDate: '2026-08-22',
        checkOutDate: '2026-08-23',
        guestsCount: 2,
        rate: netTariff,
        paymentMethod: 'Cash',
      }),
      roomId: currentRoom?.id || reservation?.roomId || '1',
      roomNumber: roomRows[0]?.room || reservation?.roomNumber || '15',
      guestName: combinedName,
      guestPhone: referNumber || reservation?.guestPhone,
      rate: netTariff,
      paymentMethod: payMode as PaymentMethod,
      notes: instructionsReservation,
      vipStatus: guestStatus.toLowerCase().includes('vip'),
      title,
      firstName,
      lastName,
      reservationNumber: rsrNo,
      guestStatus,
      guestType,
      segment,
      payMode,
      reserveMode,
      billingInstruction,
      businessSource,
      memberNumber: member,
      currency,
      skipTariffInRegCard,
      upgrade,
      visitPurpose,
      netTariff,
      companyName: company,
      groupName: group,
      reservationInstructions: instructionsReservation,
      gstSpecialRequest,
      checkInRemarks,
      checkOutRemarks,
      posRemarks,
      voucherCode,
      referNumber,
      depositAmount,
      guestExpectedStatus,
      rateCode: roomRows[0]?.rateCode || 'Room Only',
      planCode: roomRows[0]?.plan || 'RO',
      arrivalTime: roomRows[0]?.arrivalTime ? formatTo12Hour(roomRows[0].arrivalTime) : '02:00 PM',
      departTime: roomRows[0]?.departTime ? formatTo12Hour(roomRows[0].departTime) : '12:00 PM',
      checkInTime: roomRows[0]?.arrivalTime ? formatTo12Hour(roomRows[0].arrivalTime) : '02:00 PM',
      checkOutTime: roomRows[0]?.departTime ? formatTo12Hour(roomRows[0].departTime) : '12:00 PM',
      roomRows,
    };

    onSaveReservation(savedReservationPayload, keepOpen);

    if (keepOpen) {
      setSaveNotice('Reservation saved! Continue checking other rooms or options.');
      setTimeout(() => {
        setSaveNotice(null);
      }, 4000);
    } else {
      onClose();
    }
  };

  const handleConfirmGuestCancel = () => {
    const targetRoomNo = roomRows[0]?.room || reservation?.roomNumber || currentRoom?.roomNumber || '15';
    const targetGuest = lastName ? `${title || ''} ${lastName} ${firstName || ''}`.trim() : (reservation?.guestName || 'Guest');
    const arrivalVal = roomRows[0]?.arrival || reservation?.checkInDate || '22/08/26';
    let monthStr = '2026-08';
    let isoDate = '2026-08-22';
    if (arrivalVal.includes('/')) {
      const parts = arrivalVal.split('/');
      if (parts.length === 3) {
        const yr = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        monthStr = `${yr}-${parts[1].padStart(2, '0')}`;
        isoDate = `${yr}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    } else if (arrivalVal.includes('-')) {
      isoDate = arrivalVal;
      monthStr = arrivalVal.slice(0, 7);
    }
    const seq = Math.floor(1000 + Math.random() * 9000);
    const voucher = `CAN-2026-${seq}`;

    if (settings.soundEffects) playChime();

    if (onCancelReservation && (reservation?.id || targetRoomNo)) {
      onCancelReservation(reservation?.id, reservation?.roomId, 'cancel', {
        guestName: targetGuest,
        roomNumber: targetRoomNo,
        rate: netTariff,
        reason: `${cancelReasonPreset}${cancelCustomNotes ? ` — ${cancelCustomNotes}` : ''}`,
        date: isoDate,
        paymentMethod: (payMode as PaymentMethod) || 'Cash',
        notes: `Policy: ${cancelRefundPolicy}`
      });
    }

    setCancelModalAction('none');
    setCancelResultToast({
      type: 'cancel',
      guest: targetGuest,
      room: targetRoomNo,
      voucher,
      month: monthStr
    });
  };

  const handleConfirmDelete = () => {
    const targetRoomNo = roomRows[0]?.room || reservation?.roomNumber || currentRoom?.roomNumber || '15';
    const targetGuest = lastName ? `${title || ''} ${lastName} ${firstName || ''}`.trim() : (reservation?.guestName || 'Guest');
    const arrivalVal = roomRows[0]?.arrival || reservation?.checkInDate || '22/08/26';
    let monthStr = '2026-08';
    let isoDate = '2026-08-22';
    if (arrivalVal.includes('/')) {
      const parts = arrivalVal.split('/');
      if (parts.length === 3) {
        const yr = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        monthStr = `${yr}-${parts[1].padStart(2, '0')}`;
        isoDate = `${yr}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    } else if (arrivalVal.includes('-')) {
      isoDate = arrivalVal;
      monthStr = arrivalVal.slice(0, 7);
    }
    const seq = Math.floor(1000 + Math.random() * 9000);
    const voucher = `DEL-2026-${seq}`;

    if (settings.soundEffects) playChime();

    if (onCancelReservation && (reservation?.id || targetRoomNo)) {
      onCancelReservation(reservation?.id, reservation?.roomId, 'delete', {
        guestName: targetGuest,
        roomNumber: targetRoomNo,
        rate: netTariff,
        reason: `${deleteReasonPreset}${deleteCustomNotes ? ` — ${deleteCustomNotes}` : ''}`,
        date: isoDate,
        paymentMethod: (payMode as PaymentMethod) || 'Cash',
        notes: 'Purged record from reservation ledger'
      });
    }

    setCancelModalAction('none');
    setCancelResultToast({
      type: 'delete',
      guest: targetGuest,
      room: targetRoomNo,
      voucher,
      month: monthStr
    });
  };

  const totalReservedRooms = roomRows.reduce((sum, r) => sum + (Number(r.rms) || 1), 0) || 1;
  const totalReservedNights = roomRows.reduce((sum, r) => sum + ((Number(r.rms) || 1) * (Number(r.nights) || 1)), 0) || 1;
  
  // Calculate checked-in rooms and nights strictly based on status
  const isCheckedInReservation = reservation?.status === 'Checked-in' || reservation?.status === 'Occupied';
  const checkedInRoomsCount = isCheckedInReservation 
    ? (roomRows.reduce((sum, r) => sum + (Number(r.rms) || 1), 0) || 1)
    : roomRows.filter(r => r.status === 'Checked-in' || r.status === 'Occupied').reduce((sum, r) => sum + (Number(r.rms) || 1), 0);
    
  const checkedInNightsCount = isCheckedInReservation 
    ? (roomRows.reduce((sum, r) => sum + ((Number(r.rms) || 1) * (Number(r.nights) || 1)), 0) || 1)
    : roomRows.filter(r => r.status === 'Checked-in' || r.status === 'Occupied').reduce((sum, r) => sum + ((Number(r.rms) || 1) * (Number(r.nights) || 1)), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[2px] p-1 sm:p-3 overflow-y-auto animate-in fade-in select-none">
      
      {/* Authentic Windows PMS Dialog Box */}
      <div 
        id="amend-reservation-dialog"
        className="w-full max-w-[1020px] rounded-t-lg rounded-b shadow-[0_15px_50px_rgba(0,0,0,0.9)] border-[3px] border-[#9bc2e6] bg-[#f0f4f9] text-[#111827] text-[11px] font-sans overflow-hidden my-auto leading-tight"
        style={{ fontFamily: "'Tahoma', 'Segoe UI', Arial, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 1. TITLE BAR */}
        <div className="bg-gradient-to-r from-[#d9ebfb] via-[#bddcf7] to-[#99c4eb] border-b border-[#7fa8cf] px-2.5 py-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-bold text-[#1e3a5f] tracking-wide flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-purple-700" />
              <span>Amend Reservation / Booking</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button 
              type="button" 
              onClick={onClose}
              className="w-5 h-5 rounded border border-[#89a7c4] bg-[#eef5fc] hover:bg-[#d8e8f8] flex items-center justify-center text-neutral-700 hover:text-black transition-colors"
              title="Minimize"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button 
              type="button" 
              className="w-5 h-5 rounded border border-[#89a7c4] bg-[#eef5fc] hover:bg-[#d8e8f8] flex items-center justify-center text-neutral-700 hover:text-black transition-colors"
              title="Maximize"
            >
              <Square className="w-2.5 h-2.5" />
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="w-5 h-5 rounded border border-[#c47272] bg-[#fcd8d8] hover:bg-[#f8a8a8] flex items-center justify-center text-red-800 hover:text-black transition-colors font-bold"
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 2. TOP STATS & TOOLBAR */}
        <div className="bg-[#f0f4f9] px-3 py-1.5 border-b border-[#cbd5e1] flex flex-wrap items-center justify-between gap-2">
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-0.5 bg-neutral-200 border border-neutral-400 rounded-xs">
              <BarChart2 className="w-4 h-4 text-purple-700" />
            </div>

            <div className="flex items-center gap-1">
              <span className="font-semibold text-neutral-700">Rsr No</span>
              <input
                type="text"
                value={rsrNo}
                onChange={(e) => setRsrNo(e.target.value)}
                className="w-16 h-5 px-1 bg-white border border-neutral-400 rounded-xs font-mono font-bold text-neutral-900 text-center focus:outline-none focus:border-blue-600"
              />
            </div>

            <table className="border-collapse border border-neutral-400 bg-white text-[10px] text-center font-mono">
              <tbody>
                <tr>
                  <td className="px-1.5 py-0.5 bg-[#e2e8f0] text-neutral-700 font-sans">Reserved</td>
                  <td className="px-2 py-0.5 font-bold text-blue-800 border-l border-neutral-300">
                    {totalReservedRooms}R
                  </td>
                  <td className="px-2 py-0.5 font-bold text-blue-800 border-l border-neutral-300">
                    {totalReservedNights}N
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="flex items-center gap-1 px-2 py-0.5">
              <span className="font-black text-red-600 tracking-wide text-xs">
                {roomRows.length}/{rooms.length} ROOMS
              </span>
            </div>

            <button 
              type="button"
              onClick={handleAddRoomRow}
              className="flex items-center gap-1 px-2 h-5 bg-[#e2f0d9] hover:bg-[#d0e8c5] border border-[#a9d18e] rounded-xs font-bold text-[#385723] text-[10px] shadow-2xs transition-colors cursor-pointer"
              title="Add another room row to this reservation"
            >
              <span>+ Add Room</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* DEDICATED DEPOSIT PLACE IN TOP TOOLBAR */}
            <div 
              id="top-toolbar-deposit-box"
              className={`flex items-center gap-1 px-2 py-0.5 rounded-xs border shadow-2xs transition-all ${
                depositAmount > 0 
                  ? 'bg-[#ecfdf5] border-[#6ee7b7] text-emerald-950 ring-1 ring-emerald-400/40' 
                  : 'bg-[#f8fafc] border-[#cbd5e1] text-neutral-800'
              }`}
            >
              <Receipt className={`w-3.5 h-3.5 ${depositAmount > 0 ? 'text-emerald-700' : 'text-neutral-500'}`} />
              <span className="font-bold text-[10px] whitespace-nowrap">Deposit:</span>
              <div className="flex items-center gap-0.5 bg-white border border-neutral-300 rounded-xs px-1 h-5">
                <span className="text-[10px] text-neutral-400 font-mono">$</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={depositAmount || ''}
                  onChange={(e) => setDepositAmount(Number(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-14 text-[10.5px] text-right font-mono font-bold text-neutral-900 bg-transparent focus:outline-none"
                  title="Quick Edit Deposit Amount"
                />
              </div>
              <button
                type="button"
                id="btn-toolbar-deposit-mgr"
                onClick={openDepositManager}
                className="px-2 h-5 bg-[#059669] hover:bg-[#047857] text-white rounded-xs text-[10px] font-bold shadow-2xs cursor-pointer active:scale-95 transition-colors flex items-center gap-1"
                title="Open Deposit Manager & Receipt"
              >
                <span>Deposit Mgr</span>
              </button>
            </div>

            <button 
              type="button"
              className="p-0.5 bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 rounded-xs text-neutral-700"
              title="Group Allocation"
            >
              <Users className="w-4 h-4 text-teal-700" />
            </button>
          </div>

        </div>

        {/* 3. ROOM & TARIFF DATA GRID */}
        <div 
          className="p-2 overflow-x-auto bg-[#f8fafc]"
          onKeyDownCapture={handleFormKeyDownCapture}
          onChangeCapture={handleFormChangeCapture}
        >
          <table className="w-full border-collapse border border-[#94a3b8] bg-white text-[11px] text-left">
            <thead>
              <tr className="bg-[#e2e8f0] text-neutral-800 font-semibold border-b border-[#94a3b8] text-[10px]">
                <th className="px-1 py-1 border-r border-[#cbd5e1] text-center whitespace-nowrap w-8" title="Select room to edit or remove">Sel</th>
                <th className="px-1.5 py-1 border-r border-[#cbd5e1] whitespace-nowrap">Type</th>
                <th className="px-1.5 py-1 border-r border-[#cbd5e1] whitespace-nowrap min-w-[110px]">Room Type Name</th>
                <th className="px-1.5 py-1 border-r border-[#cbd5e1] whitespace-nowrap">Arrival</th>
                <th className="px-1.5 py-1 border-r border-[#cbd5e1] whitespace-nowrap min-w-[94px]">Time (AM/PM)</th>
                <th className="px-1.5 py-1 border-r border-[#cbd5e1] text-center whitespace-nowrap">Nights</th>
                <th className="px-1.5 py-1 border-r border-[#cbd5e1] whitespace-nowrap">Depart</th>
                <th className="px-1.5 py-1 border-r border-[#cbd5e1] whitespace-nowrap min-w-[94px]">Time (AM/PM)</th>
                <th className="px-1 py-1 border-r border-[#cbd5e1] text-center whitespace-nowrap">Rms</th>
                <th className="px-1 py-1 border-r border-[#cbd5e1] text-center whitespace-nowrap">Adult</th>
                <th className="px-1 py-1 border-r border-[#cbd5e1] text-center whitespace-nowrap">Child</th>
                <th className="px-1.5 py-1 border-r border-[#cbd5e1] text-center whitespace-nowrap min-w-[65px]">Room</th>
                <th className="px-2 py-1 border-r border-[#cbd5e1] whitespace-nowrap min-w-[90px]">Rate Code</th>
                <th className="px-2 py-1 border-r border-[#cbd5e1] text-right whitespace-nowrap min-w-[75px]">Tariff(USD)</th>
                <th className="px-1.5 py-1 border-r border-[#cbd5e1] text-center whitespace-nowrap">Plan</th>
                <th className="px-1.5 py-1 border-r border-[#cbd5e1] text-left whitespace-nowrap min-w-[80px]">Status</th>
                <th className="px-1.5 py-1 text-center whitespace-nowrap text-[9px] min-w-[70px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {roomRows.map((row, idx) => (
                <tr 
                  key={row.id} 
                  onClick={() => setSelectedRowIndex(idx)}
                  className={`border-b border-[#e2e8f0] cursor-pointer transition-colors ${
                    selectedRowIndex === idx ? 'bg-[#fffae6] ring-1 ring-amber-400/50' : 'hover:bg-neutral-50'
                  }`}
                >
                  <td className="px-1 py-1 border-r border-[#cbd5e1] text-center">
                    <input 
                      type="radio"
                      name="selectedRoomRowRadio"
                      checked={selectedRowIndex === idx}
                      onChange={() => setSelectedRowIndex(idx)}
                      className="cursor-pointer accent-amber-600"
                      title={`Select Room #${row.room}`}
                    />
                  </td>

                  <td className="px-1.5 py-1 border-r border-[#cbd5e1] font-mono font-bold text-neutral-800">
                    <input 
                      type="text"
                      value={row.type}
                      onChange={(e) => handleUpdateRoomRow(row.id, 'type', e.target.value)}
                      className="w-10 h-4 px-0.5 bg-transparent border-b border-dashed border-neutral-400 font-mono text-[10px] font-bold uppercase focus:bg-white focus:outline-none"
                    />
                  </td>
                  
                  <td className="px-1.5 py-1 border-r border-[#cbd5e1] font-medium text-neutral-900">
                    <select
                      value={row.roomTypeName}
                      onChange={(e) => {
                        const val = e.target.value;
                        const code = val.toLowerCase().includes('twin') ? 'DLT' : val.toLowerCase().includes('presidential') ? 'PRS' : 'DLD';
                        handleUpdateRoomRow(row.id, 'roomTypeName', val);
                        handleUpdateRoomRow(row.id, 'type', code);
                      }}
                      className="w-full h-4 bg-transparent text-[10px] font-medium focus:bg-white focus:outline-none"
                    >
                      <option value="Deluxe Double">Deluxe Double</option>
                      <option value="Deluxe Twin">Deluxe Twin</option>
                      <option value="Deluxe Suite">Deluxe Suite</option>
                      <option value="Presidential Suite">Presidential Suite</option>
                      <option value="Standard Double">Standard Double</option>
                      <option value="Standard Twin">Standard Twin</option>
                    </select>
                  </td>
                  
                  <td className="px-1.5 py-1 border-r border-[#cbd5e1] font-mono">
                    <input 
                      type="text"
                      value={row.arrival}
                      onChange={(e) => handleUpdateRoomRow(row.id, 'arrival', e.target.value)}
                      className="w-16 h-4 px-0.5 bg-transparent border-b border-dashed border-neutral-400 font-mono text-[10px] focus:bg-white focus:outline-none"
                    />
                  </td>
                  
                  <td className="px-1.5 py-1 border-r border-[#cbd5e1] font-mono">
                    <div className="flex items-center gap-1">
                      <input 
                        type="text"
                        value={row.arrivalTime}
                        list={`arrival-times-${row.id}`}
                        onChange={(e) => handleUpdateRoomRow(row.id, 'arrivalTime', e.target.value)}
                        onBlur={(e) => handleUpdateRoomRow(row.id, 'arrivalTime', formatTo12Hour(e.target.value))}
                        className="w-[66px] h-4.5 px-1 bg-white border border-neutral-300 rounded-xs font-mono text-[10px] font-bold text-neutral-900 focus:outline-none focus:border-blue-600 shadow-2xs text-center"
                        placeholder="02:00 PM"
                        title="Set arrival time with AM, PM (e.g. 02:00 PM)"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateRoomRow(row.id, 'arrivalTime', toggleAmPm(row.arrivalTime));
                        }}
                        className={`px-1 h-4.5 rounded-xs text-[9px] font-black font-mono transition-colors border cursor-pointer select-none ${
                          (row.arrivalTime || '').toUpperCase().includes('PM')
                            ? 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200'
                            : 'bg-sky-100 text-sky-900 border-sky-400 hover:bg-sky-200'
                        }`}
                        title="Click to toggle between AM and PM"
                      >
                        {(row.arrivalTime || '').toUpperCase().includes('PM') ? 'PM' : 'AM'}
                      </button>
                      <span className="text-amber-700 font-bold text-[9px] whitespace-nowrap">{row.arrivalDay}</span>
                      <datalist id={`arrival-times-${row.id}`}>
                        <option value="10:00 AM" />
                        <option value="11:00 AM" />
                        <option value="12:00 PM" />
                        <option value="01:00 PM" />
                        <option value="02:00 PM" />
                        <option value="03:00 PM" />
                        <option value="04:00 PM" />
                        <option value="05:00 PM" />
                        <option value="06:00 PM" />
                        <option value="08:00 PM" />
                      </datalist>
                    </div>
                  </td>

                  <td className="px-1.5 py-1 border-r border-[#cbd5e1] text-center font-mono font-bold">
                    <input 
                      type="number"
                      min="1"
                      value={row.nights}
                      onChange={(e) => handleUpdateRoomRow(row.id, 'nights', Number(e.target.value) || 1)}
                      className="w-8 h-4 px-0.5 bg-transparent text-center border-b border-dashed border-neutral-400 font-mono text-[10px] font-bold focus:bg-white focus:outline-none"
                    />
                  </td>

                  <td className="px-1.5 py-1 border-r border-[#cbd5e1] font-mono">
                    <input 
                      type="text"
                      value={row.depart}
                      onChange={(e) => handleUpdateRoomRow(row.id, 'depart', e.target.value)}
                      className="w-16 h-4 px-0.5 bg-transparent border-b border-dashed border-neutral-400 font-mono text-[10px] focus:bg-white focus:outline-none"
                    />
                  </td>

                  <td className="px-1.5 py-1 border-r border-[#cbd5e1] font-mono">
                    <div className="flex items-center gap-1">
                      <input 
                        type="text"
                        value={row.departTime}
                        list={`depart-times-${row.id}`}
                        onChange={(e) => handleUpdateRoomRow(row.id, 'departTime', e.target.value)}
                        onBlur={(e) => handleUpdateRoomRow(row.id, 'departTime', formatTo12Hour(e.target.value))}
                        className="w-[66px] h-4.5 px-1 bg-white border border-neutral-300 rounded-xs font-mono text-[10px] font-bold text-neutral-900 focus:outline-none focus:border-blue-600 shadow-2xs text-center"
                        placeholder="12:00 PM"
                        title="Set departure time with AM, PM (e.g. 12:00 PM)"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateRoomRow(row.id, 'departTime', toggleAmPm(row.departTime));
                        }}
                        className={`px-1 h-4.5 rounded-xs text-[9px] font-black font-mono transition-colors border cursor-pointer select-none ${
                          (row.departTime || '').toUpperCase().includes('PM')
                            ? 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200'
                            : 'bg-sky-100 text-sky-900 border-sky-400 hover:bg-sky-200'
                        }`}
                        title="Click to toggle between AM and PM"
                      >
                        {(row.departTime || '').toUpperCase().includes('PM') ? 'PM' : 'AM'}
                      </button>
                      <span className="text-amber-700 font-bold text-[9px] whitespace-nowrap">{row.departDay}</span>
                      <datalist id={`depart-times-${row.id}`}>
                        <option value="08:00 AM" />
                        <option value="09:00 AM" />
                        <option value="10:00 AM" />
                        <option value="11:00 AM" />
                        <option value="12:00 PM" />
                        <option value="01:00 PM" />
                        <option value="02:00 PM" />
                      </datalist>
                    </div>
                  </td>

                  <td className="px-1 py-1 border-r border-[#cbd5e1] text-center font-mono">
                    <input 
                      type="number"
                      min="1"
                      value={row.rms}
                      onChange={(e) => handleUpdateRoomRow(row.id, 'rms', Number(e.target.value) || 1)}
                      className="w-6 h-4 text-center bg-transparent border-b border-dashed border-neutral-400 font-mono text-[10px] focus:bg-white focus:outline-none"
                    />
                  </td>

                  <td className="px-1 py-1 border-r border-[#cbd5e1] text-center font-mono">
                    <input 
                      type="number"
                      min="1"
                      value={row.adult}
                      onChange={(e) => handleUpdateRoomRow(row.id, 'adult', Number(e.target.value) || 1)}
                      className="w-6 h-4 text-center bg-transparent border-b border-dashed border-neutral-400 font-mono text-[10px] focus:bg-white focus:outline-none"
                    />
                  </td>

                  <td className="px-1 py-1 border-r border-[#cbd5e1] text-center font-mono">
                    <input 
                      type="number"
                      min="0"
                      value={row.child}
                      onChange={(e) => handleUpdateRoomRow(row.id, 'child', Number(e.target.value) || 0)}
                      className="w-6 h-4 text-center bg-transparent border-b border-dashed border-neutral-400 font-mono text-[10px] focus:bg-white focus:outline-none"
                    />
                  </td>
                  
                  <td className="px-1.5 py-1 border-r border-[#cbd5e1] text-center font-mono font-bold text-blue-900">
                    <select
                      value={row.room}
                      onChange={(e) => {
                        const newRoom = e.target.value;
                        const match = rooms.find(r => r.roomNumber === newRoom);
                        handleUpdateRoomRow(row.id, 'room', newRoom);
                        if (match) {
                          handleUpdateRoomRow(row.id, 'roomTypeName', match.type);
                          handleUpdateRoomRow(row.id, 'tariffUSD', match.pricePerNight);
                        }
                      }}
                      className="h-4 bg-white border border-neutral-300 rounded-xs font-mono font-bold text-[10px] text-blue-900 focus:outline-none"
                    >
                      {rooms.map(r => (
                        <option key={r.id} value={r.roomNumber}>{r.roomNumber}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-1.5 py-1 border-r border-[#cbd5e1] text-neutral-800 min-w-[115px]">
                    <select
                      value={row.rateCode || 'Room Only'}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleUpdateRoomRow(row.id, 'rateCode', val);
                        if (val === 'Room with ABF') {
                          handleUpdateRoomRow(row.id, 'plan', 'ABF');
                        } else if (val === 'Room Only') {
                          handleUpdateRoomRow(row.id, 'plan', 'RO');
                        }
                      }}
                      className="w-full h-5 px-1 bg-white border border-neutral-300 rounded-xs font-medium text-[10px] text-neutral-900 focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
                      title="Select Rate Plan: Room Only or Room with ABF"
                    >
                      <option value="Room Only">Room Only</option>
                      <option value="Room with ABF">Room with ABF</option>
                      {row.rateCode && row.rateCode !== 'Room Only' && row.rateCode !== 'Room with ABF' && (
                        <option value={row.rateCode}>{row.rateCode}</option>
                      )}
                    </select>
                  </td>

                  <td className="px-2 py-1 border-r border-[#cbd5e1] text-right font-mono font-bold text-neutral-900">
                    <input 
                      type="number"
                      step="0.01"
                      value={row.tariffUSD}
                      onChange={(e) => handleUpdateRoomRow(row.id, 'tariffUSD', Number(e.target.value) || 0)}
                      className="w-14 h-4 px-0.5 bg-transparent text-right border-b border-dashed border-neutral-400 font-mono font-bold text-[10px] text-neutral-900 focus:bg-white focus:outline-none"
                    />
                  </td>

                  <td className="px-1.5 py-1 border-r border-[#cbd5e1] text-center font-mono text-neutral-700">
                    <select
                      value={row.plan || (row.rateCode === 'Room with ABF' ? 'ABF' : 'RO')}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleUpdateRoomRow(row.id, 'plan', val);
                        if (val === 'ABF' && row.rateCode !== 'Room with ABF') {
                          handleUpdateRoomRow(row.id, 'rateCode', 'Room with ABF');
                        } else if (val === 'RO' && row.rateCode !== 'Room Only') {
                          handleUpdateRoomRow(row.id, 'rateCode', 'Room Only');
                        }
                      }}
                      className="w-11 h-5 px-0.5 bg-white border border-neutral-300 rounded-xs font-mono font-bold text-[10px] text-center text-neutral-900 focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
                      title="Meal Plan Code (RO / ABF)"
                    >
                      <option value="RO">RO</option>
                      <option value="ABF">ABF</option>
                      {row.plan && row.plan !== 'RO' && row.plan !== 'ABF' && (
                        <option value={row.plan}>{row.plan}</option>
                      )}
                    </select>
                  </td>

                  <td className="px-1.5 py-1 border-r border-[#cbd5e1] font-semibold text-emerald-800">
                    <select
                      value={row.status}
                      onChange={(e) => handleUpdateRoomRow(row.id, 'status', e.target.value)}
                      className="h-4 bg-transparent font-semibold text-[10px] text-emerald-800 focus:bg-white focus:outline-none cursor-pointer"
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Reserved">Reserved</option>
                      <option value="In-House">In-House</option>
                      <option value="Waitlist">Waitlist</option>
                      <option value="Checked In">Checked In</option>
                    </select>
                  </td>

                  <td className="px-1.5 py-1 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (roomRows.length > 1) {
                          handleRemoveRoomRow(row.id);
                        } else {
                          alert('Reservation must have at least 1 room.');
                        }
                      }}
                      disabled={roomRows.length <= 1}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-bold border transition-all ${
                        roomRows.length > 1
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 cursor-pointer active:scale-95 shadow-2xs'
                          : 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-50'
                      }`}
                      title={roomRows.length > 1 ? `Remove Room #${row.room}` : 'At least 1 room is required'}
                    >
                      <Trash2 className="w-2.5 h-2.5 text-rose-600" />
                      <span>Remove</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. MAIN SPLIT FORM BODY */}
        <div 
          className="p-3 grid grid-cols-1 lg:grid-cols-12 gap-4 border-t border-[#cbd5e1] bg-[#f0f4f9]"
          onKeyDownCapture={handleFormKeyDownCapture}
          onChangeCapture={handleFormChangeCapture}
        >
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-6 space-y-2 text-[11px]">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-bold text-neutral-800 min-w-[32px]">Gst1</span>
              
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[11px] font-medium"
              >
                <option value="Ms.">Ms.</option>
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Dr.">Dr.</option>
                <option value="H.E.">H.E.</option>
              </select>

              <div className="flex-1 min-w-[120px]">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  className="w-full h-5 px-1.5 bg-white border border-neutral-400 rounded-xs text-[11px] font-bold text-neutral-900 uppercase focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="w-16">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First"
                  className="w-full h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[11px] text-neutral-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <button 
                type="button"
                onClick={() => {
                  const newName = prompt('Add Companion Guest Name:');
                  if (newName) setLastName(prev => `${prev} / ${newName}`);
                }}
                className="w-5 h-5 bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 rounded-xs flex items-center justify-center font-bold text-neutral-800"
                title="Add Guest"
              >
                +
              </button>
              
              <span className="text-neutral-700 text-[10px] ml-1">Status</span>
              <select
                value={guestExpectedStatus}
                onChange={(e) => setGuestExpectedStatus(e.target.value)}
                className="h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[10px]"
              >
                <option value="Expected">Expected</option>
                <option value="Checked In">Checked In</option>
                <option value="Checked Out">Checked Out</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <button 
                type="button"
                className="w-5 h-5 bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 rounded-xs flex items-center justify-center font-bold text-neutral-800"
              >
                T
              </button>
            </div>

            <div className="space-y-1 pt-1">
              {/* Row 1: GuestStatus & Reserve Mode */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6 flex items-center gap-1">
                  <span className="font-semibold text-neutral-800 text-[10px] whitespace-nowrap min-w-[62px]">GuestStatus</span>
                  <select
                    value={guestStatus}
                    onChange={(e) => setGuestStatus(e.target.value)}
                    className="flex-1 min-w-0 h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[10px] truncate"
                  >
                    {guestStatusOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => openDirectListing('guest_status', 'Guest Status', guestStatusOptions, guestStatus, setGuestStatusOptions, setGuestStatus)}
                    className="w-5 h-5 shrink-0 bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 rounded-xs flex items-center justify-center text-[11px] font-bold text-neutral-800 active:scale-95 cursor-pointer"
                    title="Open Direct Master Listing & Add New Guest Status"
                  >
                    +
                  </button>
                </div>
                <div className="col-span-6 flex items-center gap-1">
                  <span className="font-semibold text-neutral-800 text-[10px] whitespace-nowrap min-w-[68px]">Reserve Mode</span>
                  <select
                    value={reserveMode}
                    onChange={(e) => setReserveMode(e.target.value)}
                    className="flex-1 min-w-0 h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[10px] truncate"
                  >
                    {reserveModeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => openDirectListing('reserve_mode', 'Reserve Mode', reserveModeOptions, reserveMode, setReserveModeOptions, setReserveMode)}
                    className="w-5 h-5 shrink-0 bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 rounded-xs flex items-center justify-center text-[11px] font-bold text-neutral-800 active:scale-95 cursor-pointer"
                    title="Open Direct Master Listing & Add New Reserve Mode"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Row 2: Guest Type & Billing Inst */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6 flex items-center gap-1">
                  <span className="font-semibold text-neutral-800 text-[10px] whitespace-nowrap min-w-[62px]">Guest Type</span>
                  <select
                    value={guestType}
                    onChange={(e) => setGuestType(e.target.value)}
                    className="flex-1 min-w-0 h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[10px] truncate"
                  >
                    {guestTypeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => openDirectListing('guest_type', 'Guest Type', guestTypeOptions, guestType, setGuestTypeOptions, setGuestType)}
                    className="w-5 h-5 shrink-0 bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 rounded-xs flex items-center justify-center text-[11px] font-bold text-neutral-800 active:scale-95 cursor-pointer"
                    title="Open Direct Master Listing & Add New Guest Type"
                  >
                    +
                  </button>
                </div>
                <div className="col-span-6 flex items-center gap-1">
                  <span className="font-semibold text-neutral-800 text-[10px] whitespace-nowrap min-w-[68px]">Billing Inst</span>
                  <select
                    value={billingInstruction}
                    onChange={(e) => setBillingInstruction(e.target.value)}
                    className="flex-1 min-w-0 h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[10px] truncate"
                  >
                    {billingInstructionOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => openDirectListing('billing_instruction', 'Billing Instruction', billingInstructionOptions, billingInstruction, setBillingInstructionOptions, setBillingInstruction)}
                    className="w-5 h-5 shrink-0 bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 rounded-xs flex items-center justify-center text-[11px] font-bold text-neutral-800 active:scale-95 cursor-pointer"
                    title="Open Direct Master Listing & Add New Billing Instruction"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Row 3: Segment & BusinessSource */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6 flex items-center gap-1">
                  <span className="font-semibold text-neutral-800 text-[10px] whitespace-nowrap min-w-[62px]">Segment</span>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="flex-1 min-w-0 h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[10px] truncate"
                  >
                    {segmentOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => openDirectListing('segment', 'Segment', segmentOptions, segment, setSegmentOptions, setSegment)}
                    className="w-5 h-5 shrink-0 bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 rounded-xs flex items-center justify-center text-[11px] font-bold text-neutral-800 active:scale-95 cursor-pointer"
                    title="Open Direct Master Listing & Add New Segment"
                  >
                    +
                  </button>
                </div>
                <div className="col-span-6 flex items-center gap-1">
                  <span className="font-semibold text-neutral-800 text-[10px] whitespace-nowrap min-w-[68px]">BusinessSource</span>
                  <select
                    value={businessSource}
                    onChange={(e) => setBusinessSource(e.target.value)}
                    className="flex-1 min-w-0 h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[10px] truncate"
                  >
                    {businessSourceOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => openDirectListing('business_source', 'Business Source', businessSourceOptions, businessSource, setBusinessSourceOptions, setBusinessSource)}
                    className="w-5 h-5 shrink-0 bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 rounded-xs flex items-center justify-center text-[11px] font-bold text-neutral-800 active:scale-95 cursor-pointer"
                    title="Open Direct Master Listing & Add New Business Source"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Row 4: Pay Mode */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6 flex items-center gap-1">
                  <span className="font-semibold text-neutral-800 text-[10px] whitespace-nowrap min-w-[62px]">Pay Mode</span>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="flex-1 min-w-0 h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[10px] truncate"
                  >
                    {payModeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => openDirectListing('pay_mode', 'Payment Mode', payModeOptions, payMode, setPayModeOptions, setPayMode)}
                    className="w-5 h-5 shrink-0 bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 rounded-xs flex items-center justify-center text-[11px] font-bold text-neutral-800 active:scale-95 cursor-pointer"
                    title="Open Direct Master Listing & Add New Payment Mode"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 pt-2">
              <span className="font-semibold text-neutral-800 text-[10px] min-w-[70px]">Member</span>
              <div className="flex-1 flex items-center gap-1">
                <input
                  type="text"
                  value={member}
                  onChange={(e) => setMember(e.target.value)}
                  placeholder="Membership Number"
                  className="w-full h-5 px-1.5 bg-white border border-neutral-400 rounded-xs text-[11px]"
                />
                <button 
                  type="button" 
                  onClick={() => setMember('')}
                  className="w-5 h-5 bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 rounded-xs flex items-center justify-center text-[10px] font-bold text-red-700"
                >
                  X
                </button>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-neutral-800 text-[10px] min-w-[70px]">Currency</span>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-24 h-5 px-1.5 bg-white border border-neutral-400 rounded-xs text-[10px] font-bold"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="font-semibold text-neutral-800 text-[10px] min-w-[70px]">Visit Purpose</span>
                <input
                  type="text"
                  value={visitPurpose}
                  onChange={(e) => setVisitPurpose(e.target.value)}
                  placeholder="Holiday, Leisure, Business..."
                  className="flex-1 h-5 px-1.5 bg-white border border-neutral-400 rounded-xs text-[10px]"
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-6 space-y-2 text-[11px]">
            <div className="bg-white border border-neutral-300 p-2 rounded-xs space-y-1.5 shadow-xs">
              <div className="grid grid-cols-12 gap-1 items-center">
                <span className="col-span-3 text-neutral-700 text-[10px] whitespace-nowrap">Tariff Disc. %</span>
                <input
                  type="text"
                  value={tariffDiscPercent}
                  onChange={(e) => setTariffDiscPercent(e.target.value)}
                  className="col-span-2 h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[10px] text-center font-mono"
                />
                <span className="col-span-2 text-neutral-700 text-[10px] text-right pr-1">Disc.Amt</span>
                <input
                  type="number"
                  step="0.01"
                  value={tariffDiscAmt}
                  onChange={(e) => setTariffDiscAmt(Number(e.target.value) || 0)}
                  className="col-span-2 h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[10px] text-right font-mono"
                />
                <div className="col-span-3 flex items-center gap-1 pl-1">
                  <span className="bg-[#fff3cd] text-[#856404] font-bold px-1 py-0.5 rounded-xs border border-[#ffeeba] text-[10px] whitespace-nowrap">
                    Net Tariff
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={netTariff}
                    onChange={(e) => setNetTariff(Number(e.target.value) || 0)}
                    className="w-14 h-5 px-1 bg-white border border-neutral-500 rounded-xs text-[11px] text-right font-mono font-bold text-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-1 items-center">
                <span className="col-span-3 text-neutral-700 text-[10px] whitespace-nowrap">Plan Amount</span>
                <input
                  type="number"
                  step="0.01"
                  value={planAmount}
                  onChange={(e) => setPlanAmount(Number(e.target.value) || 0)}
                  className="col-span-2 h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[10px] text-right font-mono"
                />
                <input
                  type="text"
                  value="0.00"
                  readOnly
                  className="col-span-2 h-5 px-1 bg-neutral-100 border border-neutral-300 rounded-xs text-[10px] text-right font-mono text-neutral-500"
                />
                <span className="col-span-2 text-neutral-700 text-[10px] text-right pr-1">Plan Disc.%</span>
                <input
                  type="text"
                  value={planDiscPercent}
                  onChange={(e) => setPlanDiscPercent(e.target.value)}
                  className="col-span-1 h-5 px-0.5 bg-white border border-neutral-400 rounded-xs text-[10px] text-center font-mono"
                />
                <span className="col-span-1 text-neutral-700 text-[9px] text-right">Disc Amt</span>
                <input
                  type="number"
                  step="0.01"
                  value={planDiscAmt}
                  onChange={(e) => setPlanDiscAmt(Number(e.target.value) || 0)}
                  className="col-span-1 h-5 px-0.5 bg-white border border-neutral-400 rounded-xs text-[9px] text-right font-mono"
                />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-neutral-800 text-[10px] min-w-[55px]">Company</span>
                <div className="flex-1 flex items-center gap-1">
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="flex-1 h-5 px-1.5 bg-white border border-neutral-400 rounded-xs text-[10px] font-semibold text-neutral-800 uppercase"
                  />
                  <button type="button" onClick={() => setCompany('')} className="w-5 h-5 bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 rounded-xs flex items-center justify-center text-[10px] font-bold text-red-700">
                    X
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="font-semibold text-neutral-800 text-[10px] min-w-[55px]">Group</span>
                <div className="flex-1 flex items-center gap-1">
                  <input
                    type="text"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    placeholder="Group Code or Name"
                    className="flex-1 h-5 px-1.5 bg-white border border-neutral-400 rounded-xs text-[10px]"
                  />
                  <button type="button" onClick={() => setGroup('')} className="w-5 h-5 bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 rounded-xs flex items-center justify-center text-[10px] font-bold text-red-700">
                    X
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-700 text-[11px]">Instructions</span>
              </div>

              <div className="flex items-start gap-1">
                <span className="text-[10px] font-semibold text-neutral-800 min-w-[65px] pt-1">Reservation</span>
                <div className="flex-1 flex items-start gap-1">
                  <textarea
                    rows={3}
                    value={instructionsReservation}
                    onChange={(e) => setInstructionsReservation(e.target.value)}
                    className="w-full p-1 bg-white border border-neutral-400 rounded-xs text-[10px] font-mono leading-tight uppercase resize-none focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-neutral-800 min-w-[65px]">Gst SpReqst</span>
                <div className="flex-1 flex items-center gap-1">
                  <input
                    type="text"
                    value={gstSpecialRequest}
                    onChange={(e) => setGstSpecialRequest(e.target.value)}
                    placeholder="High floor, quiet room, late check-in..."
                    className="flex-1 h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[10px]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-neutral-800 min-w-[65px]">CheckIn</span>
                <div className="flex-1 flex items-center gap-1">
                  <input
                    type="text"
                    value={checkInRemarks}
                    onChange={(e) => setCheckInRemarks(e.target.value)}
                    className="flex-1 h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[10px]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-neutral-800 min-w-[65px]">CheckOut</span>
                <div className="flex-1 flex items-center gap-1">
                  <input
                    type="text"
                    value={checkOutRemarks}
                    onChange={(e) => setCheckOutRemarks(e.target.value)}
                    className="flex-1 h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[10px]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-neutral-800 min-w-[65px]">POS</span>
                <div className="flex-1 flex items-center gap-1">
                  <input
                    type="text"
                    value={posRemarks}
                    onChange={(e) => setPosRemarks(e.target.value)}
                    className="flex-1 h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[10px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-1 items-center">
                <span className="col-span-3 text-[10px] font-semibold text-neutral-800">Voucher Code</span>
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="AGODA-8829"
                  className="col-span-4 h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[10px]"
                />
                <span className="col-span-1 text-[10px] font-semibold text-neutral-800 text-right pr-1">Refer #</span>
                <input
                  type="text"
                  value={referNumber}
                  onChange={(e) => setReferNumber(e.target.value)}
                  placeholder="092 807 116"
                  className="col-span-4 h-5 px-1 bg-white border border-neutral-400 rounded-xs text-[10px]"
                />
              </div>
            </div>
          </div>

        </div>

        {/* 5. BOTTOM AUDIT BAR & ACTIONS */}
        <div className="bg-[#e9eff6] px-3 py-1.5 border-t border-[#cbd5e1] flex flex-wrap items-center justify-between gap-2">
          
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              type="button"
              id="btn-reservation-audit-trail"
              onClick={() => setIsAuditModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 h-6 bg-[#e2e8f0] hover:bg-[#cbd5e1] border border-[#94a3b8] rounded-xs font-bold text-[#1e293b] shadow-2xs text-[10px] transition-colors cursor-pointer active:scale-95"
              title="Click to view which user changed or amended this reservation (Full Audit Trail)"
            >
              <History className="w-3.5 h-3.5 text-blue-700" />
              <span>Audit Log / Users</span>
              <span className="px-1 py-0.2 bg-blue-100 text-blue-800 text-[8.5px] rounded font-mono font-bold">
                {auditLogs.length}
              </span>
            </button>
            {(() => {
              const createdRec = auditLogs.slice().reverse().find(l => l.actionType === 'Created') || auditLogs[auditLogs.length - 1];
              const amendRec = auditLogs.find(l => l.actionType !== 'Created') || auditLogs[0];
              const createdText = createdRec ? `${createdRec.userName.split(' ')[0]} ${createdRec.timestamp.split(' ')[0]} ${createdRec.timestamp.split(' ')[1]?.slice(0, 5) || ''}`.trim() : 'Front Off 22/08/26 11:08';
              const amendText = amendRec ? `${amendRec.userName.split(' ')[0]} ${amendRec.timestamp.split(' ')[0]} ${amendRec.timestamp.split(' ')[1]?.slice(0, 5) || ''}`.trim() : 'Front Off 22/08/26 11:08';
              return (
                <button
                  type="button"
                  onClick={() => setIsAuditModalOpen(true)}
                  className="flex items-center gap-1 pl-1 text-[9px] text-red-700 hover:text-red-900 hover:underline font-mono cursor-pointer transition-colors bg-transparent border-0 p-0"
                  title="Click to view full user amendment history & change records"
                >
                  <UserCheck className="w-3 h-3 text-red-600 inline mr-0.5" />
                  <span>CreateBy:{createdText} | AmendBy:{amendText}</span>
                </button>
              );
            })()}
          </div>

          <div className="flex items-center gap-1.5">
            {saveNotice && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[9.5px] font-semibold animate-in fade-in mr-1">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>{saveNotice}</span>
              </div>
            )}

            {canAccessGuestBill ? (
              <button
                type="button"
                id="btn-dialog-guest-folio"
                onClick={handleOpenFolio}
                className="flex items-center gap-1.5 px-3 h-6 bg-[#fff3cd] hover:bg-[#ffe69c] border border-[#d39e00] rounded-xs font-bold text-[#856404] shadow-2xs transition-colors cursor-pointer"
                title={`Open Guest Bill (${isCheckedIn ? 'Guest Checked In' : `Advance Deposit: $${depositAmount.toFixed(2)}`})`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>Guest Bill</span>
                <span className="text-[9px] px-1 py-0.2 bg-amber-200/90 text-amber-900 rounded font-semibold">
                  {isCheckedIn ? 'In-House' : `Dep $${depositAmount}`}
                </span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-dialog-guest-folio"
                role="button"
                aria-disabled="true"
                onClick={() => {
                  const proceed = confirm(
                    "GUEST BILL LOCKED (ROLE RESTRICTION):\n\n" +
                    "Status: Expected / Reserved (Guest Not Checked In Yet)\n\n" +
                    "Guest Bill is locked for reservations prior to check-in. Folio billing is available once the guest is Checked In or has an Advance Deposit posted.\n\n" +
                    "Would you like to Check In this guest now to access Guest Bill?"
                  );
                  if (proceed) {
                    setGuestExpectedStatus('Checked In');
                    if (settings.soundEffects) playChime();
                  }
                }}
                className="flex items-center gap-1.5 px-3 h-6 bg-neutral-100 hover:bg-neutral-200/90 border border-neutral-300 rounded-xs font-semibold text-neutral-600 shadow-2xs transition-colors cursor-pointer"
                title="Guest Bill is locked (Role restricted: Guest has not checked in yet). Click to Check In."
              >
                <Lock className="w-3.5 h-3.5 text-neutral-500" />
                <span>Guest Bill</span>
                <span className="hidden" aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              id="btn-amend-reservation-save-back"
              onClick={() => handleSave(false)}
              className="flex items-center gap-1.5 px-3 h-6 bg-[#59359a] hover:bg-[#482880] active:bg-[#3b1d6e] border border-[#482880] rounded-xs font-bold text-[10.5px] text-white shadow-2xs transition-colors cursor-pointer"
              title="Reservation: Save changes and back to room board"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-200 shrink-0" />
              <span>Reservation</span>
            </button>

            {/* CANCEL BUTTON WITH GUEST CANCEL & DELETE OPTIONS (Logged to Report 1) */}
            <div className="relative inline-block">
              <button
                type="button"
                id="btn-amend-cancel"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCancelDropdown((prev) => !prev);
                }}
                className="flex items-center gap-1 px-3 h-6 bg-[#fff1f2] hover:bg-[#ffe4e6] active:bg-[#fecdd3] border border-[#f43f5e] rounded-xs font-bold text-[10.5px] text-[#be123c] shadow-2xs transition-colors cursor-pointer select-none"
                title="Cancel or Delete reservation (Tracked in Report 1)"
              >
                <Ban className="w-3 h-3 text-[#e11d48]" />
                <span>Cancel</span>
                <ChevronUp className={`w-2.5 h-2.5 text-[#e11d48] transition-transform ${showCancelDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* DROPDOWN MENU */}
              {showCancelDropdown && (
                <div 
                  className="absolute bottom-full mb-1 left-0 w-64 bg-white rounded-md shadow-xl border border-neutral-300 overflow-hidden text-left z-50 animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-[#1e3a5f] text-white px-2.5 py-1 text-[10.5px] font-bold flex items-center justify-between">
                    <span>Reservation Action</span>
                    <span className="text-[9px] text-blue-200 font-mono">Report 1 Synced</span>
                  </div>
                  <div className="p-1 space-y-1">
                    <button
                      type="button"
                      id="btn-opt-guest-cancel"
                      onClick={() => {
                        setShowCancelDropdown(false);
                        setCancelModalAction('guest_cancel');
                      }}
                      className="w-full flex items-start gap-2 p-2 rounded hover:bg-amber-50 text-left transition-colors cursor-pointer group"
                    >
                      <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5 group-hover:bg-amber-200">
                        <Ban className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-neutral-900 text-[11px] group-hover:text-amber-900">
                          Guest Cancel
                        </div>
                        <div className="text-[10px] text-neutral-500 leading-tight">
                          Guest cancelled booking. Releases room and records CAN voucher in Report 1.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      id="btn-opt-delete"
                      onClick={() => {
                        setShowCancelDropdown(false);
                        setCancelModalAction('delete');
                      }}
                      className="w-full flex items-start gap-2 p-2 rounded hover:bg-rose-50 text-left transition-colors cursor-pointer group"
                    >
                      <div className="w-6 h-6 rounded bg-rose-100 flex items-center justify-center text-rose-700 shrink-0 mt-0.5 group-hover:bg-rose-200">
                        <Trash2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-neutral-900 text-[11px] group-hover:text-rose-900">
                          Delete
                        </div>
                        <div className="text-[10px] text-neutral-500 leading-tight">
                          Purge reservation record. Frees room inventory and archives DEL record in Report 1.
                        </div>
                      </div>
                    </button>
                  </div>
                  <div className="bg-neutral-50 px-2.5 py-1 text-[9.5px] text-neutral-500 border-t border-neutral-200">
                    Tracked by month in Report 1 (Night Audit Report).
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              id="btn-amend-refresh"
              onClick={handleRefresh}
              className="px-3 h-6 bg-white hover:bg-neutral-100 border border-neutral-400 rounded-xs font-semibold text-neutral-800 shadow-2xs"
            >
              Refresh
            </button>

            <button
              type="button"
              id="btn-amend-save"
              onClick={() => handleSave(true)}
              className="flex items-center gap-1.5 px-3.5 h-6 bg-[#d1e7dd] hover:bg-[#badbcc] active:bg-[#a3cfbb] border border-[#198754]/40 rounded-xs font-bold text-[10.5px] text-[#0f5132] shadow-2xs transition-colors cursor-pointer"
              title="Save: Save changes and continue checking other rooms or options"
            >
              <Save className="w-3.5 h-3.5 text-[#0f5132] shrink-0" />
              <span>Save</span>
            </button>

            <button
              type="button"
              id="btn-amend-exit"
              onClick={onClose}
              className="px-4 h-6 bg-white hover:bg-neutral-100 border border-neutral-400 rounded-xs font-bold text-neutral-900 shadow-2xs"
            >
              Exit
            </button>
          </div>

        </div>

        {/* 6. AUTHENTIC WINHMS DIRECT MASTER LISTING & SETUP MODAL */}
        {directListingModal && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-2 animate-in fade-in"
            onClick={() => setDirectListingModal(null)}
          >
            <div 
              className="w-full max-w-[540px] bg-[#f0f4f9] rounded shadow-[0_20px_60px_rgba(0,0,0,0.85)] border-[3px] border-[#9bc2e6] text-[#111827] overflow-hidden text-[11px] font-sans animate-in zoom-in-95"
              style={{ fontFamily: "'Tahoma', 'Segoe UI', Arial, sans-serif" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#d9ebfb] via-[#bddcf7] to-[#99c4eb] border-b border-[#7fa8cf] px-3 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-800" />
                  <span className="font-bold text-[#1e3a5f] text-xs">
                    {directListingModal.fieldLabel} — Direct Master Listing
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDirectListingModal(null)}
                  className="w-5 h-5 rounded border border-[#89a7c4] bg-[#eef5fc] hover:bg-[#d8e8f8] flex items-center justify-center text-neutral-700 hover:text-black font-bold"
                  title="Close Listing"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="p-2.5 bg-white border-b border-neutral-300 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={directListingSearch}
                    onChange={(e) => setDirectListingSearch(e.target.value)}
                    placeholder={`Search ${directListingModal.fieldLabel} listing...`}
                    className="w-full h-6 pl-7 pr-2 bg-neutral-50 border border-neutral-400 rounded-xs text-[11px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <span className="text-[10px] text-neutral-500 font-mono whitespace-nowrap">
                  {directListingModal.options.filter(o => o.toLowerCase().includes(directListingSearch.toLowerCase())).length} of {directListingModal.options.length} items
                </span>
              </div>

              {/* Direct Listing Table */}
              <div className="max-h-[220px] overflow-y-auto bg-white border-b border-neutral-300">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-[#f0f4f9] text-[#1e3a5f] font-bold border-b border-neutral-300 sticky top-0 z-10 text-[10px]">
                    <tr>
                      <th className="py-1 px-2.5 w-10 text-center">#</th>
                      <th className="py-1 px-2.5">Name / Description</th>
                      <th className="py-1 px-2 text-center w-20">Status</th>
                      <th className="py-1 px-2 text-right w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {directListingModal.options
                      .filter(item => item.toLowerCase().includes(directListingSearch.toLowerCase()))
                      .map((item, idx) => {
                        const isCurrent = directListingModal.currentValue === item;
                        return (
                          <tr
                            key={item}
                            onDoubleClick={() => handleSelectFromListing(item)}
                            className={`cursor-pointer transition-colors ${
                              isCurrent
                                ? 'bg-blue-50/90 font-semibold text-blue-950'
                                : 'hover:bg-neutral-100 text-neutral-800'
                            }`}
                          >
                            <td className="py-1 px-2.5 text-center text-neutral-400 font-mono text-[10px]">
                              {idx + 1}
                            </td>
                            <td className="py-1 px-2.5">
                              <div className="flex items-center gap-1.5">
                                <span>{item}</span>
                                {isCurrent && (
                                  <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
                                    <Check className="w-2.5 h-2.5" /> Selected
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-1 px-2 text-center">
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded font-semibold">
                                Active
                              </span>
                            </td>
                            <td className="py-1 px-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSelectFromListing(item)}
                                  className="px-2 h-5 bg-[#d1e7dd] hover:bg-[#badbcc] border border-[#a3cfbb] rounded-xs font-bold text-[#0f5132] text-[10px] shadow-2xs cursor-pointer active:scale-95"
                                  title="Select this option"
                                >
                                  Select
                                </button>
                                {directListingModal.options.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteFromDirectListing(item, e)}
                                    className="w-5 h-5 bg-neutral-100 hover:bg-red-100 border border-neutral-300 hover:border-red-400 rounded-xs flex items-center justify-center text-neutral-500 hover:text-red-700 cursor-pointer"
                                    title="Delete from direct listing"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    {directListingModal.options.filter(o => o.toLowerCase().includes(directListingSearch.toLowerCase())).length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-neutral-400 italic">
                          No matching options found. Add it below!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add New Entry to Direct Listing */}
              <div className="p-2.5 bg-[#eaf2fb] border-t border-[#cbd5e1] space-y-1.5">
                <div className="flex items-center gap-1 font-semibold text-[#1e3a5f] text-[10.5px]">
                  <PlusCircle className="w-3.5 h-3.5 text-blue-700" />
                  <span>Add New Entry to {directListingModal.fieldLabel} Master List:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newDirectListingEntry}
                    onChange={(e) => setNewDirectListingEntry(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewToDirectListing(true);
                      }
                    }}
                    placeholder={`Enter new ${directListingModal.fieldLabel} name...`}
                    className="flex-1 h-6 px-2 bg-white border border-neutral-400 rounded-xs text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddNewToDirectListing(true)}
                    disabled={!newDirectListingEntry.trim()}
                    className="px-2.5 h-6 bg-[#d1e7dd] hover:bg-[#badbcc] disabled:opacity-50 border border-[#a3cfbb] rounded-xs font-bold text-[#0f5132] text-[10px] shadow-2xs transition-colors cursor-pointer whitespace-nowrap active:scale-95"
                  >
                    + Add & Select
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddNewToDirectListing(false)}
                    disabled={!newDirectListingEntry.trim()}
                    className="px-2 h-6 bg-white hover:bg-neutral-100 disabled:opacity-50 border border-neutral-400 rounded-xs font-semibold text-neutral-800 text-[10px] shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    + Add Only
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-[#e9eff6] px-3 py-2 border-t border-[#cbd5e1] flex items-center justify-between">
                <span className="text-[10px] text-neutral-500 italic">
                  Tip: Double-click any row to instantly select and apply.
                </span>
                <button
                  type="button"
                  onClick={() => setDirectListingModal(null)}
                  className="px-3 h-5.5 bg-white hover:bg-neutral-100 border border-neutral-400 rounded-xs font-semibold text-neutral-800 text-[10.5px] shadow-2xs"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

        {/* 7. AUTHENTIC WINHMS ADVANCE DEPOSIT MANAGER MODAL */}
        {isDepositModalOpen && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/65 backdrop-blur-[1.5px] p-2 animate-in fade-in"
            onClick={() => setIsDepositModalOpen(false)}
          >
            <div 
              className="w-full max-w-[500px] bg-[#f0f4f9] rounded shadow-[0_25px_70px_rgba(0,0,0,0.9)] border-[3px] border-[#6ee7b7] text-[#111827] overflow-hidden text-[11px] font-sans animate-in zoom-in-95"
              style={{ fontFamily: "'Tahoma', 'Segoe UI', Arial, sans-serif" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#d1fae5] via-[#a7f3d0] to-[#6ee7b7] border-b border-[#34d399] px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-800" />
                  <span className="font-bold text-emerald-950 text-xs">
                    Advance Deposit Entry & Receipt — Rsr #{rsrNo || '15'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="w-5 h-5 rounded border border-emerald-400 bg-white/80 hover:bg-white flex items-center justify-center text-emerald-900 font-bold"
                  title="Close Deposit Manager"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Guest & Room Summary */}
              <div className="p-3 bg-white border-b border-neutral-300 space-y-2.5">
                <div className="grid grid-cols-2 gap-2 bg-[#f8fafc] border border-neutral-300 p-2 rounded-xs text-[10.5px]">
                  <div>
                    <span className="text-neutral-500 block text-[9.5px]">Guest Name:</span>
                    <span className="font-bold text-neutral-900">{title} {lastName} {firstName}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9.5px]">Assigned Room(s):</span>
                    <span className="font-bold text-blue-800">
                      Room {roomRows.map(r => r.room).join(', ')} ({roomRows.length} Rms)
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9.5px]">Total Room Tariff:</span>
                    <span className="font-bold text-neutral-900">
                      ${roomRows.reduce((sum, r) => sum + (r.tariffUSD || 0), 0).toFixed(2)} USD
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9.5px]">Current Deposit Status:</span>
                    <span className={`font-bold px-1.5 py-0.2 rounded-xs border text-[9.5px] inline-block ${
                      depositModalAmount > 0 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                    }`}>
                      {depositModalAmount > 0 ? `$${depositModalAmount.toFixed(2)} Deposited` : 'No Deposit Recorded'}
                    </span>
                  </div>
                </div>

                {/* Deposit Amount Input */}
                <div className="space-y-1.5 pt-1">
                  <label className="block font-bold text-neutral-800 text-[11px]">
                    Deposit Amount (USD) <span className="text-red-600">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 font-mono font-bold text-sm">$</span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={depositModalAmount || ''}
                        onChange={(e) => setDepositModalAmount(Number(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full h-8 pl-7 pr-2.5 bg-emerald-50/50 border-2 border-emerald-500 rounded-xs text-base font-mono font-bold text-emerald-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-neutral-500">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setDepositModalAmount(30)}
                      className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-xs font-semibold text-[10px]"
                    >
                      $30
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositModalAmount(50)}
                      className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-xs font-semibold text-[10px]"
                    >
                      $50
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositModalAmount(100)}
                      className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-xs font-semibold text-[10px]"
                    >
                      $100
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const totalRate = roomRows.reduce((sum, r) => sum + (r.tariffUSD || 0), 0);
                        setDepositModalAmount(totalRate || 30);
                      }}
                      className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 rounded-xs font-bold text-[10px]"
                    >
                      100% Rate (${roomRows.reduce((sum, r) => sum + (r.tariffUSD || 0), 0).toFixed(0)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositModalAmount(0)}
                      className="px-2 py-0.5 bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 rounded-xs font-semibold text-[10px]"
                    >
                      Clear ($0)
                    </button>
                  </div>
                </div>

                {/* Payment Mode & Reference */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200">
                  <div className="space-y-1">
                    <label className="block font-semibold text-neutral-800 text-[10px]">Payment Method</label>
                    <select
                      value={depositModalPayMode}
                      onChange={(e) => setDepositModalPayMode(e.target.value)}
                      className="w-full h-6 px-1.5 bg-white border border-neutral-400 rounded-xs text-[10.5px]"
                    >
                      {payModeOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block font-semibold text-neutral-800 text-[10px]">Receipt / Ref / Voucher #</label>
                    <input
                      type="text"
                      value={depositModalRef}
                      onChange={(e) => setDepositModalRef(e.target.value)}
                      placeholder="e.g. REC-2026-082"
                      className="w-full h-6 px-2 bg-white border border-neutral-400 rounded-xs text-[10.5px]"
                    />
                  </div>
                </div>

                {/* Notes / Remarks */}
                <div className="space-y-1 pt-1">
                  <label className="block font-semibold text-neutral-800 text-[10px]">Deposit Notes / Remarks</label>
                  <input
                    type="text"
                    value={depositModalNotes}
                    onChange={(e) => setDepositModalNotes(e.target.value)}
                    placeholder="Advance paid via front desk cashier / ABA QR / card auth"
                    className="w-full h-6 px-2 bg-white border border-neutral-400 rounded-xs text-[10.5px]"
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="bg-[#eaf2fb] px-3 py-2 border-t border-[#cbd5e1] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-3 h-6 bg-white hover:bg-neutral-100 border border-neutral-400 rounded-xs font-semibold text-neutral-800 text-[10.5px] shadow-2xs"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDepositFromModal}
                    className="px-4 h-6 bg-[#059669] hover:bg-[#047857] text-white border border-[#047857] rounded-xs font-bold text-[10.5px] shadow-2xs cursor-pointer active:scale-95 transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Apply & Save Deposit</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 8. AUTHENTIC WINHMS RESERVATION AUDIT TRAIL & USER HISTORY MODAL */}
        <ReservationAuditModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          rsrNo={rsrNo}
          guestName={`${title} ${lastName} ${firstName}`.trim()}
          roomNumbers={roomRows.map(r => r.room)}
          currentStatus={guestExpectedStatus}
          currentRate={netTariff}
          currentPlan={roomRows[0]?.rateCode || 'Room Only'}
          auditLogs={auditLogs}
          onAddAuditLog={handleAddAuditLog}
        />

        {/* 9. ROLE POLICY ALERT: CLICK REFRESH BEFORE EDIT */}
        {showRefreshAlert && (
          <div 
            className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4 animate-in fade-in"
            onClick={() => setShowRefreshAlert(false)}
          >
            <div 
              className="w-full max-w-md bg-white border-2 border-amber-500 rounded shadow-2xl overflow-hidden font-sans text-[11px] animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-2 flex items-center justify-between font-bold shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-white shrink-0" />
                  <span className="text-[12px] tracking-wide font-bold">Action Required: Click Refresh Before Edit</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowRefreshAlert(false)}
                  className="w-5 h-5 rounded hover:bg-amber-700/50 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 space-y-3 bg-[#fffefb]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                    <RefreshCw className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="font-bold text-neutral-900 text-[12px]">
                      Please click 'Refresh' before editing reservation information
                    </div>
                    <p className="text-neutral-600 text-[11px] leading-relaxed">
                      Hotel security policy requires users with role <span className="font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded font-mono border border-amber-200">{activeOperatorRole}</span> to click <strong>Refresh</strong> before changing or typing into any reservation details to prevent overwriting concurrent updates.
                    </p>
                    <div className="text-[10px] text-neutral-500 bg-neutral-50 p-2 rounded border border-neutral-200">
                      ✓ Once you click <strong>Refresh</strong>, all fields will be verified and unlocked for editing.
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRefreshAlert(false);
                      setTempRefreshRoles(refreshRequiredRoles);
                      setTempPolicyEnabled(isRefreshPolicyEnabled);
                      setIsRoleConfigModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 h-6 rounded border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Set Role Policy</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRefreshAlert(false)}
                      className="px-3 h-6 rounded border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 font-semibold text-[10.5px] cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleRefresh();
                        setShowRefreshAlert(false);
                      }}
                      className="px-3.5 h-6 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-[10.5px] flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition-all"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Click Refresh Now</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. SET ROLE CONFIGURATION MODAL */}
        {isRoleConfigModalOpen && (
          <div 
            className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4 animate-in fade-in"
            onClick={() => setIsRoleConfigModalOpen(false)}
          >
            <div 
              className="w-full max-w-[480px] bg-[#f0f4f9] rounded shadow-2xl border-[3px] border-[#9bc2e6] text-[#111827] overflow-hidden text-[11px] font-sans animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#1b365d] via-[#244b7d] to-[#1b365d] text-white px-3 py-1.5 flex items-center justify-between border-b border-[#0f2440] shadow-sm select-none">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span className="font-bold text-xs tracking-wide">
                    {settings?.hotelName ? `${settings.hotelName} Policy: Set Role Permissions` : 'Policy: Set Role Permissions'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRoleConfigModalOpen(false)}
                  className="w-5 h-5 rounded hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3.5 bg-white">
                {/* Active Operator / Current Role */}
                <div className="bg-[#f8fafc] p-2.5 rounded border border-[#cbd5e1] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-800 text-[11px]">Active Operator Role:</span>
                    <span className="font-mono font-bold text-blue-700 text-[11px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {activeOperatorRole}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-[10px] text-neutral-600 font-semibold whitespace-nowrap">Switch Operator Role (Simulate):</label>
                    <select
                      value={simulatedRole}
                      onChange={(e) => setSimulatedRole(e.target.value)}
                      className="h-6 px-1.5 bg-white border border-neutral-300 rounded-xs text-[10.5px] font-medium flex-1 focus:border-blue-600"
                    >
                      <option value="Front Desk Operator">Front Desk Operator</option>
                      <option value="Receptionist">Receptionist</option>
                      <option value="Front Desk Manager">Front Desk Manager</option>
                      <option value="Night Auditor">Night Auditor</option>
                      <option value="General Manager">General Manager</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>
                </div>

                {/* Main Enforce Policy Toggle */}
                <label className="flex items-center gap-2 p-2 rounded bg-amber-50/70 border border-amber-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={tempPolicyEnabled}
                    onChange={(e) => setTempPolicyEnabled(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                  <div>
                    <div className="font-bold text-neutral-900 text-[11px]">
                      Enforce "Click Refresh Before Edit" Rule
                    </div>
                    <div className="text-[10px] text-neutral-600">
                      Alerts the user to click Refresh before modifying information. Browsing and viewing are allowed without alerts.
                    </div>
                  </div>
                </label>

                {/* Roles list */}
                <div className="space-y-1.5">
                  <div className="font-bold text-neutral-800 text-[10.5px]">
                    Select Roles that Require Clicking Refresh Before Edit:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-[#f8fafc] p-2.5 rounded border border-neutral-200 max-h-48 overflow-y-auto">
                    {[
                      'Front Desk Operator',
                      'Receptionist',
                      'Front Desk Manager',
                      'Night Auditor',
                      'General Manager',
                      'Super Admin',
                      'All Staff Roles'
                    ].map((r) => {
                      const isChecked = tempRefreshRoles.includes(r);
                      return (
                        <label
                          key={r}
                          className={`flex items-center gap-2 px-2 py-1 rounded border text-[10.5px] transition-colors cursor-pointer select-none ${
                            isChecked
                              ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold'
                              : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTempRefreshRoles(prev => [...prev, r]);
                              } else {
                                setTempRefreshRoles(prev => prev.filter(x => x !== r));
                              }
                            }}
                            className="accent-blue-600 rounded cursor-pointer"
                          />
                          <span>{r}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[10px] text-neutral-500 leading-normal bg-neutral-50 p-2 rounded border border-neutral-200">
                  <strong>Notice:</strong> When enforced, users in the chosen roles will see an alert to click Refresh if they try to change or type into reservation information before clicking Refresh.
                </div>
              </div>

              {/* Footer */}
              <div className="bg-[#eaf2fb] px-3 py-2 border-t border-[#cbd5e1] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsRoleConfigModalOpen(false)}
                  className="px-3 h-6 bg-white hover:bg-neutral-100 border border-neutral-400 rounded-xs font-semibold text-neutral-800 text-[10.5px] shadow-2xs cursor-pointer"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveRoleSettings}
                    className="px-4 h-6 bg-[#0284c7] hover:bg-[#0369a1] text-white border border-[#0284c7] rounded-xs font-bold text-[10.5px] shadow-2xs cursor-pointer active:scale-95 transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Save Role Policy</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 6. GUEST CANCEL CONFIRMATION MODAL (REPORT 1 SYNC) */}
        {cancelModalAction === 'guest_cancel' && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-lg shadow-2xl border border-amber-300 w-full max-w-lg overflow-hidden text-neutral-800">
              
              {/* Header */}
              <div className="bg-[#b45309] text-white px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ban className="w-5 h-5 text-amber-200" />
                  <span className="font-bold text-sm uppercase tracking-wide">
                    Confirm Guest Cancellation (Report 1 Sync)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCancelModalAction('none')}
                  className="p-1 hover:bg-black/20 rounded text-amber-100 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3.5 text-xs">
                {/* Summary Info Card */}
                <div className="bg-amber-50/70 border border-amber-200 rounded p-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-neutral-500 text-[10.5px]">Guest Name:</span>
                    <div className="font-bold text-neutral-900">
                      {lastName ? `${title || ''} ${lastName} ${firstName || ''}`.trim() : (reservation?.guestName || 'Guest')}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10.5px]">Room Allocated:</span>
                    <div className="font-bold text-amber-900 font-mono">
                      Room {roomRows[0]?.room || reservation?.roomNumber || currentRoom?.roomNumber || '15'}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10.5px]">Arrival & Depart:</span>
                    <div className="font-mono text-neutral-800">
                      {roomRows[0]?.arrival || reservation?.checkInDate || '22/08/26'} → {roomRows[0]?.depart || reservation?.checkOutDate || '23/08/26'}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10.5px]">Tariff / Refund Value:</span>
                    <div className="font-mono font-bold text-neutral-900">
                      ${netTariff.toFixed(2)} USD ({(netTariff * 4100).toLocaleString()} ៛)
                    </div>
                  </div>
                </div>

                {/* Reason Selection */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800 text-[11px] block">
                    Reason for Cancellation (Logged to Report 1):
                  </label>
                  <select
                    value={cancelReasonPreset}
                    onChange={(e) => setCancelReasonPreset(e.target.value)}
                    className="w-full h-8 px-2 bg-white border border-neutral-300 rounded text-xs text-neutral-900 font-medium focus:outline-none focus:border-amber-600 cursor-pointer"
                  >
                    <option value="Guest travel itinerary change">Guest travel itinerary change</option>
                    <option value="Flight / Transportation cancelled or delayed">Flight / Transportation cancelled or delayed</option>
                    <option value="Personal / Family medical emergency">Personal / Family medical emergency</option>
                    <option value="Found alternative accommodation">Found alternative accommodation</option>
                    <option value="Duplicate reservation booking">Duplicate reservation booking</option>
                    <option value="Visa or border transit restriction">Visa or border transit restriction</option>
                    <option value="Inclement weather / Natural condition">Inclement weather / Natural condition</option>
                    <option value="Other / Front Desk manual release">Other / Front Desk manual release</option>
                  </select>
                </div>

                {/* Additional Notes */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 text-[11px] block">
                    Additional Cancellation Notes (Optional):
                  </label>
                  <input
                    type="text"
                    value={cancelCustomNotes}
                    onChange={(e) => setCancelCustomNotes(e.target.value)}
                    placeholder="E.g. Guest notified via phone at 10:30 AM..."
                    className="w-full h-7 px-2 bg-white border border-neutral-300 rounded text-xs text-neutral-900 focus:outline-none focus:border-amber-600"
                  />
                </div>

                {/* Retention / Refund Policy */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 text-[11px] block">
                    Refund & Deposit Handling:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'full', label: '100% Release ($0 Retention)' },
                      { id: 'one_night', label: '1 Night Retention' },
                      { id: 'no_refund', label: 'Forfeit Deposit' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCancelRefundPolicy(opt.id as any)}
                        className={`p-1.5 rounded border text-[10.5px] font-semibold transition-all cursor-pointer ${
                          cancelRefundPolicy === opt.id
                            ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-2xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audit Notice */}
                <div className="bg-neutral-50 border border-neutral-200 rounded p-2 text-[10.5px] text-neutral-600">
                  <strong>Report 1 Integration:</strong> A unique cancellation voucher (<code>CAN-2026-XXXX</code>) will be recorded in <strong>Report 1 (Night Audit Report)</strong> under the Cancel & Delete Ledger, selectable by month.
                </div>
              </div>

              {/* Footer */}
              <div className="bg-neutral-100 px-4 py-2.5 border-t border-neutral-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCancelModalAction('none')}
                  className="px-3 py-1 bg-white hover:bg-neutral-200 border border-neutral-300 rounded text-xs font-semibold text-neutral-700 cursor-pointer"
                >
                  Keep Reservation
                </button>
                <button
                  type="button"
                  id="btn-confirm-guest-cancel"
                  onClick={handleConfirmGuestCancel}
                  className="px-4 py-1.5 bg-[#b45309] hover:bg-[#92400e] text-white rounded font-bold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Confirm Guest Cancel</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* 7. PERMANENT DELETE CONFIRMATION MODAL */}
        {cancelModalAction === 'delete' && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-lg shadow-2xl border border-red-400 w-full max-w-lg overflow-hidden text-neutral-800">
              
              {/* Header */}
              <div className="bg-[#991b1b] text-white px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-200" />
                  <span className="font-bold text-sm uppercase tracking-wide">
                    Permanent Reservation Deletion
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCancelModalAction('none')}
                  className="p-1 hover:bg-black/20 rounded text-rose-100 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3.5 text-xs">
                {/* Warning Alert */}
                <div className="bg-red-50 border border-red-300 rounded p-3 flex items-start gap-2.5 text-red-950">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-red-900">
                      Warning: Permanent Removal from Inventory
                    </div>
                    <p className="text-[11px] text-red-800 leading-tight">
                      This will permanently purge this reservation record from room and guest rosters. An audited deletion record will be archived into Report 1.
                    </p>
                  </div>
                </div>

                {/* Summary Info Card */}
                <div className="bg-neutral-50 border border-neutral-200 rounded p-2.5 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-neutral-500 text-[10.5px]">Guest Name:</span>
                    <div className="font-bold text-neutral-900">
                      {lastName ? `${title || ''} ${lastName} ${firstName || ''}`.trim() : (reservation?.guestName || 'Guest')}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10.5px]">Room:</span>
                    <div className="font-bold text-red-900 font-mono">
                      Room {roomRows[0]?.room || reservation?.roomNumber || currentRoom?.roomNumber || '15'}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10.5px]">Stay Dates:</span>
                    <div className="font-mono text-neutral-800">
                      {roomRows[0]?.arrival || reservation?.checkInDate || '22/08/26'} → {roomRows[0]?.depart || reservation?.checkOutDate || '23/08/26'}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10.5px]">Rate Value:</span>
                    <div className="font-mono font-bold text-neutral-900">
                      ${netTariff.toFixed(2)} USD ({(netTariff * 4100).toLocaleString()} ៛)
                    </div>
                  </div>
                </div>

                {/* Reason Selection */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800 text-[11px] block">
                    Reason for Deletion (Archived in Report 1 Audit):
                  </label>
                  <select
                    value={deleteReasonPreset}
                    onChange={(e) => setDeleteReasonPreset(e.target.value)}
                    className="w-full h-8 px-2 bg-white border border-neutral-300 rounded text-xs text-neutral-900 font-medium focus:outline-none focus:border-red-600 cursor-pointer"
                  >
                    <option value="Duplicate reservation entry">Duplicate reservation entry</option>
                    <option value="Test / Erroneous booking record">Test / Erroneous booking record</option>
                    <option value="Incorrect room or guest assignment">Incorrect room or guest assignment</option>
                    <option value="Guest requested privacy data purge">Guest requested privacy data purge</option>
                    <option value="Channel manager / OTA sync conflict">Channel manager / OTA sync conflict</option>
                    <option value="Purged by supervisor order">Purged by supervisor order</option>
                  </select>
                </div>

                {/* Additional Notes */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 text-[11px] block">
                    Operator Notes / Authorization Code:
                  </label>
                  <input
                    type="text"
                    value={deleteCustomNotes}
                    onChange={(e) => setDeleteCustomNotes(e.target.value)}
                    placeholder="E.g. Approved by FOM, replaced by Res #1290..."
                    className="w-full h-7 px-2 bg-white border border-neutral-300 rounded text-xs text-neutral-900 focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="bg-neutral-100 px-4 py-2.5 border-t border-neutral-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCancelModalAction('none')}
                  className="px-3 py-1 bg-white hover:bg-neutral-200 border border-neutral-300 rounded text-xs font-semibold text-neutral-700 cursor-pointer"
                >
                  Cancel / Return
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete"
                  onClick={handleConfirmDelete}
                  className="px-4 py-1.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white rounded font-bold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Permanent Delete</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* 8. CANCELLATION / DELETION RESULT TOAST & DIRECT LINK TO REPORT 1 */}
        {cancelResultToast && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-lg shadow-2xl border border-blue-400 w-full max-w-md overflow-hidden text-neutral-800">
              
              <div className={`px-4 py-2.5 text-white font-bold text-sm flex items-center justify-between ${
                cancelResultToast.type === 'cancel' ? 'bg-[#b45309]' : 'bg-[#991b1b]'
              }`}>
                <div className="flex items-center gap-2">
                  {cancelResultToast.type === 'cancel' ? <Ban className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                  <span>
                    {cancelResultToast.type === 'cancel' ? 'Reservation Cancelled' : 'Reservation Deleted'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCancelResultToast(null);
                    onClose();
                  }}
                  className="p-1 hover:bg-black/20 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-neutral-900 text-sm">
                      {cancelResultToast.guest}
                    </div>
                    <div className="text-neutral-600 text-xs">
                      Room {cancelResultToast.room} inventory is now released.
                    </div>
                  </div>
                </div>

                <div className="bg-[#f0f9ff] border border-blue-200 rounded p-2.5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 text-[11px]">Audit Voucher:</span>
                    <span className="font-mono font-bold text-blue-900 bg-white px-1.5 py-0.5 rounded border border-blue-200">
                      {cancelResultToast.voucher}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 text-[11px]">Audit Month:</span>
                    <span className="font-mono font-semibold text-neutral-800">
                      {cancelResultToast.month}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 text-[11px]">Target Ledger:</span>
                    <span className="font-bold text-emerald-800">
                      Report 1 (Night Audit Report)
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-500">
                  This transaction is archived in <strong>Report 1</strong> and can be inspected or filtered by month in the Night Audit Report ledger.
                </p>
              </div>

              <div className="bg-neutral-100 px-4 py-2.5 border-t border-neutral-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setCancelResultToast(null);
                    onClose();
                  }}
                  className="px-3 py-1 bg-white hover:bg-neutral-200 border border-neutral-300 rounded text-xs font-semibold text-neutral-700 cursor-pointer"
                >
                  Done & Close
                </button>
                {onOpenReport1 && (
                  <button
                    type="button"
                    id="btn-open-in-report-1"
                    onClick={() => {
                      const m = cancelResultToast.month;
                      setCancelResultToast(null);
                      onClose();
                      onOpenReport1('cancel_delete', m);
                    }}
                    className="px-4 py-1.5 bg-[#1e3a5f] hover:bg-[#152843] text-white rounded font-bold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-300" />
                    <span>View in Report 1 ({cancelResultToast.month})</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
