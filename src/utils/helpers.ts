import { AccentColor, RoomStatus, CleaningStatus, PaymentStatus, Room } from '../types';

export const formatCurrency = (amount: number | undefined | null, symbolOrCurrency: string | { symbol?: string; code?: string } = '$', _code: string = 'USD'): string => {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : (Number(amount) || 0);
  const symbol = typeof symbolOrCurrency === 'string' ? symbolOrCurrency : (symbolOrCurrency?.symbol || '$');
  return `${symbol}${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const getAccentClasses = (accent: AccentColor) => {
  switch (accent) {
    case 'emerald':
      return {
        primary: 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold',
        primarySoft: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/40',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.18)]',
        activeTab: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
        ring: 'focus:ring-emerald-500/50',
      };
    case 'cyan':
      return {
        primary: 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold',
        primarySoft: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
        text: 'text-cyan-400',
        border: 'border-cyan-500/40',
        glow: 'shadow-[0_0_20px_rgba(6,182,212,0.18)]',
        activeTab: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
        ring: 'focus:ring-cyan-500/50',
      };
    case 'violet':
      return {
        primary: 'bg-violet-500 hover:bg-violet-400 text-white font-semibold',
        primarySoft: 'bg-violet-500/10 text-violet-300 border border-violet-500/20',
        text: 'text-violet-400',
        border: 'border-violet-500/40',
        glow: 'shadow-[0_0_20px_rgba(139,92,246,0.18)]',
        activeTab: 'bg-violet-500/15 text-violet-300 border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.15)]',
        ring: 'focus:ring-violet-500/50',
      };
    case 'rose':
      return {
        primary: 'bg-rose-500 hover:bg-rose-400 text-white font-semibold',
        primarySoft: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
        text: 'text-rose-400',
        border: 'border-rose-500/40',
        glow: 'shadow-[0_0_20px_rgba(244,63,94,0.18)]',
        activeTab: 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
        ring: 'focus:ring-rose-500/50',
      };
    case 'blue':
      return {
        primary: 'bg-blue-500 hover:bg-blue-400 text-white font-semibold',
        primarySoft: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
        text: 'text-blue-400',
        border: 'border-blue-500/40',
        glow: 'shadow-[0_0_20px_rgba(59,130,246,0.18)]',
        activeTab: 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
        ring: 'focus:ring-blue-500/50',
      };
    case 'amber':
    default:
      return {
        primary: 'bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold',
        primarySoft: 'bg-amber-400/10 text-amber-300 border border-amber-400/20',
        text: 'text-amber-400',
        border: 'border-amber-400/40',
        glow: 'shadow-[0_0_20px_rgba(251,191,36,0.18)]',
        activeTab: 'bg-amber-400/15 text-amber-300 border-amber-400/40 shadow-[0_0_15px_rgba(251,191,36,0.15)]',
        ring: 'focus:ring-amber-400/50',
      };
  }
};

export const getRoomStatusBadge = (status: RoomStatus, cleaningStatus?: CleaningStatus) => {
  // 1. Red for Out of service
  if (status === 'out_of_service' || status === 'maintenance') {
    return {
      label: status === 'out_of_service' ? 'Out of Service' : 'Maintenance (OOS)',
      shortLabel: 'Out of Service',
      category: 'out_of_service' as const,
      colorName: 'Red',
      badgeClass: 'bg-red-500/15 text-red-400 border border-red-500/30',
      cardBorder: 'border-red-500/40 bg-red-950/10 hover:border-red-500/60',
      dotClass: 'bg-red-500 ring-2 ring-red-500/30',
      tagClass: 'bg-red-500/20 text-red-300 border-red-500/40',
      barBg: 'bg-red-600 text-white border-red-700',
    };
  }
  // 2. Green for In-house
  if (status === 'occupied') {
    return {
      label: 'In-House Guest',
      shortLabel: 'In-House',
      category: 'inhouse' as const,
      colorName: 'Green',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      cardBorder: 'border-emerald-500/30 bg-emerald-950/10 hover:border-emerald-500/50',
      dotClass: 'bg-emerald-400 animate-pulse',
      tagClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      barBg: 'bg-emerald-600 text-white border-emerald-700',
    };
  }
  // 3. Yellow for Reserve booking
  if (status === 'reserved') {
    return {
      label: 'Reserve Booking',
      shortLabel: 'Reserved',
      category: 'reserved' as const,
      colorName: 'Yellow',
      badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      cardBorder: 'border-amber-500/30 bg-amber-950/10 hover:border-amber-500/50',
      dotClass: 'bg-amber-400',
      tagClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      barBg: 'bg-amber-500 text-neutral-950 font-bold border-amber-600',
    };
  }
  // 4. Gray for Not clean room
  if (status === 'cleaning' || cleaningStatus === 'dirty' || cleaningStatus === 'in_progress') {
    return {
      label: 'Not Clean Room',
      shortLabel: 'Not Clean',
      category: 'not_clean' as const,
      colorName: 'Gray',
      badgeClass: 'bg-neutral-800 text-neutral-300 border border-neutral-700',
      cardBorder: 'border-neutral-700 bg-neutral-900/60 hover:border-neutral-600',
      dotClass: 'bg-neutral-400',
      tagClass: 'bg-neutral-800 text-neutral-300 border-neutral-700',
      barBg: 'bg-neutral-600 text-white border-neutral-500',
    };
  }
  // 5. Blue for Clean Room (Available & Cleaned)
  return {
    label: 'Clean Room',
    shortLabel: 'Clean Room',
    category: 'clean' as const,
    colorName: 'Blue',
    badgeClass: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    cardBorder: 'border-blue-500/30 bg-blue-950/10 hover:border-blue-500/50',
    dotClass: 'bg-blue-400',
    tagClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    barBg: 'bg-blue-600 text-white border-blue-700',
  };
};

export const getCleaningStatusBadge = (status: CleaningStatus) => {
  switch (status) {
    case 'clean':
      return { label: 'Clean Room (Ready)', color: 'text-blue-400 bg-blue-950/40 border-blue-800/40', colorCode: 'blue' };
    case 'inspected':
      return { label: 'Clean Room (Approved)', color: 'text-blue-300 bg-blue-950/60 border-blue-700/50', colorCode: 'blue' };
    case 'dirty':
      return { label: 'Not Clean Room (Turnover Required)', color: 'text-neutral-300 bg-neutral-800 border-neutral-700', colorCode: 'gray' };
    case 'in_progress':
      return { label: 'Not Clean (Cleaning in Progress)', color: 'text-neutral-300 bg-neutral-800/90 border-neutral-700', colorCode: 'gray' };
  }
};

export const getTransactionStatusBadge = (status: PaymentStatus) => {
  switch (status) {
    case 'paid':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'pending':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'failed':
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    case 'refunded':
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
  }
};

export const playChime = () => {
  try {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return;
    const audioCtx = new AudioCtxClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch {
    // AudioContext blocked or not supported
  }
};

/**
 * Format any date string into standard WINHMS folio format: DD-MMM-YY (e.g. 26-Aug-26)
 */
export const formatFolioDate = (rawDate: string | undefined): string => {
  if (!rawDate) return '26-Aug-26';
  const trimmed = rawDate.trim();

  // Already DD-MMM-YY (e.g. 07-Sep-26, 07-SEP-26, 26-Aug-26)
  const matchDMM2 = trimmed.match(/^(\d{1,2})[-/ ]?([A-Za-z]{3})[-/ ]?(\d{2})$/);
  if (matchDMM2) {
    const day = matchDMM2[1].padStart(2, '0');
    const month = matchDMM2[2].charAt(0).toUpperCase() + matchDMM2[2].slice(1, 3).toLowerCase();
    const yr = matchDMM2[3];
    return `${day}-${month}-${yr}`;
  }

  // Match DD-MMM-YYYY (e.g. 07-Sep-2026) -> convert to DD-MMM-YY
  const matchDMM4 = trimmed.match(/^(\d{1,2})[-/ ]?([A-Za-z]{3})[-/ ]?(\d{4})$/);
  if (matchDMM4) {
    const day = matchDMM4[1].padStart(2, '0');
    const month = matchDMM4[2].charAt(0).toUpperCase() + matchDMM4[2].slice(1, 3).toLowerCase();
    const yr = matchDMM4[3].slice(-2);
    return `${day}-${month}-${yr}`;
  }

  // Match YYYY-MM-DD (e.g. 2026-08-26) -> DD-MMM-YY
  const matchIso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchIso) {
    const yr = matchIso[1].slice(-2);
    const mNum = parseInt(matchIso[2], 10);
    const day = matchIso[3].padStart(2, '0');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const month = months[mNum - 1] || 'Aug';
    return `${day}-${month}-${yr}`;
  }

  return trimmed;
};

export interface RoomConflictResult {
  conflictingGuest: string;
  checkInDate: string;
  checkOutDate: string;
  isCurrentStay: boolean;
  resId?: string;
  status: string;
}

export const normalizeToIsoDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  // Match YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  // Match DD/MM/YY or DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    let y = dmyMatch[3];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }
  // Match DD-MMM-YY (e.g. 26-Aug-26)
  const dmmMatch = trimmed.match(/^(\d{1,2})[-/ ]?([A-Za-z]{3})[-/ ]?(\d{2,4})$/);
  if (dmmMatch) {
    const d = dmmMatch[1].padStart(2, '0');
    const monStr = dmmMatch[2].toLowerCase();
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const mIdx = months.indexOf(monStr);
    const m = mIdx >= 0 ? String(mIdx + 1).padStart(2, '0') : '08';
    let y = dmmMatch[3];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }
  return trimmed;
};

export const checkDatesOverlap = (in1: string, out1: string, in2: string, out2: string): boolean => {
  const normIn1 = normalizeToIsoDate(in1);
  const normOut1 = normalizeToIsoDate(out1);
  const normIn2 = normalizeToIsoDate(in2);
  const normOut2 = normalizeToIsoDate(out2);
  if (!normIn1 || !normOut1 || !normIn2 || !normOut2) return false;
  return normIn1 < normOut2 && normOut1 > normIn2;
};

export const getRoomConflictDetail = (
  room: Room,
  checkIn: string,
  checkOut: string,
  excludeResId?: string
): RoomConflictResult | null => {
  const normIn = normalizeToIsoDate(checkIn);
  const normOut = normalizeToIsoDate(checkOut);
  if (!normIn || !normOut) return null;

  // 1. Check active in-house stay
  if (
    (room.status === 'occupied' || room.status === 'reserved') &&
    room.checkInDate &&
    room.checkOutDate
  ) {
    const isExcludedStay = excludeResId && (excludeResId === `stay-${room.id}` || excludeResId === `res-${room.id}`);
    if (!isExcludedStay && checkDatesOverlap(normIn, normOut, room.checkInDate, room.checkOutDate)) {
      return {
        conflictingGuest: room.guestName || 'In-House Guest',
        checkInDate: room.checkInDate,
        checkOutDate: room.checkOutDate,
        isCurrentStay: room.status === 'occupied',
        resId: `stay-${room.id}`,
        status: room.status,
      };
    }
  }

  // 2. Check future reservations on this room
  if (room.futureReservations && room.futureReservations.length > 0) {
    for (const fut of room.futureReservations) {
      if (excludeResId && fut.id === excludeResId) continue;
      if (fut.checkInDate && fut.checkOutDate) {
        if (checkDatesOverlap(normIn, normOut, fut.checkInDate, fut.checkOutDate)) {
          return {
            conflictingGuest: fut.guestName,
            checkInDate: fut.checkInDate,
            checkOutDate: fut.checkOutDate,
            isCurrentStay: false,
            resId: fut.id,
            status: fut.status || 'reserved',
          };
        }
      }
    }
  }

  return null;
};

export const getRoomFolioData = (roomNumber: string, guestName?: string) => {
  const cleanName = (guestName || '').replace(/[^a-zA-Z0-9]/g, '_');
  const storageKey = `winhms_bill_${roomNumber}_${cleanName}`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      const charges = Array.isArray(parsed.charges) ? parsed.charges : [];
      const validCharges = charges.filter((c: any) => c && c.id && !/^c-(?:[1-9]|1[0-8])(?:-pay)?$/.test(c.id));
      const totalCharges = validCharges.filter((c: any) => c.amount > 0).reduce((acc: number, c: any) => acc + c.amount, 0);
      const totalCredits = validCharges.filter((c: any) => c.amount < 0).reduce((acc: number, c: any) => acc + Math.abs(c.amount), 0);
      const balance = Math.round((totalCharges - totalCredits) * 100) / 100;
      return {
        storageKey,
        balance,
        totalCharges,
        totalCredits,
        charges: validCharges,
        isSettled: balance <= 0.01,
        hasFolio: validCharges.length > 0,
      };
    }
  } catch (e) {}
  return {
    storageKey,
    balance: 0,
    totalCharges: 0,
    totalCredits: 0,
    charges: [],
    isSettled: true,
    hasFolio: false,
  };
};
