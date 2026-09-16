import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  FileSpreadsheet, 
  Plus, 
  ArrowRightLeft, 
  ArrowRight,
  ArrowLeft,
  Trash2, 
  Check, 
  DollarSign,
  Receipt,
  BookOpen,
  RotateCcw,
  Save,
  CheckSquare,
  Square,
  Layers,
  Split,
  Eye,
  FileText,
  Building2,
  Download,
  CreditCard,
  Utensils,
  Coffee,
  Sparkles,
  Car,
  BedDouble,
  ShoppingBag,
  Search,
  QrCode,
  Wallet,
  ChevronRight,
  Edit2
} from 'lucide-react';
import { Room, UserSettings, PaymentMethod } from '../types';
import { playChime, formatCurrency } from '../utils/helpers';

export interface BillChargeItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  splitId: number; // 1 or 2 or 3...
  category?: 'Accommodation' | 'Food' | 'Beverage' | 'Laundry' | 'Misc';
  isPayment?: boolean;
  paymentMethod?: string;
  referenceNo?: string;
  postedBy?: 'User' | 'Night Audit (Auto)' | 'System' | string;
  tariffRate?: number;
}

export interface OtherChargeCatalogItem {
  code: string;
  category: 'Food & Beverage' | 'Laundry' | 'Spa & Wellness' | 'Transportation' | 'Room Amenities' | 'Miscellaneous';
  name: string;
  defaultPrice: number;
  description: string;
}

export const OTHER_CHARGE_CATALOG: OtherChargeCatalogItem[] = [
  { code: 'FB-ROK-01', category: 'Food & Beverage', name: 'Food - Rokkhak Restaurant', defaultPrice: 45.00, description: 'Lunch / Dinner dining Khmer & Western cuisine' },
  { code: 'FB-ROK-02', category: 'Food & Beverage', name: 'Beverage - Rokkhak Lounge', defaultPrice: 25.00, description: 'Craft cocktails, imported wines, fresh juices' },
  { code: 'FB-BRK-01', category: 'Food & Beverage', name: 'Executive Buffet Breakfast', defaultPrice: 15.00, description: 'International breakfast buffet spread' },
  { code: 'FB-RMS-01', category: 'Food & Beverage', name: 'In-Room Dining Service', defaultPrice: 30.00, description: 'Room service tray delivery & meals' },
  { code: 'MB-MINI-01', category: 'Room Amenities', name: 'Mini Bar Refreshments', defaultPrice: 18.00, description: 'Room minibar snacks & cold beverages' },
  { code: 'LD-NAT-01', category: 'Laundry', name: 'Laundry Natura - Wash & Iron', defaultPrice: 12.50, description: 'Express wash, dry & press laundry' },
  { code: 'LD-DRY-01', category: 'Laundry', name: 'Dry Cleaning Service', defaultPrice: 22.00, description: 'Suits, formal dresses, delicate fabrics' },
  { code: 'SP-KHM-01', category: 'Spa & Wellness', name: 'Traditional Khmer Massage (60m)', defaultPrice: 40.00, description: 'Full body restorative herbal acupressure' },
  { code: 'SP-ARM-01', category: 'Spa & Wellness', name: 'Royal Aromatherapy Spa (90m)', defaultPrice: 65.00, description: 'Relaxing essential organic oils massage' },
  { code: 'TR-AIR-01', category: 'Transportation', name: 'Airport Transfer (Private Sedan)', defaultPrice: 35.00, description: 'Executive private pick-up / drop-off' },
  { code: 'TR-ANG-01', category: 'Transportation', name: 'Angkor Wat Sunrise Day Tour', defaultPrice: 75.00, description: 'Private temple tour with English guide' },
  { code: 'RM-BED-01', category: 'Room Amenities', name: 'Extra Bed / Rollaway', defaultPrice: 25.00, description: 'Extra bed setup with premium linen' },
  { code: 'RM-LAT-01', category: 'Room Amenities', name: 'Late Check-out Surcharge', defaultPrice: 30.00, description: 'Guaranteed late departure until 18:00' },
  { code: 'MC-INC-01', category: 'Miscellaneous', name: 'Incidental / Key Card Fee', defaultPrice: 10.00, description: 'Replacement RFID smart room key card' },
  { code: 'MC-CUS-01', category: 'Miscellaneous', name: 'Custom Charge Item', defaultPrice: 20.00, description: 'Manual custom item & custom amount' },
];

export const DEFAULT_DEMO_CHARGES: BillChargeItem[] = [];

interface BillDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room?: Room | null;
  guestName?: string;
  settings: UserSettings;
  currentUser?: { username: string; fullName: string };
  businessDate?: string;
  onOpenLedger?: () => void;
  onOpenRouting?: () => void;
}

export const BillDetailsModal: React.FC<BillDetailsModalProps> = ({
  isOpen,
  onClose,
  room,
  guestName: propGuestName,
  settings,
  currentUser,
  businessDate,
  onOpenLedger,
  onOpenRouting,
}) => {
  const currentGuest = propGuestName || room?.guestName || 'Mr.BONG SMBATH, .';
  const currentRoomNum = room?.roomNumber || '9023';

  // Header metadata states matching screenshot
  const [arrivalDate, setArrivalDate] = useState<string>('07/09/2020');
  const [departureDate, setDepartureDate] = useState<string>('30/09/2020');
  const [roomType, setRoomType] = useState<string>('9001');
  const [ratePlan, setRatePlan] = useState<string>('Regular Tariff');
  const [paxCount, setPaxCount] = useState<number>(2);
  const [numSplits, setNumSplits] = useState<number>(2);
  const [isSplitEnabled, setIsSplitEnabled] = useState<boolean>(true);
  const [companyName, setCompanyName] = useState<string>('DIRECT BOOKING - SELF BOOKING');
  const [groupName, setGroupName] = useState<string>('');
  const [billingInfo, setBillingInfo] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [isNetMode, setIsNetMode] = useState<boolean>(true);

  // Active selection for transfer & multi-select
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);
  const [selectedChargeIds, setSelectedChargeIds] = useState<string[]>([]);
  const [showAddChargeModal, setShowAddChargeModal] = useState<boolean>(false);
  const [newChargeDate, setNewChargeDate] = useState<string>('15-Sep-26');
  const [newChargeDesc, setNewChargeDesc] = useState<string>('Accommodation Charge');
  const [newChargeAmount, setNewChargeAmount] = useState<string>('40.00');
  const [newChargeSplit, setNewChargeSplit] = useState<number>(1);
  const [showLedgerView, setShowLedgerView] = useState<boolean>(false);
  const [showRoutingView, setShowRoutingView] = useState<boolean>(false);
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);
  const [printSplitTarget, setPrintSplitTarget] = useState<'split1' | 'split2' | 'both' | 'single'>('split1');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Posting Choice, Other Charge List, & Payment Method States
  const [showPostingChoiceModal, setShowPostingChoiceModal] = useState<boolean>(false);
  const [showOtherChargeListModal, setShowOtherChargeListModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  // Room Tariff & Manual Room Charge Posting States (Posted by User)
  const [tariffRate, setTariffRate] = useState<number>(() => {
    return room?.pricePerNight ?? 40.00;
  });
  const [showPostRoomChargeModal, setShowPostRoomChargeModal] = useState<boolean>(false);
  const [roomChargePostDate, setRoomChargePostDate] = useState<string>('29-Aug-26');
  const [roomChargePostTariff, setRoomChargePostTariff] = useState<number>(40.00);
  const [roomChargePostSplit, setRoomChargePostSplit] = useState<number>(1);
  const [roomChargePostDesc, setRoomChargePostDesc] = useState<string>('Room Charge');

  // Other Charge List State & Catalog
  const [chargeCatalog, setChargeCatalog] = useState<OtherChargeCatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem('winhms_charge_catalog');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load charge catalog', e);
    }
    return OTHER_CHARGE_CATALOG;
  });
  const [otherChargeSelectedCode, setOtherChargeSelectedCode] = useState<string>('FB-ROK-01');
  const [originalSelectedCode, setOriginalSelectedCode] = useState<string>('FB-ROK-01');
  const [isEditingChargeCode, setIsEditingChargeCode] = useState<boolean>(false);
  const [catalogSaveStatus, setCatalogSaveStatus] = useState<string | null>(null);
  const [otherChargeCategory, setOtherChargeCategory] = useState<string>('All');
  const [otherChargeSearch, setOtherChargeSearch] = useState<string>('');
  const [otherChargeName, setOtherChargeName] = useState<string>('Food - Rokkhak Restaurant');
  const [otherChargeUnitPrice, setOtherChargeUnitPrice] = useState<number>(45.00);
  const [otherChargeQty, setOtherChargeQty] = useState<number>(1);
  const [otherChargeSplit, setOtherChargeSplit] = useState<number>(1);
  const [otherChargeDate, setOtherChargeDate] = useState<string>('15-Sep-26');
  const [otherChargeVoucher, setOtherChargeVoucher] = useState<string>('');

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [paymentAmount, setPaymentAmount] = useState<string>('0.00');
  const [paymentSplit, setPaymentSplit] = useState<number>(1);
  const [paymentDate, setPaymentDate] = useState<string>('15-Sep-26');
  const [paymentReceiptNo, setPaymentReceiptNo] = useState<string>('');
  const [paymentRemarks, setPaymentRemarks] = useState<string>('');
  const [paymentPayerName, setPaymentPayerName] = useState<string>('');
  const [paymentCardLast4, setPaymentCardLast4] = useState<string>('');

  // Helper to format date cleanly as DD-MMM-YY (e.g. 07-Sep-26)
  const formatFolioDate = (rawDate: string | undefined): string => {
    if (!rawDate) return '07-Sep-26';
    const trimmed = rawDate.trim();

    // Already DD-MMM-YY (e.g. 07-Sep-26, 07-SEP-26)
    const matchDMM2 = trimmed.match(/^(\d{1,2})[-/ ]?([A-Za-z]{3})[-/ ]?(\d{2})$/);
    if (matchDMM2) {
      const day = matchDMM2[1].padStart(2, '0');
      const month = matchDMM2[2].charAt(0).toUpperCase() + matchDMM2[2].slice(1, 3).toLowerCase();
      const yr = matchDMM2[3];
      return `${day}-${month}-${yr}`;
    }

    // Match DD-MMM-YYYY (e.g. 07-Sep-2026, 07-Sep-2020) -> convert to DD-MMM-YY
    const matchDMM4 = trimmed.match(/^(\d{1,2})[-/ ]?([A-Za-z]{3})[-/ ]?(\d{4})$/);
    if (matchDMM4) {
      const day = matchDMM4[1].padStart(2, '0');
      const month = matchDMM4[2].charAt(0).toUpperCase() + matchDMM4[2].slice(1, 3).toLowerCase();
      const yr = matchDMM4[3].slice(-2);
      return `${day}-${month}-${yr}`;
    }

    // Match short without year like 07Sep or 07-Sep
    const matchNoYear = trimmed.match(/^(\d{1,2})[-/ ]?([A-Za-z]{3})$/);
    if (matchNoYear) {
      const day = matchNoYear[1].padStart(2, '0');
      const month = matchNoYear[2].charAt(0).toUpperCase() + matchNoYear[2].slice(1, 3).toLowerCase();
      return `${day}-${month}-26`;
    }

    // Match slash or hyphen DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const matchSlash = trimmed.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
    if (matchSlash) {
      const day = matchSlash[1].padStart(2, '0');
      const mNum = parseInt(matchSlash[2], 10);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const month = months[mNum - 1] || 'Sep';
      const yr = matchSlash[3].slice(-2);
      return `${day}-${month}-${yr}`;
    }

    // Match ISO YYYY-MM-DD
    const matchIso = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (matchIso) {
      const yr = matchIso[1].slice(-2);
      const mNum = parseInt(matchIso[2], 10);
      const day = matchIso[3].padStart(2, '0');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const month = months[mNum - 1] || 'Sep';
      return `${day}-${month}-${yr}`;
    }

    return trimmed;
  };

  // Helper to strip redundant leading date/month and suffix like "-Tariff" from descriptions (e.g. "Room Charge - Tariff" -> "Room Charge")
  const cleanFolioDescription = (desc: string | undefined): string => {
    if (!desc) return '';
    let cleaned = desc
      .replace(/^(\d{1,2}[-/ ]?[A-Za-z]{3}(?:[-/ ]?\d{2,4})?|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})(?:[-/ ]*\d+)?\s*[•\-|:]\s*/i, '')
      .replace(/^\d{1,2}[A-Za-z]{3}\s+/i, '')
      .trim();

    // Strip "- Tariff" / "-Tariff" suffix so only "Room Charge" is displayed
    cleaned = cleaned
      .replace(/\s*-\s*tariff\b/gi, '')
      .replace(/\s*\(\s*tariff\s*\)/gi, '')
      .trim();

    return cleaned;
  };

  // Helper to determine if an item is a payment or settlement
  const isPaymentItem = (item: BillChargeItem): boolean => {
    if (item.isPayment) return true;
    if (item.amount < 0) {
      if (item.paymentMethod && item.paymentMethod.trim() !== '') return true;
      if (/payment|settlement|paid|cash|visa|master|khqr|bakong/i.test(item.description)) return true;
    }
    return false;
  };

  // Helper to format item description / particulars for folio tables and print preview
  // Specifically shows: "Cash", "Master Card", "Visa Card", etc. depending on payment method
  const getFolioParticulars = (item: BillChargeItem): string => {
    if (isPaymentItem(item)) {
      const pm = item.paymentMethod;
      if (pm === 'Cash') return 'Cash';
      if (pm === 'Master Card') return 'Master Card';
      if (pm === 'Visa Card') return 'Visa Card';
      if (pm === 'Credit Card') {
        if (/master/i.test(item.description)) return 'Master Card';
        if (/cash/i.test(item.description)) return 'Cash';
        return 'Visa Card';
      }
      if (pm) return pm;

      // Extract from description if paymentMethod was not saved
      const lower = item.description.toLowerCase();
      if (lower.includes('master')) return 'Master Card';
      if (lower.includes('visa')) return 'Visa Card';
      if (lower.includes('cash')) return 'Cash';
      if (lower.includes('aba qr') || lower.includes('khqr')) return 'ABA QR Pay';
      if (lower.includes('bank') || lower.includes('transfer')) return 'Bank Transfer';
      return 'Visa Card';
    }
    return cleanFolioDescription(item.description);
  };

  // Folio transactions start empty unless posted by Night Audit or user posting
  const [charges, setCharges] = useState<BillChargeItem[]>(() => []);

  // Handler to switch payment method on any existing payment charge
  const handleChangeItemPaymentMethod = (chargeId: string, newMethod: PaymentMethod) => {
    setCharges(prev => {
      const updated = prev.map(c => {
        if (c.id === chargeId) {
          return {
            ...c,
            isPayment: true,
            paymentMethod: newMethod,
            description: newMethod,
          };
        }
        return c;
      });
      saveChargesToLocalStorage(updated);
      return updated;
    });
    if (settings.soundEffects) playChime();
    showToast(`Payment method updated to ${newMethod}`);
  };

  // Handler to clear all transactions and reset folio to empty
  const handleClearAllTransactions = () => {
    if (charges.length === 0) return;
    setCharges([]);
    saveChargesToLocalStorage([]);
    setSelectedChargeIds([]);
    setSelectedChargeId(null);
    if (settings.soundEffects) playChime();
    showToast('Folio reset: all transactions cleared.');
    try {
      window.dispatchEvent(new CustomEvent('pms_folio_updated', { detail: { roomNumber: currentRoomNum } }));
    } catch (err) {}
  };

  // Load saved bill settings / splits from localStorage
  useEffect(() => {
    if (isOpen) {
      const storageKey = `winhms_bill_${currentRoomNum}_${currentGuest.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.charges && Array.isArray(parsed.charges)) {
            // Filter out any legacy pre-seeded mock demo charges (c-1..c-18) so folios are empty unless posted by Night Audit or user
            const validCharges = parsed.charges.filter((c: BillChargeItem) => {
              if (!c || !c.id) return false;
              return !/^c-(?:[1-9]|1[0-8])(?:-pay)?$/.test(c.id);
            });
            const mappedCharges = validCharges.map((c: BillChargeItem) => {
              let isPay = c.isPayment;
              let pm = c.paymentMethod;
              if (c.amount < 0) {
                if (/master/i.test(c.description)) { pm = 'Master Card'; isPay = true; }
                else if (/visa/i.test(c.description)) { pm = 'Visa Card'; isPay = true; }
                else if (/cash/i.test(c.description)) { pm = 'Cash'; isPay = true; }
                else if (/credit/i.test(c.description)) { pm = 'Visa Card'; isPay = true; }
                else if (c.description.toLowerCase().includes('payment')) { pm = 'Visa Card'; isPay = true; }
              }
              return {
                ...c,
                date: formatFolioDate(c.date),
                isPayment: isPay,
                paymentMethod: pm || c.paymentMethod,
              };
            });
            setCharges(mappedCharges);

            // Persist cleaned charges if legacy demo items were stripped
            if (validCharges.length !== parsed.charges.length) {
              parsed.charges = mappedCharges;
              localStorage.setItem(storageKey, JSON.stringify(parsed));
            }
          } else {
            setCharges([]);
          }
          if (typeof parsed.isSplitEnabled === 'boolean') setIsSplitEnabled(parsed.isSplitEnabled);
          if (typeof parsed.numSplits === 'number') setNumSplits(parsed.numSplits);
          if (parsed.arrivalDate) setArrivalDate(parsed.arrivalDate);
          if (parsed.departureDate) setDepartureDate(parsed.departureDate);
          if (parsed.ratePlan) setRatePlan(parsed.ratePlan);
          if (parsed.paxCount) setPaxCount(parsed.paxCount);
          if (parsed.companyName) setCompanyName(parsed.companyName);
          if (parsed.groupName) setGroupName(parsed.groupName);
          if (parsed.billingInfo) setBillingInfo(parsed.billingInfo);
          if (typeof parsed.tariffRate === 'number' && parsed.tariffRate > 0) {
            setTariffRate(parsed.tariffRate);
          } else if (room?.pricePerNight) {
            setTariffRate(room.pricePerNight);
          }
        } catch (e) {
          console.error('Error loading saved bill details:', e);
          setCharges([]);
        }
      } else {
        setCharges([]);
      }
    }

    const handleFolioUpdated = () => {
      const storageKey = `winhms_bill_${currentRoomNum}_${currentGuest.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (typeof parsed.tariffRate === 'number' && parsed.tariffRate > 0) {
            setTariffRate(parsed.tariffRate);
          }
          if (parsed.charges && Array.isArray(parsed.charges)) {
            const validCharges = parsed.charges.filter((c: BillChargeItem) => {
              if (!c || !c.id) return false;
              return !/^c-(?:[1-9]|1[0-8])(?:-pay)?$/.test(c.id);
            });
            setCharges(validCharges.map((c: BillChargeItem) => {
              let isPay = c.isPayment;
              let pm = c.paymentMethod;
              if (c.amount < 0) {
                if (/master/i.test(c.description)) { pm = 'Master Card'; isPay = true; }
                else if (/visa/i.test(c.description)) { pm = 'Visa Card'; isPay = true; }
                else if (/cash/i.test(c.description)) { pm = 'Cash'; isPay = true; }
                else if (/credit/i.test(c.description)) { pm = 'Visa Card'; isPay = true; }
                else if (c.description.toLowerCase().includes('payment')) { pm = 'Visa Card'; isPay = true; }
              }
              return {
                ...c,
                date: formatFolioDate(c.date),
                isPayment: isPay,
                paymentMethod: pm || c.paymentMethod,
              };
            }));
          } else {
            setCharges([]);
          }
        } catch (e) {
          setCharges([]);
        }
      }
    };

    window.addEventListener('pms_folio_updated', handleFolioUpdated);
    return () => {
      window.removeEventListener('pms_folio_updated', handleFolioUpdated);
    };
  }, [isOpen, currentRoomNum, currentGuest]);

  // Sync if room provided
  useEffect(() => {
    if (room && isOpen) {
      if (room.checkInDate) {
        try {
          const parts = room.checkInDate.split('-');
          if (parts.length === 3) setArrivalDate(`${parts[2]}/${parts[1]}/${parts[0]}`);
        } catch {
          // keep default
        }
      }
      if (room.checkOutDate) {
        try {
          const parts = room.checkOutDate.split('-');
          if (parts.length === 3) setDepartureDate(`${parts[2]}/${parts[1]}/${parts[0]}`);
        } catch {
          // keep default
        }
      }
      if (room.type) {
        setRoomType(room.type.includes('9001') ? '9001' : room.roomNumber || '9001');
      }
      if (room.pricePerNight) {
        setTariffRate(room.pricePerNight);
      }
    }
  }, [room, isOpen]);

  // Calculate totals
  const split1Charges = charges.filter(c => c.splitId === 1);
  const split2Charges = charges.filter(c => c.splitId === 2);
  const split1Total = split1Charges.reduce((acc, c) => acc + c.amount, 0);
  const split2Total = split2Charges.reduce((acc, c) => acc + c.amount, 0);
  const grandTotal = split1Total + split2Total;

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleToggleSelectRow = (chargeId: string) => {
    setSelectedChargeIds(prev => 
      prev.includes(chargeId) ? prev.filter(id => id !== chargeId) : [...prev, chargeId]
    );
  };

  const handleSelectAllInSplit = (splitId: number) => {
    const idsInSplit = charges.filter(c => c.splitId === splitId).map(c => c.id);
    const allSelected = idsInSplit.every(id => selectedChargeIds.includes(id));
    if (allSelected) {
      setSelectedChargeIds(prev => prev.filter(id => !idsInSplit.includes(id)));
    } else {
      setSelectedChargeIds(prev => Array.from(new Set([...prev, ...idsInSplit])));
    }
  };

  const handleTransferSelected = (targetSplit: number) => {
    if (selectedChargeIds.length === 0) {
      showToast('Please select one or more items to move.');
      return;
    }
    setCharges(prev => prev.map(c => {
      if (selectedChargeIds.includes(c.id)) {
        return { ...c, splitId: targetSplit };
      }
      return c;
    }));
    if (settings.soundEffects) playChime();
    showToast(`Moved ${selectedChargeIds.length} item(s) to Split ${targetSplit}.`);
    setSelectedChargeIds([]);
  };

  const handleMoveAllToSplit = (fromSplit: number, toSplit: number) => {
    const count = charges.filter(c => c.splitId === fromSplit).length;
    if (count === 0) {
      showToast(`No charges in Split ${fromSplit} to move.`);
      return;
    }
    setCharges(prev => prev.map(c => {
      if (c.splitId === fromSplit) {
        return { ...c, splitId: toSplit };
      }
      return c;
    }));
    if (settings.soundEffects) playChime();
    showToast(`Moved all ${count} charges from Split ${fromSplit} to Split ${toSplit}.`);
  };

  const handleMergeAllToSingle = () => {
    setCharges(prev => prev.map(c => ({ ...c, splitId: 1 })));
    setIsSplitEnabled(false);
    setNumSplits(1);
    if (settings.soundEffects) playChime();
    showToast('Consolidated all charges into Single Folio (No Split).');
  };

  const handleTransferCharge = (chargeId: string) => {
    setCharges(prev => prev.map(c => {
      if (c.id === chargeId) {
        const nextSplit = c.splitId === 1 ? 2 : 1;
        return { ...c, splitId: nextSplit };
      }
      return c;
    }));
    if (settings.soundEffects) playChime();
    showToast('Charge routed to opposite split folio.');
  };

  const handleDeleteCharge = (chargeId: string) => {
    setCharges(prev => {
      const updated = prev.filter(c => c.id !== chargeId);
      try {
        const storageKey = `winhms_bill_${currentRoomNum}_${currentGuest.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const saved = localStorage.getItem(storageKey);
        const prevData = saved ? JSON.parse(saved) : {};
        localStorage.setItem(storageKey, JSON.stringify({ ...prevData, charges: updated }));
      } catch (e) {
        console.error('Failed to sync deleted charge to localStorage', e);
      }
      return updated;
    });
    if (selectedChargeId === chargeId) setSelectedChargeId(null);
    setSelectedChargeIds(prev => prev.filter(id => id !== chargeId));
    if (settings.soundEffects) playChime();
    showToast('Charge line item deleted successfully.');
  };

  const handleDeleteSelected = () => {
    if (selectedChargeIds.length === 0) {
      showToast('Please select one or more items to delete.');
      return;
    }
    const count = selectedChargeIds.length;
    setCharges(prev => {
      const updated = prev.filter(c => !selectedChargeIds.includes(c.id));
      try {
        const storageKey = `winhms_bill_${currentRoomNum}_${currentGuest.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const saved = localStorage.getItem(storageKey);
        const prevData = saved ? JSON.parse(saved) : {};
        localStorage.setItem(storageKey, JSON.stringify({ ...prevData, charges: updated }));
      } catch (e) {
        console.error('Failed to sync deleted charges to localStorage', e);
      }
      return updated;
    });
    setSelectedChargeId(null);
    setSelectedChargeIds([]);
    if (settings.soundEffects) playChime();
    showToast(`Deleted ${count} selected item(s) from folio.`);
  };

  const handleSave = () => {
    const storageKey = `winhms_bill_${currentRoomNum}_${currentGuest.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const payload = {
      charges,
      isSplitEnabled,
      numSplits,
      arrivalDate,
      departureDate,
      ratePlan,
      tariffRate,
      paxCount,
      companyName,
      groupName,
      billingInfo,
      currency,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
      if (settings.soundEffects) playChime();
      showToast('Bill details & Split Folio configuration saved successfully.');
    } catch (e) {
      console.error('Failed to save to localStorage', e);
      showToast('Saved changes locally.');
    }
  };

  // Helper to identify accommodation / room charges
  const isAccommodationItem = (item: BillChargeItem): boolean => {
    if (item.category === 'Accommodation') return true;
    const desc = item.description.toLowerCase();
    return desc.includes('accommodation') || desc.includes('room charge') || desc.includes('tariff');
  };

  const handleOpenPostRoomChargeModal = (splitTarget: number = 1) => {
    const defaultDate = businessDate ? formatFolioDate(businessDate) : (arrivalDate ? formatFolioDate(arrivalDate) : '29-Aug-26');
    setRoomChargePostDate(defaultDate);
    setRoomChargePostTariff(tariffRate);
    setRoomChargePostSplit(splitTarget);
    setRoomChargePostDesc('Room Charge');
    setShowPostRoomChargeModal(true);
  };

  const handlePostRoomChargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDesc = cleanFolioDescription(roomChargePostDesc) || 'Room Charge';
    const newCharge: BillChargeItem = {
      id: `c-user-rm-${currentRoomNum}-${Date.now()}`,
      date: formatFolioDate(roomChargePostDate),
      description: cleanDesc,
      amount: roomChargePostTariff,
      splitId: roomChargePostSplit,
      category: 'Accommodation',
      referenceNo: `USR-TARIFF-${currentRoomNum}-${Date.now().toString().slice(-4)}`,
      postedBy: 'User',
      tariffRate: roomChargePostTariff,
    };
    const updated = [...charges, newCharge];
    setCharges(updated);
    saveChargesToLocalStorage(updated);
    setShowPostRoomChargeModal(false);
    if (settings.soundEffects) playChime();
    showToast(`Posted Room Charge ($${roomChargePostTariff.toFixed(2)}) to Split ${roomChargePostSplit} by user.`);
    try {
      window.dispatchEvent(new CustomEvent('pms_folio_updated', { detail: { roomNumber: currentRoomNum } }));
    } catch (err) {}
  };

  const handleSetChargeToTariff = (chargeId: string) => {
    const updated = charges.map((c) => {
      if (c.id === chargeId) {
        return {
          ...c,
          amount: tariffRate,
          description: cleanFolioDescription(c.description) || 'Room Charge',
          tariffRate: tariffRate,
          postedBy: c.postedBy || 'User',
        };
      }
      return c;
    });
    setCharges(updated);
    saveChargesToLocalStorage(updated);
    if (settings.soundEffects) playChime();
    showToast(`Room charge updated to match Tariff ($${tariffRate.toFixed(2)})`);
    try {
      window.dispatchEvent(new CustomEvent('pms_folio_updated', { detail: { roomNumber: currentRoomNum } }));
    } catch (err) {}
  };

  const handleSetAllSplitChargesToTariff = (splitId: number) => {
    let count = 0;
    const updated = charges.map((c) => {
      if (c.splitId === splitId && isAccommodationItem(c)) {
        count++;
        return {
          ...c,
          amount: tariffRate,
          description: cleanFolioDescription(c.description) || 'Room Charge',
          tariffRate: tariffRate,
        };
      }
      return c;
    });
    if (count > 0) {
      setCharges(updated);
      saveChargesToLocalStorage(updated);
      if (settings.soundEffects) playChime();
      showToast(`Updated ${count} room charge(s) in Split ${splitId} to match Tariff ($${tariffRate.toFixed(2)})`);
      try {
        window.dispatchEvent(new CustomEvent('pms_folio_updated', { detail: { roomNumber: currentRoomNum } }));
      } catch (err) {}
    } else {
      showToast(`No accommodation charges in Split ${splitId}. Click [+ Post Tariff] to add one.`);
    }
  };

  const handleAddChargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(newChargeAmount) || 0;
    const cleanDesc = cleanFolioDescription(newChargeDesc);
    const isRoom = cleanDesc.toLowerCase().includes('accommodation') || cleanDesc.toLowerCase().includes('room');
    const newCharge: BillChargeItem = {
      id: `c-${Date.now()}`,
      date: formatFolioDate(newChargeDate),
      description: cleanDesc,
      amount: parsedAmt,
      splitId: newChargeSplit,
      category: isRoom ? 'Accommodation' : 'Misc',
      postedBy: 'User',
      tariffRate: isRoom ? parsedAmt : undefined,
    };
    const updated = [...charges, newCharge];
    setCharges(updated);
    saveChargesToLocalStorage(updated);
    setShowAddChargeModal(false);
    if (settings.soundEffects) playChime();
    showToast(`Added ${cleanDesc} ($${parsedAmt.toFixed(2)}) to Split ${newChargeSplit}`);
    try {
      window.dispatchEvent(new CustomEvent('pms_folio_updated', { detail: { roomNumber: currentRoomNum } }));
    } catch (err) {}
  };

  const saveChargesToLocalStorage = (updatedCharges: BillChargeItem[]) => {
    try {
      const storageKey = `winhms_bill_${currentRoomNum}_${currentGuest.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const saved = localStorage.getItem(storageKey);
      const prevData = saved ? JSON.parse(saved) : {};
      localStorage.setItem(storageKey, JSON.stringify({
        ...prevData,
        charges: updatedCharges,
        isSplitEnabled,
        numSplits,
        arrivalDate,
        departureDate,
        ratePlan,
        tariffRate,
        paxCount,
        companyName,
        groupName,
        billingInfo,
        currency,
        savedAt: new Date().toISOString(),
      }));
    } catch (e) {
      console.error('Failed to sync charges to localStorage', e);
    }
  };

  const handleSelectCatalogItem = (item: OtherChargeCatalogItem) => {
    setOtherChargeSelectedCode(item.code);
    setOriginalSelectedCode(item.code);
    setOtherChargeName(item.name);
    setOtherChargeUnitPrice(item.defaultPrice);
    setIsEditingChargeCode(false);
    setCatalogSaveStatus(null);
  };

  const handleSaveCatalogItemEdit = (showToastMsg: boolean = true) => {
    const cleanCode = otherChargeSelectedCode.trim().toUpperCase() || 'CHG-01';
    const cleanName = otherChargeName.trim() || 'Custom Charge';
    const unitPrice = parseFloat(otherChargeUnitPrice.toString()) || 0;

    setChargeCatalog(prev => {
      let updated: OtherChargeCatalogItem[];
      const idx = prev.findIndex(item => item.code === originalSelectedCode);
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          code: cleanCode,
          name: cleanName,
          defaultPrice: unitPrice,
        };
      } else {
        const codeIdx = prev.findIndex(item => item.code === cleanCode);
        if (codeIdx >= 0) {
          updated = [...prev];
          updated[codeIdx] = {
            ...updated[codeIdx],
            name: cleanName,
            defaultPrice: unitPrice,
          };
        } else {
          updated = [
            ...prev,
            {
              code: cleanCode,
              category: (otherChargeCategory !== 'All' ? otherChargeCategory : 'Miscellaneous') as any,
              name: cleanName,
              defaultPrice: unitPrice,
              description: 'Custom added / modified charge item',
            }
          ];
        }
      }
      try {
        localStorage.setItem('winhms_charge_catalog', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save charge catalog', e);
      }
      return updated;
    });

    setOriginalSelectedCode(cleanCode);
    setIsEditingChargeCode(false);
    setCatalogSaveStatus('saved');
    if (showToastMsg) {
      if (settings.soundEffects) playChime();
      showToast(`Saved changes for ${cleanCode} to catalog.`);
    }
    setTimeout(() => setCatalogSaveStatus(null), 3500);
  };

  const handlePostOtherCharge = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(otherChargeUnitPrice.toString()) || 0;
    const qty = Math.max(1, parseInt(otherChargeQty.toString()) || 1);
    const totalAmt = parsedPrice * qty;
    const refStr = otherChargeVoucher.trim() ? ` [Ref: ${otherChargeVoucher.trim()}]` : '';
    const cleanDesc = cleanFolioDescription(`${otherChargeName}${refStr}`);

    // Automatically sync any edits back to the catalog
    handleSaveCatalogItemEdit(false);

    const newChargeItem: BillChargeItem = {
      id: `c-oth-${Date.now()}`,
      date: formatFolioDate(otherChargeDate),
      description: cleanDesc,
      amount: totalAmt,
      splitId: otherChargeSplit,
      category: 'Misc',
    };

    setCharges(prev => {
      const updated = [...prev, newChargeItem];
      saveChargesToLocalStorage(updated);
      return updated;
    });

    setShowOtherChargeListModal(false);
    if (settings.soundEffects) playChime();
    showToast(`Posted "${cleanDesc}" ($${totalAmt.toFixed(2)}) to Split ${otherChargeSplit}`);
  };

  const handlePostPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(paymentAmount) || 0;
    if (parsedAmt <= 0) {
      showToast('Please enter a valid payment amount greater than $0.00');
      return;
    }

    const cardNote = (paymentMethod === 'Credit Card' || paymentMethod === 'Visa Card' || paymentMethod === 'Master Card') && paymentCardLast4.trim() ? ` *${paymentCardLast4.trim()}` : '';
    const refStr = paymentReceiptNo.trim() ? ` (Ref: ${paymentReceiptNo.trim()})` : '';
    const desc = `${paymentMethod}${cardNote}${refStr}`;

    const newPaymentItem: BillChargeItem = {
      id: `c-pay-${Date.now()}`,
      date: formatFolioDate(paymentDate),
      description: desc,
      amount: -Math.abs(parsedAmt), // negative credit towards folio balance
      splitId: paymentSplit,
      category: 'Misc',
      isPayment: true,
      paymentMethod,
      referenceNo: paymentReceiptNo,
    };

    setCharges(prev => {
      const updated = [...prev, newPaymentItem];
      saveChargesToLocalStorage(updated);
      return updated;
    });

    setShowPaymentModal(false);
    if (settings.soundEffects) playChime();
    showToast(`Payment of $${parsedAmt.toFixed(2)} via ${paymentMethod} posted to Split ${paymentSplit}.`);
  };

  const handleOpenPrintPreview = (target: 'split1' | 'split2' | 'both' | 'single' = 'split1') => {
    if (!isSplitEnabled && target !== 'single') {
      setPrintSplitTarget('single');
    } else {
      setPrintSplitTarget(target);
    }
    setShowPrintPreview(true);
  };

  const handlePrint = () => {
    handleOpenPrintPreview(isSplitEnabled ? 'both' : 'single');
  };

  const handleExportExcel = () => {
    const propertyName = settings?.hotelName || 'ROYAL PALACE HOTEL & SUITES';
    const address = [
      settings?.houseNumber,
      settings?.streetAddress,
      settings?.communeSangkat,
      settings?.townKhan,
      settings?.provinceCity || settings?.address,
    ].filter(Boolean).join(', ') || settings?.address || 'Siem Reap, Kingdom of Cambodia';
    const phone = settings?.phone || '(+855) 23 888 999';
    const email = settings?.managerEmail || 'reservations@royalpalacehotel.com';
    const vatNumber = settings?.vatNumber || 'K008-902401874';
    const vatRate = (settings?.taxRatePercent ?? 10) / 100;
    const serviceRate = (settings?.serviceChargePercent ?? 5) / 100;
    const exchangeRate = settings?.exchangeRateKHR || settings?.exchangeRateUSDToKHR || 4015;

    const targetCharges1 = (printSplitTarget === 'split2') ? [] : split1Charges;
    const targetCharges2 = (printSplitTarget === 'split1') ? [] : split2Charges;

    const total1 = targetCharges1.reduce((sum, c) => sum + c.amount, 0);
    const total2 = targetCharges2.reduce((sum, c) => sum + c.amount, 0);
    const activeSubtotal = (printSplitTarget === 'split1') ? total1 : (printSplitTarget === 'split2') ? total2 : grandTotal;
    const netTotalUSD = activeSubtotal;
    const netTotalKHR = Math.round(netTotalUSD * exchangeRate);

    // Build Microsoft Excel HTML XML Workbook
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #000; }
    .header-title { font-size: 16pt; font-weight: bold; color: #003366; }
    .sub-header { font-size: 9.5pt; color: #555555; }
    .section-banner { background-color: #003366; color: #FFFFFF; font-weight: bold; font-size: 12pt; text-align: left; padding: 6px; }
    .split-banner-1 { background-color: #e4ebd9; color: #2e4d1d; font-weight: bold; font-size: 11pt; border-bottom: 2px solid #8fad6a; }
    .split-banner-2 { background-color: #d9e1f2; color: #1f3864; font-weight: bold; font-size: 11pt; border-bottom: 2px solid #8ea9db; }
    .meta-table { border: 1px solid #c6d9f1; background-color: #f2f5f9; }
    .meta-label { font-weight: bold; color: #404040; background-color: #e9eef4; }
    .table-header { background-color: #003366; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #002244; }
    .table-header-alt { background-color: #2e4d1d; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #1f3814; }
    .cell-data { border: 1px solid #d9d9d9; padding: 4px 6px; }
    .cell-num { border: 1px solid #d9d9d9; text-align: right; mso-number-format:"\\$#,##0.00"; }
    .cell-credit { border: 1px solid #d9d9d9; text-align: right; color: #c00000; mso-number-format:"\\$#,##0.00"; }
    .total-banner { background-color: #ffff99; font-weight: bold; color: #000000; font-size: 12pt; border-top: 2px solid #000; }
    .khr-banner { background-color: #e7e6e6; font-weight: bold; color: #1f3864; font-size: 11pt; }
  </style>
</head>
<body>
  <table>
    <tr>
      <td colspan="6" class="header-title">${propertyName}</td>
    </tr>
    <tr>
      <td colspan="6" class="sub-header">${address} | Tel: ${phone} | Email: ${email}${vatNumber ? ` | VAT: ${vatNumber}` : ''}</td>
    </tr>
    <tr>
      <td colspan="6" class="section-banner">
        INVOICE
      </td>
    </tr>
    <tr><td></td></tr>
    
    <!-- Meta Info Box -->
    <tr>
      <td class="meta-label">Guest Name:</td>
      <td class="cell-data" colspan="2"><b>${currentGuest.toUpperCase()}</b></td>
      <td class="meta-label">Arrival Date:</td>
      <td class="cell-data" colspan="2">${arrivalDate}</td>
    </tr>
    <tr>
      <td class="meta-label">Room Number:</td>
      <td class="cell-data" colspan="2">${currentRoomNum}</td>
      <td class="meta-label">Departure Date:</td>
      <td class="cell-data" colspan="2">${departureDate}</td>
    </tr>
    <tr>
      <td class="meta-label">Company:</td>
      <td class="cell-data" colspan="2">${companyName || 'Direct Booking'}</td>
      <td class="meta-label">Duty Cashier:</td>
      <td class="cell-data" colspan="2">${currentUser?.username || settings?.managerName || 'PHANIT'}</td>
    </tr>
    <tr>
      <td class="meta-label">Invoice Nº:</td>
      <td class="cell-data" colspan="5">INV-${currentRoomNum}-${printSplitTarget === 'split2' ? 'SPL2' : 'SPL1'}-0028</td>
    </tr>
    <tr><td></td></tr>`;

    // SPLIT 1 CHARGES
    if (targetCharges1.length > 0) {
      html += `
    <tr>
      <td colspan="6" class="split-banner-1">Guest Charge</td>
    </tr>
    <tr class="table-header">
      <td style="width: 40px;">#</td>
      <td style="width: 100px;">Date</td>
      <td style="width: 280px;">Description / Particulars</td>
      <td style="width: 110px;">Debit ($)</td>
      <td style="width: 110px;">Credit ($)</td>
      <td style="width: 120px;">Balance ($)</td>
    </tr>`;

      targetCharges1.forEach((item, index) => {
        const isCredit = item.amount < 0;
        html += `
    <tr>
      <td class="cell-data" style="text-align: center;">${index + 1}</td>
      <td class="cell-data">${formatFolioDate(item.date)}</td>
      <td class="cell-data">${getFolioParticulars(item)}</td>
      <td class="cell-num">${!isCredit ? `$ ${item.amount.toFixed(2)}` : '-'}</td>
      <td class="cell-credit">${isCredit ? `$ ${Math.abs(item.amount).toFixed(2)}` : '-'}</td>
      <td class="cell-num"><b>$ ${item.amount.toFixed(2)}</b></td>
    </tr>`;
      });

      html += `
    <tr>
      <td colspan="5" class="cell-data" style="text-align: right; font-weight: bold; background-color: #f2f2f2;">Split 1 Subtotal:</td>
      <td class="cell-num" style="background-color: #f2f2f2; font-weight: bold;">$ ${total1.toFixed(2)}</td>
    </tr>
    <tr><td></td></tr>`;
    }

    // SPLIT 2 CHARGES
    if (targetCharges2.length > 0) {
      html += `
    <tr>
      <td colspan="6" class="split-banner-1">Guest Charge</td>
    </tr>
    <tr class="table-header">
      <td style="width: 40px;">#</td>
      <td style="width: 100px;">Date</td>
      <td style="width: 280px;">Description / Particulars</td>
      <td style="width: 110px;">Debit ($)</td>
      <td style="width: 110px;">Credit ($)</td>
      <td style="width: 120px;">Balance ($)</td>
    </tr>`;

      targetCharges2.forEach((item, index) => {
        const isCredit = item.amount < 0;
        html += `
    <tr>
      <td class="cell-data" style="text-align: center;">${index + 1}</td>
      <td class="cell-data">${formatFolioDate(item.date)}</td>
      <td class="cell-data">${getFolioParticulars(item)}</td>
      <td class="cell-num">${!isCredit ? `$ ${item.amount.toFixed(2)}` : '-'}</td>
      <td class="cell-credit">${isCredit ? `$ ${Math.abs(item.amount).toFixed(2)}` : '-'}</td>
      <td class="cell-num"><b>$ ${item.amount.toFixed(2)}</b></td>
    </tr>`;
      });

      html += `
    <tr>
      <td colspan="5" class="cell-data" style="text-align: right; font-weight: bold; background-color: #f2f2f2;">Split 2 Subtotal:</td>
      <td class="cell-num" style="background-color: #f2f2f2; font-weight: bold;">$ ${total2.toFixed(2)}</td>
    </tr>
    <tr><td></td></tr>`;
    }

    // SUMMARY & TOTALS
    html += `
    <tr>
      <td colspan="3" rowspan="3" class="cell-data" style="vertical-align: top; background-color: #fafafa; font-size: 9pt; color: #555;">
        <b>Billing Notice &amp; Terms:</b><br/>
        • Exchange Rate Applied: 1.00 USD = ${exchangeRate.toLocaleString()} KHR<br/>
        • I agree to be held personally liable in the event that the indicated person or company fails to pay for any part of these charges.
      </td>
      <td colspan="2" class="total-banner" style="text-align: right;">Total in USD:</td>
      <td class="cell-num total-banner">$ ${netTotalUSD.toFixed(2)}</td>
    </tr>
    <tr>
      <td colspan="2" class="khr-banner" style="text-align: right;">Total in KHR :</td>
      <td class="cell-data khr-banner" style="text-align: right;">៛ ${netTotalKHR.toLocaleString()}</td>
    </tr>
    <tr><td></td></tr>
    <tr>
      <td colspan="3" style="text-align: center; padding-top: 30px; font-weight: bold; border-top: 1px solid #888;">
        Guest Signature: _______________________
      </td>
      <td colspan="3" style="text-align: center; padding-top: 30px; font-weight: bold; border-top: 1px solid #888;">
        Cashier Signature: _______________________ (${currentUser?.username || settings?.managerName || 'PHANIT'})
      </td>
    </tr>
  </table>
</body>
</html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const targetLabel = printSplitTarget === 'split1' ? 'Split1' : printSplitTarget === 'split2' ? 'Split2' : 'FullFolio';
    const hotelPrefix = (settings?.hotelName || 'Folio').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${hotelPrefix}_Folio_${currentRoomNum}_${currentGuest.replace(/\s+/g, '_')}_${targetLabel}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported Bill Details to Excel spreadsheet (.xls) successfully!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[1.5px] p-1 sm:p-3 overflow-y-auto select-none">
      
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-4 right-4 z-60 bg-emerald-800 text-white px-3 py-1.5 rounded shadow-lg text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Main WINHMS Dialog Window */}
      <div 
        id="winhms-bill-details-dialog"
        className="w-full max-w-5xl bg-[#f4ede2] border-2 border-[#5c7080] rounded shadow-2xl flex flex-col text-neutral-900 font-sans text-xs overflow-hidden"
        style={{ minHeight: '620px' }}
      >
        
        {/* 1. TITLE BAR (Classic Retro Windows / WINHMS Style) */}
        <div className="bg-[#f0ece1] border-b border-[#a09e99] px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[12.5px] text-neutral-900 tracking-tight">
              Bill Details ( {currentGuest} ) &nbsp;&nbsp;&nbsp; Room: {currentRoomNum}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Print Icon Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-1 hover:bg-[#e0dacb] border border-transparent hover:border-[#a09e99] rounded-xs text-neutral-700 transition-colors"
              title="Print Bill Details Report"
            >
              <Printer className="w-4 h-4 text-neutral-700" />
            </button>

            {/* Excel Export Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="p-1 hover:bg-[#e0dacb] border border-transparent hover:border-[#a09e99] rounded-xs text-emerald-700 transition-colors"
              title="Export to Excel Spreadsheet (.xls)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-5 h-5 bg-[#e0dacb] hover:bg-red-500 hover:text-white border border-[#a09e99] rounded-xs flex items-center justify-center font-bold text-neutral-800 transition-colors"
              title="Close (Exit)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. TOP FORM HEADER METADATA (Dual Row / WINHMS Control Panel) */}
        <div className="bg-[#fbf9f2] border-b border-[#b0aca3] px-3 py-2 space-y-1.5 text-[11px]">
          
          {/* Row 1: Arrival, Departure, RoomTy, Rate, Pax, No. Of Splits */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <div className="flex items-center gap-1">
              <span className="font-bold text-neutral-800 min-w-[45px]">Arrival</span>
              <input
                type="text"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-22 h-5 px-1.5 bg-white border border-[#7f9db9] rounded-none text-center font-mono font-medium text-neutral-900 focus:outline-none focus:bg-[#ffffe0]"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="font-bold text-neutral-800">Departure</span>
              <input
                type="text"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-22 h-5 px-1.5 bg-white border border-[#7f9db9] rounded-none text-center font-mono font-medium text-neutral-900 focus:outline-none focus:bg-[#ffffe0]"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="font-bold text-neutral-800">RoomTy</span>
              <input
                type="text"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-16 h-5 px-1.5 bg-white border border-[#7f9db9] rounded-none text-center font-mono font-bold text-neutral-900 focus:outline-none focus:bg-[#ffffe0]"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="font-bold text-neutral-800">Rate</span>
              <input
                type="text"
                value={ratePlan}
                onChange={(e) => setRatePlan(e.target.value)}
                className="w-28 h-5 px-1.5 bg-white border border-[#7f9db9] rounded-none font-medium text-neutral-900 focus:outline-none focus:bg-[#ffffe0]"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="font-bold text-neutral-800">Tariff</span>
              <div className="flex items-center bg-white border border-[#7f9db9] px-1" title="Room Tariff Rate: Room accommodation charge per night">
                <span className="text-[10px] text-neutral-500 font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={tariffRate}
                  onChange={(e) => setTariffRate(parseFloat(e.target.value) || 0)}
                  className="w-14 h-5 text-right font-mono font-bold text-neutral-900 focus:outline-none focus:bg-[#ffffe0]"
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="font-bold text-neutral-800">Pax</span>
              <input
                type="number"
                value={paxCount}
                onChange={(e) => setPaxCount(parseInt(e.target.value) || 1)}
                className="w-10 h-5 px-1 bg-white border border-[#7f9db9] rounded-none text-center font-mono font-bold text-neutral-900 focus:outline-none focus:bg-[#ffffe0]"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-[#eae5d8] px-2 py-0.5 border border-[#bfbaa8]">
              <span className="font-bold text-neutral-800">Split Folio:</span>
              <button
                type="button"
                id="btn-toggle-split-folio"
                onClick={() => {
                  const nextState = !isSplitEnabled;
                  setIsSplitEnabled(nextState);
                  if (!nextState) {
                    setNumSplits(1);
                  } else {
                    setNumSplits(2);
                  }
                }}
                className={`px-2 py-0.5 text-[10px] font-bold border transition-colors cursor-pointer ${
                  isSplitEnabled 
                    ? 'bg-blue-600 text-white border-blue-700 shadow-2xs' 
                    : 'bg-white text-neutral-700 border-neutral-400 hover:bg-neutral-100'
                }`}
                title="Toggle between Split Folio and Single Folio"
              >
                {isSplitEnabled ? 'Split ON (2)' : 'Split OFF (1)'}
              </button>
            </div>

            <div className="flex items-center gap-1">
              <span className="font-bold text-neutral-800">No. Of Splits</span>
              <input
                type="number"
                min={1}
                max={4}
                value={numSplits}
                disabled={!isSplitEnabled}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  setNumSplits(val);
                  setIsSplitEnabled(val > 1);
                }}
                className={`w-10 h-5 px-1 bg-white border border-[#7f9db9] rounded-none text-center font-mono font-bold text-neutral-900 focus:outline-none focus:bg-[#ffffe0] ${
                  !isSplitEnabled ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          {/* Row 2: Company, Group, Billing, Currency, Folio Total, Net button */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <div className="flex items-center gap-1">
              <span className="font-bold text-neutral-800 min-w-[55px]">Company</span>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-56 h-5 px-1.5 bg-white border border-[#7f9db9] rounded-none font-medium text-neutral-900 focus:outline-none focus:bg-[#ffffe0]"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="font-bold text-neutral-800">Group</span>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-20 h-5 px-1.5 bg-white border border-[#7f9db9] rounded-none font-medium text-neutral-900 focus:outline-none focus:bg-[#ffffe0]"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="font-bold text-neutral-800">Billing</span>
              <input
                type="text"
                value={billingInfo}
                onChange={(e) => setBillingInfo(e.target.value)}
                className="w-24 h-5 px-1.5 bg-white border border-[#7f9db9] rounded-none font-medium text-neutral-900 focus:outline-none focus:bg-[#ffffe0]"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="font-bold text-neutral-800">Currency</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-5 px-1 bg-white border border-[#7f9db9] rounded-none text-[11px] font-bold text-neutral-900 focus:outline-none"
              >
                <option value="USD">USD</option>
                <option value="KHR">KHR</option>
                <option value="EUR">EUR</option>
                <option value="THB">THB</option>
              </select>
            </div>

            <div className="flex items-center gap-1 ml-auto">
              <span className="font-bold text-neutral-800">Folio Total</span>
              <input
                type="text"
                readOnly
                value={grandTotal.toFixed(2)}
                className="w-20 h-5 px-1.5 bg-white border border-[#7f9db9] rounded-none text-right font-mono font-bold text-neutral-900"
              />
              <button
                type="button"
                onClick={() => setIsNetMode(!isNetMode)}
                className={`px-2 h-5 border border-[#7f9db9] rounded-none font-bold text-[10.5px] transition-colors ${
                  isNetMode ? 'bg-[#e2e8f0] text-neutral-900' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {isNetMode ? 'Net' : 'Gross'}
              </button>
            </div>
          </div>

        </div>

        {/* 3. SPLIT / CONSOLIDATED FOLIO CONTENT BODY */}
        <div className="flex-1 bg-[#fffdf6] p-3 overflow-y-auto min-h-[380px] flex flex-col gap-2">
          
          {/* Quick Selection Toolbar for Splitting */}
          <div className="bg-[#f0ece1] border border-[#bfbaa8] px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-800 flex items-center gap-1">
                <Split className="w-3.5 h-3.5 text-blue-700" />
                Folio Mode:
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSplitEnabled(true);
                  if (numSplits < 2) setNumSplits(2);
                }}
                className={`px-2 py-0.5 font-bold border transition-colors cursor-pointer ${
                  isSplitEnabled && numSplits > 1
                    ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                    : 'bg-white text-neutral-700 border-neutral-400 hover:bg-neutral-100'
                }`}
              >
                Split Folios (Split 1 & 2)
              </button>
              <button
                type="button"
                onClick={handleMergeAllToSingle}
                className={`px-2 py-0.5 font-bold border transition-colors cursor-pointer ${
                  !isSplitEnabled || numSplits === 1
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                    : 'bg-white text-neutral-700 border-neutral-400 hover:bg-neutral-100'
                }`}
              >
                Single Folio (Consolidated / No Split)
              </button>
            </div>

            {/* Print by Split Quick Actions in Toolbar */}
            <div className="flex items-center gap-1">
              <span className="text-neutral-700 font-bold flex items-center gap-1 text-[10.5px]">
                <Printer className="w-3 h-3 text-neutral-600" />
                Print Preview:
              </span>
              {isSplitEnabled && numSplits > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenPrintPreview('split1')}
                    className="px-1.5 py-0.5 bg-white hover:bg-amber-50 border border-[#7f9db9] rounded-xs text-[10px] font-bold text-neutral-800 cursor-pointer flex items-center gap-0.5 shadow-2xs"
                    title="Print Preview Split 1 (Guest Folio)"
                  >
                    <Eye className="w-2.5 h-2.5 text-blue-600" />
                    <span>Split 1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPrintPreview('split2')}
                    className="px-1.5 py-0.5 bg-white hover:bg-amber-50 border border-[#7f9db9] rounded-xs text-[10px] font-bold text-neutral-800 cursor-pointer flex items-center gap-0.5 shadow-2xs"
                    title="Print Preview Split 2 (Company / Incidental)"
                  >
                    <Eye className="w-2.5 h-2.5 text-emerald-600" />
                    <span>Split 2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPrintPreview('both')}
                    className="px-2 py-0.5 bg-[#fff3cd] hover:bg-[#ffe69c] border border-[#d39e00] rounded-xs text-[10px] font-bold text-[#856404] cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Print Preview Combined / Multi-Split Folio"
                  >
                    <Printer className="w-2.5 h-2.5 text-amber-700" />
                    <span>Both Splits</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenPrintPreview('single')}
                  className="px-2 py-0.5 bg-[#fff3cd] hover:bg-[#ffe69c] border border-[#d39e00] rounded-xs text-[10px] font-bold text-[#856404] cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Print Preview Consolidated Folio"
                >
                  <Printer className="w-2.5 h-2.5 text-amber-700" />
                  <span>Consolidated Bill</span>
                </button>
              )}
              {charges.length > 0 && (
                <button
                  type="button"
                  id="btn-winhms-reset-folio"
                  onClick={handleClearAllTransactions}
                  className="px-2 py-0.5 bg-neutral-100 hover:bg-red-50 border border-neutral-300 hover:border-red-300 rounded-xs text-[10px] font-semibold text-neutral-700 hover:text-red-700 cursor-pointer flex items-center gap-1 shadow-2xs transition-colors"
                  title="Reset Folio to empty (clears all current transactions)"
                >
                  <Trash2 className="w-2.5 h-2.5 text-neutral-500 hover:text-red-600" />
                  <span>Reset Folio</span>
                </button>
              )}
            </div>

            {selectedChargeIds.length > 0 && (
              <div className="flex items-center gap-1.5 animate-in fade-in flex-wrap">
                <span className="font-bold text-blue-900 bg-blue-100 px-2 py-0.5 border border-blue-300 rounded-xs text-[10px]">
                  {selectedChargeIds.length} Selected
                </span>
                {isSplitEnabled && numSplits > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleTransferSelected(1)}
                      className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-[#7f9db9] font-bold text-neutral-800 cursor-pointer text-[10px]"
                      title="Assign selected items to Split 1"
                    >
                      ← Move to Split 1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTransferSelected(2)}
                      className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-[#7f9db9] font-bold text-neutral-800 cursor-pointer text-[10px]"
                      title="Assign selected items to Split 2"
                    >
                      Move to Split 2 →
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="px-2 py-0.5 bg-red-50 hover:bg-red-100 border border-red-300 font-bold text-red-700 cursor-pointer text-[10px] flex items-center gap-1 shadow-2xs"
                  title="Delete all selected charges from the folio"
                >
                  <Trash2 className="w-3 h-3 text-red-600" />
                  <span>Delete Selected ({selectedChargeIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChargeIds([])}
                  className="px-1.5 py-0.5 text-neutral-500 hover:text-neutral-800 cursor-pointer text-[10px]"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {isSplitEnabled && numSplits > 1 ? (
            /* DUAL SPLIT GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              
              {/* SPLIT 1 CARD */}
              <div 
                id="winhms-split-1-card"
                className="border border-[#7f9db9] bg-white flex flex-col shadow-2xs"
              >
                
                {/* Split 1 Banner */}
                <div className="bg-[#e4ebd9] border-b border-[#a9c490] px-2.5 py-1 flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectAllInSplit(1)}
                      className="text-neutral-700 hover:text-neutral-900 p-0.5 cursor-pointer"
                      title="Select / Deselect all in Split 1"
                    >
                      {split1Charges.length > 0 && split1Charges.every(c => selectedChargeIds.includes(c.id)) ? (
                        <CheckSquare className="w-3.5 h-3.5 text-blue-700" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-neutral-500" />
                      )}
                    </button>
                    <span className="font-bold text-neutral-800 text-[11px] truncate">
                      Gst &nbsp;&nbsp; {currentGuest}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-blue-700 text-[11px] whitespace-nowrap bg-blue-50 px-1.5 py-0.5 border border-blue-200">
                      Split : 1
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenPostRoomChargeModal(1)}
                      className="text-[9.5px] px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 font-bold text-amber-900 cursor-pointer flex items-center gap-1 shadow-2xs"
                      title={`Post Room Charge from Tariff ($${tariffRate.toFixed(2)}) to Split 1`}
                    >
                      <BedDouble className="w-2.5 h-2.5 text-amber-800" />
                      <span>+ Post Tariff (${tariffRate.toFixed(2)})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAllSplitChargesToTariff(1)}
                      className="text-[9px] px-1 py-0.5 bg-white hover:bg-amber-50 border border-amber-300 font-bold text-amber-900 cursor-pointer"
                      title="Set all room charges in Split 1 to Room Tariff"
                    >
                      Set to Tariff
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenPrintPreview('split1')}
                      className="text-[9.5px] px-1.5 py-0.5 bg-white hover:bg-amber-50 border border-[#7f9db9] font-bold text-neutral-800 cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Print Preview Split 1 (Guest Folio)"
                    >
                      <Printer className="w-2.5 h-2.5 text-blue-700" />
                      <span>Print 1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveAllToSplit(1, 2)}
                      className="text-[9.5px] px-1.5 py-0.5 bg-white hover:bg-neutral-100 border border-neutral-400 font-bold text-neutral-700 cursor-pointer"
                      title="Move all items from Split 1 to Split 2"
                    >
                      Move All → 2
                    </button>
                  </div>
                </div>

                {/* Split 1 Table */}
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#ffff99] border-b border-[#d4d470] font-bold text-neutral-900">
                        <th className="py-1 px-1.5 w-6 text-center">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="py-1 px-2 text-left font-bold text-[10.5px] w-20 whitespace-nowrap">
                          Date
                        </th>
                        <th className="py-1 px-2 text-left font-bold">Total</th>
                        <th className="py-1 px-2.5 text-right font-bold font-mono">
                          ${split1Total.toFixed(2)}
                        </th>
                        <th className="py-1 px-1 w-14 text-center text-[9px] font-normal text-neutral-500">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {split1Charges.map((item, idx) => {
                        const isChecked = selectedChargeIds.includes(item.id);
                        return (
                          <tr 
                            key={item.id}
                            onClick={() => {
                              setSelectedChargeId(item.id);
                              handleToggleSelectRow(item.id);
                            }}
                            className={`border-b border-[#e2e8f0] hover:bg-[#fff9d6] cursor-pointer transition-colors ${
                              isChecked 
                                ? 'bg-[#e0f2fe] font-medium' 
                                : selectedChargeId === item.id 
                                  ? 'bg-[#fffae0] font-medium' 
                                  : (idx % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white')
                            }`}
                          >
                            <td className="py-1 px-1.5 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleToggleSelectRow(item.id);
                                }}
                                className="w-3.5 h-3.5 cursor-pointer accent-blue-600 rounded-none"
                              />
                            </td>
                            <td className="py-1 px-2 font-mono text-[10.5px] text-neutral-700 whitespace-nowrap font-medium">
                              {formatFolioDate(item.date)}
                            </td>
                            <td className="py-1 px-2 text-neutral-800 font-sans">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {isPaymentItem(item) ? (
                                  <>
                                    <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-bold rounded-xs shrink-0">
                                      <CreditCard className="w-2.5 h-2.5" />
                                      Payment
                                    </span>
                                    <select
                                      value={getFolioParticulars(item)}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => handleChangeItemPaymentMethod(item.id, e.target.value as PaymentMethod)}
                                      className="h-5 px-1 text-[10px] font-bold bg-white border border-[#7f9db9] rounded-xs text-neutral-900 cursor-pointer hover:border-blue-600 focus:border-blue-600 outline-hidden font-sans"
                                      title="Select Payment Method: Cash, Master Card, Visa Card"
                                    >
                                      <option value="Cash">Cash</option>
                                      <option value="Master Card">Master Card</option>
                                      <option value="Visa Card">Visa Card</option>
                                      <option value="ABA QR Pay">ABA QR Pay</option>
                                      <option value="Bank Transfer">Bank Transfer</option>
                                    </select>
                                  </>
                                ) : isAccommodationItem(item) ? (
                                  <>
                                    <span className="font-semibold text-neutral-900">{cleanFolioDescription(item.description)}</span>
                                    <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold rounded-xs shrink-0" title="Tariff Rate">
                                      Tariff: ${item.amount.toFixed(2)}
                                    </span>
                                    {item.postedBy === 'Night Audit (Auto)' ? (
                                      <span className="inline-flex items-center px-1 py-0.2 bg-blue-100 text-blue-800 border border-blue-200 text-[8.5px] font-semibold rounded-xs shrink-0">
                                        Auto: Night Audit
                                      </span>
                                    ) : item.postedBy === 'User' ? (
                                      <span className="inline-flex items-center px-1 py-0.2 bg-purple-100 text-purple-800 border border-purple-200 text-[8.5px] font-semibold rounded-xs shrink-0">
                                        User Posted
                                      </span>
                                    ) : null}
                                    {item.amount !== tariffRate && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSetChargeToTariff(item.id);
                                        }}
                                        className="text-[8.5px] px-1 py-0.2 bg-amber-50 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded font-bold cursor-pointer transition-colors shrink-0"
                                        title={`Set room charge to match Room Tariff ($${tariffRate.toFixed(2)})`}
                                      >
                                        Set from Tariff (${tariffRate.toFixed(2)})
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <span>{cleanFolioDescription(item.description)}</span>
                                )}
                              </div>
                            </td>
                            <td className={`py-1 px-2.5 text-right font-mono font-medium ${
                              item.amount < 0 ? (item.isPayment ? 'text-emerald-700 font-bold' : 'text-red-700') : 'text-neutral-900'
                            }`}>
                              {item.amount < 0 ? `-$${Math.abs(item.amount).toFixed(2)}` : `$${item.amount.toFixed(2)}`}
                            </td>
                            <td className="py-0.5 px-1 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTransferCharge(item.id);
                                  }}
                                  className="px-1 py-0.5 bg-[#dbeafe] hover:bg-blue-200 border border-blue-300 rounded text-[9.5px] font-bold text-blue-800 cursor-pointer"
                                  title="Transfer to Split 2"
                                >
                                  → 2
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCharge(item.id);
                                  }}
                                  className="p-1 hover:bg-red-50 hover:text-red-600 text-neutral-400 hover:border-red-200 border border-transparent rounded cursor-pointer transition-colors"
                                  title="Delete Charge"
                                >
                                  <Trash2 className="w-3 h-3 text-red-500 hover:text-red-700" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {split1Charges.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center bg-[#fafaf8]">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <Receipt className="w-5 h-5 text-neutral-400 stroke-1" />
                              <span className="text-[11px] font-semibold text-neutral-600">Split 1 is currently empty</span>
                              <span className="text-[10px] text-neutral-400">Transactions will post here during Night Audit or by clicking "+ Add Charge / Payment" below</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* SPLIT 2 CARD */}
              <div 
                id="winhms-split-2-card"
                className="border border-[#7f9db9] bg-white flex flex-col shadow-2xs"
              >
                
                {/* Split 2 Banner */}
                <div className="bg-[#e4ebd9] border-b border-[#a9c490] px-2.5 py-1 flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectAllInSplit(2)}
                      className="text-neutral-700 hover:text-neutral-900 p-0.5 cursor-pointer"
                      title="Select / Deselect all in Split 2"
                    >
                      {split2Charges.length > 0 && split2Charges.every(c => selectedChargeIds.includes(c.id)) ? (
                        <CheckSquare className="w-3.5 h-3.5 text-blue-700" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-neutral-500" />
                      )}
                    </button>
                    <span className="font-bold text-neutral-800 text-[11px] truncate">
                      Gst &nbsp;&nbsp; {currentGuest}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-blue-700 text-[11px] whitespace-nowrap bg-blue-50 px-1.5 py-0.5 border border-blue-200">
                      Split : 2
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenPostRoomChargeModal(2)}
                      className="text-[9.5px] px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 font-bold text-amber-900 cursor-pointer flex items-center gap-1 shadow-2xs"
                      title={`Post Room Charge from Tariff ($${tariffRate.toFixed(2)}) to Split 2`}
                    >
                      <BedDouble className="w-2.5 h-2.5 text-amber-800" />
                      <span>+ Post Tariff (${tariffRate.toFixed(2)})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAllSplitChargesToTariff(2)}
                      className="text-[9px] px-1 py-0.5 bg-white hover:bg-amber-50 border border-amber-300 font-bold text-amber-900 cursor-pointer"
                      title="Set all room charges in Split 2 to Room Tariff"
                    >
                      Set to Tariff
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenPrintPreview('split2')}
                      className="text-[9.5px] px-1.5 py-0.5 bg-white hover:bg-amber-50 border border-[#7f9db9] font-bold text-neutral-800 cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Print Preview Split 2 (Company / Incidental Folio)"
                    >
                      <Printer className="w-2.5 h-2.5 text-emerald-700" />
                      <span>Print 2</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveAllToSplit(2, 1)}
                      className="text-[9.5px] px-1.5 py-0.5 bg-white hover:bg-neutral-100 border border-neutral-400 font-bold text-neutral-700 cursor-pointer"
                      title="Move all items from Split 2 to Split 1"
                    >
                      Move All ← 1
                    </button>
                  </div>
                </div>

                {/* Split 2 Table */}
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#ffff99] border-b border-[#d4d470] font-bold text-neutral-900">
                        <th className="py-1 px-1.5 w-6 text-center">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="py-1 px-2 text-left font-bold text-[10.5px] w-20 whitespace-nowrap">
                          Date
                        </th>
                        <th className="py-1 px-2 text-left font-bold">Total</th>
                        <th className="py-1 px-2.5 text-right font-bold font-mono">
                          ${split2Total.toFixed(2)}
                        </th>
                        <th className="py-1 px-1 w-14 text-center text-[9px] font-normal text-neutral-500">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {split2Charges.map((item, idx) => {
                        const isChecked = selectedChargeIds.includes(item.id);
                        return (
                          <tr 
                            key={item.id}
                            onClick={() => {
                              setSelectedChargeId(item.id);
                              handleToggleSelectRow(item.id);
                            }}
                            className={`border-b border-[#e2e8f0] hover:bg-[#fff9d6] cursor-pointer transition-colors ${
                              isChecked 
                                ? 'bg-[#e0f2fe] font-medium' 
                                : selectedChargeId === item.id 
                                  ? 'bg-[#fffae0] font-medium' 
                                  : (idx % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white')
                            }`}
                          >
                            <td className="py-1 px-1.5 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleToggleSelectRow(item.id);
                                }}
                                className="w-3.5 h-3.5 cursor-pointer accent-blue-600 rounded-none"
                              />
                            </td>
                            <td className="py-1 px-2 font-mono text-[10.5px] text-neutral-700 whitespace-nowrap font-medium">
                              {formatFolioDate(item.date)}
                            </td>
                            <td className="py-1 px-2 text-neutral-800 font-sans">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {isPaymentItem(item) ? (
                                  <>
                                    <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-bold rounded-xs shrink-0">
                                      <CreditCard className="w-2.5 h-2.5" />
                                      Payment
                                    </span>
                                    <select
                                      value={getFolioParticulars(item)}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => handleChangeItemPaymentMethod(item.id, e.target.value as PaymentMethod)}
                                      className="h-5 px-1 text-[10px] font-bold bg-white border border-[#7f9db9] rounded-xs text-neutral-900 cursor-pointer hover:border-blue-600 focus:border-blue-600 outline-hidden font-sans"
                                      title="Select Payment Method: Cash, Master Card, Visa Card"
                                    >
                                      <option value="Cash">Cash</option>
                                      <option value="Master Card">Master Card</option>
                                      <option value="Visa Card">Visa Card</option>
                                      <option value="ABA QR Pay">ABA QR Pay</option>
                                      <option value="Bank Transfer">Bank Transfer</option>
                                    </select>
                                  </>
                                ) : isAccommodationItem(item) ? (
                                  <>
                                    <span className="font-semibold text-neutral-900">{cleanFolioDescription(item.description)}</span>
                                    <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold rounded-xs shrink-0" title="Tariff Rate">
                                      Tariff: ${item.amount.toFixed(2)}
                                    </span>
                                    {item.postedBy === 'Night Audit (Auto)' ? (
                                      <span className="inline-flex items-center px-1 py-0.2 bg-blue-100 text-blue-800 border border-blue-200 text-[8.5px] font-semibold rounded-xs shrink-0">
                                        Auto: Night Audit
                                      </span>
                                    ) : item.postedBy === 'User' ? (
                                      <span className="inline-flex items-center px-1 py-0.2 bg-purple-100 text-purple-800 border border-purple-200 text-[8.5px] font-semibold rounded-xs shrink-0">
                                        User Posted
                                      </span>
                                    ) : null}
                                    {item.amount !== tariffRate && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSetChargeToTariff(item.id);
                                        }}
                                        className="text-[8.5px] px-1 py-0.2 bg-amber-50 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded font-bold cursor-pointer transition-colors shrink-0"
                                        title={`Set room charge to match Room Tariff ($${tariffRate.toFixed(2)})`}
                                      >
                                        Set from Tariff (${tariffRate.toFixed(2)})
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <span>{cleanFolioDescription(item.description)}</span>
                                )}
                              </div>
                            </td>
                            <td className={`py-1 px-2.5 text-right font-mono font-medium ${
                              item.amount < 0 ? (item.isPayment ? 'text-emerald-700 font-bold' : 'text-red-700') : 'text-neutral-900'
                            }`}>
                              {item.amount < 0 ? `-$${Math.abs(item.amount).toFixed(2)}` : `$${item.amount.toFixed(2)}`}
                            </td>
                            <td className="py-0.5 px-1 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTransferCharge(item.id);
                                  }}
                                  className="px-1 py-0.5 bg-[#dbeafe] hover:bg-blue-200 border border-blue-300 rounded text-[9.5px] font-bold text-blue-800 cursor-pointer"
                                  title="Transfer to Split 1"
                                >
                                  ← 1
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCharge(item.id);
                                  }}
                                  className="p-1 hover:bg-red-50 hover:text-red-600 text-neutral-400 hover:border-red-200 border border-transparent rounded cursor-pointer transition-colors"
                                  title="Delete Charge"
                                >
                                  <Trash2 className="w-3 h-3 text-red-500 hover:text-red-700" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {split2Charges.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center bg-[#fafaf8]">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <Receipt className="w-5 h-5 text-neutral-400 stroke-1" />
                              <span className="text-[11px] font-semibold text-neutral-600">Split 2 is currently empty</span>
                              <span className="text-[10px] text-neutral-400">Transfer items from Split 1 or click "+ Add Charge / Payment" to post to Split 2</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          ) : (
            /* SINGLE CONSOLIDATED FOLIO VIEW */
            <div className="border border-[#7f9db9] bg-white flex flex-col shadow-2xs flex-1">
              {/* Single Folio Banner */}
              <div className="bg-[#e4ebd9] border-b border-[#a9c490] px-3 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-neutral-900 text-xs">
                    Guest: <strong className="text-blue-900">{currentGuest}</strong>
                  </span>
                  <span className="text-[11px] text-neutral-600">
                    Room: <strong>{currentRoomNum}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 border border-emerald-300">
                    Single Folio (Consolidated / No Split)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenPostRoomChargeModal(1)}
                    className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-[10px] font-bold text-amber-900 cursor-pointer flex items-center gap-1 shadow-2xs"
                    title={`Post Room Charge from Tariff ($${tariffRate.toFixed(2)})`}
                  >
                    <BedDouble className="w-2.5 h-2.5 text-amber-800" />
                    <span>+ Post Tariff (${tariffRate.toFixed(2)})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPrintPreview('single')}
                    className="px-2 py-0.5 bg-[#fff3cd] text-[#856404] hover:bg-[#ffe69c] border border-[#d39e00] text-[10px] font-bold cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Print Preview Consolidated Folio"
                  >
                    <Printer className="w-2.5 h-2.5 text-amber-800" />
                    <span>Print Folio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSplitEnabled(true);
                      setNumSplits(2);
                    }}
                    className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 text-[10px] font-bold cursor-pointer"
                  >
                    Enable Split Folio (2)
                  </button>
                </div>
              </div>

              {/* Single Folio Table */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#ffff99] border-b border-[#d4d470] font-bold text-neutral-900">
                      <th className="py-1.5 px-2.5 text-left font-bold text-[11px] w-24 whitespace-nowrap">
                        Date
                      </th>
                      <th className="py-1.5 px-3 text-left font-bold">Total (All Posted Charges)</th>
                      <th className="py-1.5 px-3 text-right font-bold font-mono">
                        ${grandTotal.toFixed(2)}
                      </th>
                      <th className="py-1.5 px-2 w-20 text-center text-[10px] font-normal text-neutral-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {charges.map((item, idx) => (
                      <tr 
                        key={item.id}
                        onClick={() => setSelectedChargeId(item.id)}
                        className={`border-b border-[#e2e8f0] hover:bg-[#fff9d6] cursor-pointer transition-colors ${
                          selectedChargeId === item.id ? 'bg-[#fffae0] font-semibold' : (idx % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white')
                        }`}
                      >
                        <td className="py-1.5 px-2.5 font-mono text-[11px] text-neutral-700 whitespace-nowrap font-medium">
                          {formatFolioDate(item.date)}
                        </td>
                        <td className="py-1.5 px-3 text-neutral-800 font-sans">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isPaymentItem(item) ? (
                              <>
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold rounded-xs shrink-0">
                                  <CreditCard className="w-3 h-3" />
                                  Payment
                                </span>
                                <select
                                  value={getFolioParticulars(item)}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleChangeItemPaymentMethod(item.id, e.target.value as PaymentMethod)}
                                  className="h-6 px-1.5 text-xs font-bold bg-white border border-[#7f9db9] rounded-xs text-neutral-900 cursor-pointer hover:border-blue-600 focus:border-blue-600 outline-hidden font-sans"
                                  title="Select Payment Method: Cash, Master Card, Visa Card"
                                >
                                  <option value="Cash">Cash</option>
                                  <option value="Master Card">Master Card</option>
                                  <option value="Visa Card">Visa Card</option>
                                  <option value="ABA QR Pay">ABA QR Pay</option>
                                  <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                              </>
                            ) : isAccommodationItem(item) ? (
                              <>
                                <span className="font-semibold text-neutral-900">{cleanFolioDescription(item.description)}</span>
                                <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold rounded-xs shrink-0" title="Tariff Rate">
                                  Tariff: ${item.amount.toFixed(2)}
                                </span>
                                {item.postedBy === 'Night Audit (Auto)' ? (
                                  <span className="inline-flex items-center px-1 py-0.2 bg-blue-100 text-blue-800 border border-blue-200 text-[8.5px] font-semibold rounded-xs shrink-0">
                                    Auto: Night Audit
                                  </span>
                                ) : item.postedBy === 'User' ? (
                                  <span className="inline-flex items-center px-1 py-0.2 bg-purple-100 text-purple-800 border border-purple-200 text-[8.5px] font-semibold rounded-xs shrink-0">
                                    User Posted
                                  </span>
                                ) : null}
                                {item.amount !== tariffRate && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSetChargeToTariff(item.id);
                                    }}
                                    className="text-[8.5px] px-1 py-0.2 bg-amber-50 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded font-bold cursor-pointer transition-colors shrink-0"
                                    title={`Set room charge to match Room Tariff ($${tariffRate.toFixed(2)})`}
                                  >
                                    Set from Tariff (${tariffRate.toFixed(2)})
                                  </button>
                                )}
                              </>
                            ) : (
                              <span>{cleanFolioDescription(item.description)}</span>
                            )}
                          </div>
                        </td>
                        <td className={`py-1.5 px-3 text-right font-mono font-medium ${
                          item.amount < 0 ? (item.isPayment ? 'text-emerald-700 font-bold' : 'text-red-700') : 'text-neutral-900'
                        }`}>
                          {item.amount < 0 ? `-$${Math.abs(item.amount).toFixed(2)}` : `$${item.amount.toFixed(2)}`}
                        </td>
                        <td className="py-1 px-2 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCharge(item.id);
                            }}
                            className="p-1 hover:bg-red-50 hover:text-red-600 text-neutral-400 hover:border-red-200 border border-transparent rounded cursor-pointer transition-colors"
                            title="Delete Charge"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500 hover:text-red-700" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {charges.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-10 text-center bg-[#fafaf8]">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <Receipt className="w-6 h-6 text-neutral-400 stroke-1" />
                            <span className="text-[12px] font-semibold text-neutral-700">No transactions recorded on this folio</span>
                            <span className="text-[10.5px] text-neutral-400">Transactions appear automatically when Night Audit runs, or click "Post Room Charge" / "+ Add Charge / Payment" below</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* 4. BOTTOM ACTION & STATUS BAR */}
        <div className="bg-[#f0ece1] border-t border-[#a09e99] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
          
          {/* Status Label on Left (Synced with logged-in user / operator) */}
          <div className="text-[10px] text-neutral-700 font-mono">
            <span id="winhms-checkin-user">
              CheckIn By: <strong className="text-neutral-900 font-bold uppercase">{currentUser?.username || settings.managerName || 'PHANIT'}</strong>
            </span>
            <span className="ml-3">
              Dt: <strong className="text-neutral-900 font-bold">{arrivalDate ? `${arrivalDate} 22:39` : '07/09/20 22:39'}</strong>
            </span>
          </div>

          {/* Action Buttons in Center / Right */}
          <div className="flex items-center gap-2">
            {/* SAVE BUTTON */}
            <button
              type="button"
              id="btn-save-bill-details"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3.5 h-6 bg-[#003366] hover:bg-[#002244] text-white border border-[#001f3f] rounded-none font-bold text-[11px] shadow-2xs active:scale-95 transition-all cursor-pointer"
              title="Save Bill Splits and Folio Details"
            >
              <Save className="w-3.5 h-3.5 text-amber-300" />
              <span>Save</span>
            </button>

            {/* PRINT / PREVIEW BUTTON */}
            <button
              type="button"
              id="btn-print-bill-preview"
              onClick={() => handleOpenPrintPreview(isSplitEnabled && numSplits > 1 ? 'both' : 'single')}
              className="flex items-center gap-1.5 px-3.5 h-6 bg-[#fff3cd] hover:bg-[#ffe69c] text-[#856404] border border-[#d39e00] rounded-none font-bold text-[11px] shadow-2xs active:scale-95 transition-all cursor-pointer"
              title="Open Print Preview (Select Split or All)"
            >
              <Printer className="w-3.5 h-3.5 text-amber-700" />
              <span>Print Preview</span>
            </button>

            {/* POST ROOM CHARGE (FROM TARIFF) BUTTON */}
            <button
              type="button"
              id="btn-winhms-post-tariff"
              onClick={() => handleOpenPostRoomChargeModal(1)}
              className="flex items-center gap-1.5 px-3 h-6 bg-[#fef3c7] hover:bg-[#fde68a] border border-[#d97706] rounded-none font-bold text-[#92400e] text-[11px] shadow-2xs active:scale-95 transition-all cursor-pointer"
              title={`Post Room Charge from Room Tariff ($${tariffRate.toFixed(2)})`}
            >
              <BedDouble className="w-3 h-3 text-[#b45309]" />
              <span>Post Room Charge (Tariff: ${tariffRate.toFixed(2)})</span>
            </button>

            <button
              type="button"
              id="btn-winhms-add-charge-payment"
              onClick={() => setShowPostingChoiceModal(true)}
              className="flex items-center gap-1.5 px-3 h-6 bg-[#e2f0d9] hover:bg-[#d4e6ca] border border-[#a9c490] rounded-none font-bold text-[#2e4d1b] text-[11px] shadow-2xs active:scale-95 transition-all cursor-pointer"
              title="Post Folio Transaction: Other Charge or Payment"
            >
              <Plus className="w-3 h-3 text-[#2e4d1b]" />
              <span>+ Add Charge / Payment</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLedgerView(true)}
              className="px-4 h-6 bg-white hover:bg-[#eae6db] border border-[#7f9db9] rounded-none font-bold text-neutral-800 text-[11px] shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              Ledger
            </button>

            <button
              type="button"
              onClick={() => setShowRoutingView(true)}
              className="px-4 h-6 bg-white hover:bg-[#eae6db] border border-[#7f9db9] rounded-none font-bold text-neutral-800 text-[11px] shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              Routing
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 h-6 bg-white hover:bg-[#eae6db] border border-[#7f9db9] rounded-none font-bold text-neutral-900 text-[11px] shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              Exit
            </button>
          </div>

        </div>

      </div>

      {/* SUB-MODAL: Add New Charge (Classic Simple) */}
      {showAddChargeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#f4ede2] border-2 border-[#5c7080] rounded shadow-2xl p-4 w-full max-w-sm font-sans text-xs">
            <div className="font-bold text-sm text-neutral-900 pb-2 border-b border-[#a09e99] mb-3 flex items-center justify-between">
              <span>Post New Guest Charge</span>
              <button onClick={() => setShowAddChargeModal(false)} className="text-neutral-600 hover:text-black font-bold">×</button>
            </div>

            <form onSubmit={handleAddChargeSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-800 mb-0.5">Date / Code (e.g. 15Sep)</label>
                <input
                  type="text"
                  value={newChargeDate}
                  onChange={(e) => setNewChargeDate(e.target.value)}
                  required
                  className="w-full h-6 px-2 bg-white border border-[#7f9db9] rounded-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-800 mb-0.5">Description (e.g. Food - Rokkhak)</label>
                <input
                  type="text"
                  value={newChargeDesc}
                  onChange={(e) => setNewChargeDesc(e.target.value)}
                  required
                  className="w-full h-6 px-2 bg-white border border-[#7f9db9] rounded-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-800 mb-0.5">Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newChargeAmount}
                    onChange={(e) => setNewChargeAmount(e.target.value)}
                    required
                    className="w-full h-6 px-2 bg-white border border-[#7f9db9] rounded-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-800 mb-0.5">Target Split</label>
                  <select
                    value={newChargeSplit}
                    onChange={(e) => setNewChargeSplit(parseInt(e.target.value) || 1)}
                    className="w-full h-6 px-1 bg-white border border-[#7f9db9] rounded-none font-bold"
                  >
                    <option value={1}>Split 1</option>
                    <option value={2}>Split 2</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#a09e99]">
                <button
                  type="button"
                  onClick={() => setShowAddChargeModal(false)}
                  className="px-3 h-6 bg-white border border-[#7f9db9] font-bold text-neutral-800 rounded-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 h-6 bg-[#d1e7dd] hover:bg-[#badbcc] border border-[#a3cfbb] font-bold text-[#0f5132] rounded-none"
                >
                  Post Charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Post Room Charge from Tariff (Posted by User) */}
      {showPostRoomChargeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4">
          <div className="bg-[#f4ede2] border-2 border-[#5c7080] rounded shadow-2xl p-4 w-full max-w-md font-sans text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="font-bold text-sm text-neutral-900 pb-2 border-b border-[#a09e99] mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-amber-700" />
                <span>Post Room Charge from Tariff (Room {currentRoomNum})</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowPostRoomChargeModal(false)} 
                className="text-neutral-600 hover:text-black font-bold p-1 leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePostRoomChargeSubmit} className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-[11px] text-amber-900 space-y-1">
                <div className="flex justify-between items-center">
                  <span>Guest: <strong className="text-neutral-900">{currentGuest}</strong></span>
                  <span>Room: <strong className="text-blue-900">{currentRoomNum}</strong></span>
                </div>
                <div className="flex justify-between items-center text-[10.5px]">
                  <span>Room Tariff Rate: <strong className="text-emerald-800">${tariffRate.toFixed(2)} USD</strong></span>
                  <span className="text-purple-800 font-semibold bg-purple-50 px-1.5 py-0.5 border border-purple-200 rounded-xs">
                    Posted By: User ({currentUser?.username || settings.managerName || 'PHANIT'})
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-800 mb-0.5">Posting Date</label>
                <input
                  type="text"
                  value={roomChargePostDate}
                  onChange={(e) => setRoomChargePostDate(e.target.value)}
                  placeholder="e.g. 29-Aug-26"
                  required
                  className="w-full h-7 px-2 bg-white border border-[#7f9db9] rounded-none font-mono text-xs font-semibold"
                />
                <span className="text-[10px] text-neutral-500">Business Date or Folio Posting Date</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-800 mb-0.5">Description / Particulars</label>
                <input
                  type="text"
                  value={roomChargePostDesc}
                  onChange={(e) => setRoomChargePostDesc(e.target.value)}
                  required
                  className="w-full h-7 px-2 bg-white border border-[#7f9db9] rounded-none text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-800 mb-0.5">Tariff Charge Rate ($ USD)</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1.5 text-neutral-500 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={roomChargePostTariff}
                      onChange={(e) => setRoomChargePostTariff(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full h-7 pl-5 pr-2 bg-white border border-[#7f9db9] rounded-none font-mono text-xs font-bold text-amber-900"
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setRoomChargePostTariff(tariffRate)}
                      className="text-[9.5px] px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold cursor-pointer"
                    >
                      Reset to Tariff (${tariffRate.toFixed(2)})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-800 mb-0.5">Target Split Folio</label>
                  <select
                    value={roomChargePostSplit}
                    onChange={(e) => setRoomChargePostSplit(parseInt(e.target.value) || 1)}
                    className="w-full h-7 px-2 bg-white border border-[#7f9db9] rounded-none font-bold text-xs"
                  >
                    <option value={1}>Split 1 (Guest Folio)</option>
                    <option value={2}>Split 2 (Company / Incidental)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#a09e99]">
                <button
                  type="button"
                  onClick={() => setShowPostRoomChargeModal(false)}
                  className="px-3.5 h-7 bg-white border border-[#7f9db9] font-bold text-neutral-800 rounded-none cursor-pointer hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 h-7 bg-[#d1e7dd] hover:bg-[#badbcc] border border-[#a3cfbb] font-bold text-[#0f5132] rounded-none flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Post Room Charge</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. MODAL: POSTING OPTION CHOOSER (Room Charge, Other Charge OR Payment) */}
      {showPostingChoiceModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4">
          <div className="bg-[#f4ede2] border-2 border-[#5c7080] rounded shadow-2xl w-full max-w-lg font-sans text-xs overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#f0ece1] border-b border-[#a09e99] px-3.5 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#003366]" />
                <span className="font-bold text-[13px] text-neutral-900 tracking-tight">
                  {settings?.hotelName ? `${settings.hotelName} - Choose Folio Posting Type (Room ${currentRoomNum})` : `Choose Folio Posting Type (Room ${currentRoomNum})`}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowPostingChoiceModal(false)}
                className="text-neutral-500 hover:text-black font-bold p-1 leading-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Room & Balances Bar */}
            <div className="bg-[#fbf9f2] border-b border-[#c8c4bc] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div>
                <span className="text-neutral-500">Guest:</span> <strong className="text-neutral-900">{currentGuest}</strong>
              </div>
              <div className="flex items-center gap-3 font-mono text-[10.5px]">
                <span className="text-neutral-600">Split 1 Due: <strong className="text-neutral-900">${split1Total.toFixed(2)}</strong></span>
                <span className="text-neutral-300">|</span>
                <span className="text-neutral-600">Split 2 Due: <strong className="text-neutral-900">${split2Total.toFixed(2)}</strong></span>
                <span className="text-neutral-300">|</span>
                <span className="text-neutral-700">Folio Total: <strong className="text-blue-900 font-bold">${grandTotal.toFixed(2)}</strong></span>
              </div>
            </div>

            {/* Selection Body */}
            <div className="p-4 space-y-3">
              <div className="text-[11.5px] font-bold text-neutral-700 uppercase tracking-wider">
                Please select transaction option:
              </div>

              {/* OPTION 1: ROOM CHARGE (FROM TARIFF) */}
              <button
                type="button"
                id="btn-select-room-charge-tariff"
                onClick={() => {
                  setShowPostingChoiceModal(false);
                  handleOpenPostRoomChargeModal(1);
                }}
                className="w-full text-left p-3.5 bg-white hover:bg-[#fffdf0] border-2 border-[#b0aca3] hover:border-amber-600 rounded transition-all shadow-2xs group cursor-pointer flex items-start gap-3.5"
              >
                <div className="p-2.5 bg-amber-100 group-hover:bg-amber-200 border border-amber-300 rounded text-amber-900 shrink-0 mt-0.5">
                  <BedDouble className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-[13px] text-neutral-900 group-hover:text-amber-900 flex items-center gap-1.5">
                      <span>Room Charge (from Tariff)</span>
                    </span>
                    <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 text-[10px] border border-amber-300 rounded-xs flex items-center gap-1">
                      <span>Tariff: ${tariffRate.toFixed(2)}</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-snug">
                    Post accommodation room charge based on the room's base tariff rate (<strong>${tariffRate.toFixed(2)}/night</strong>). Tagged as <strong>Posted by User</strong> in folio breakdown.
                  </p>
                </div>
              </button>

              {/* OPTION 2: OTHER CHARGE */}
              <button
                type="button"
                id="btn-select-other-charge"
                onClick={() => {
                  setShowPostingChoiceModal(false);
                  setOtherChargeDate(arrivalDate ? formatFolioDate(arrivalDate) : '15-Sep-2026');
                  setShowOtherChargeListModal(true);
                }}
                className="w-full text-left p-3.5 bg-white hover:bg-[#fff9e6] border-2 border-[#b0aca3] hover:border-amber-600 rounded transition-all shadow-2xs group cursor-pointer flex items-start gap-3.5"
              >
                <div className="p-2.5 bg-amber-50 group-hover:bg-amber-100 border border-amber-200 rounded text-amber-800 shrink-0 mt-0.5">
                  <Utensils className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-[13px] text-neutral-900 group-hover:text-amber-900 flex items-center gap-1.5">
                      <span>Other Charge</span>
                    </span>
                    <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 text-[10px] border border-amber-300 rounded-xs flex items-center gap-1">
                      <span>Go to Other Charge List</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-snug">
                    Browse and post charges from the hotel catalog: <strong>Food & Beverage (Rokkhak)</strong>, <strong>Minibar</strong>, <strong>Laundry Natura</strong>, <strong>Spa & Massages</strong>, <strong>Airport Transfers</strong>, <strong>Extra Bed</strong>, or custom items.
                  </p>
                </div>
              </button>

              {/* OPTION 2: PAYMENT */}
              <button
                type="button"
                id="btn-select-payment"
                onClick={() => {
                  setShowPostingChoiceModal(false);
                  const targetSplit = split1Total > 0 ? 1 : (split2Total > 0 ? 2 : 1);
                  const targetBal = targetSplit === 1 ? (split1Total > 0 ? split1Total : grandTotal) : (split2Total > 0 ? split2Total : grandTotal);
                  setPaymentSplit(targetSplit);
                  setPaymentAmount(targetBal > 0 ? targetBal.toFixed(2) : '50.00');
                  setPaymentPayerName(currentGuest);
                  setPaymentReceiptNo('RCP-' + Math.floor(100000 + Math.random() * 900000));
                  setPaymentDate(arrivalDate ? formatFolioDate(arrivalDate) : '15-Sep-2026');
                  setShowPaymentModal(true);
                }}
                className="w-full text-left p-3.5 bg-white hover:bg-[#f0fdf4] border-2 border-[#b0aca3] hover:border-emerald-600 rounded transition-all shadow-2xs group cursor-pointer flex items-start gap-3.5"
              >
                <div className="p-2.5 bg-emerald-50 group-hover:bg-emerald-100 border border-emerald-200 rounded text-emerald-800 shrink-0 mt-0.5">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-[13px] text-neutral-900 group-hover:text-emerald-900 flex items-center gap-1.5">
                      <span>Payment</span>
                    </span>
                    <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 text-[10px] border border-emerald-300 rounded-xs flex items-center gap-1">
                      <span>Link to Payment Method</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-snug">
                    Record guest payment, deposit, or check-out folio settlement linked to <strong>Payment Method</strong>: Credit Card (Visa/Master), Cash (USD/KHR), ABA QR Pay (Bakong), Bank Transfer, or Stripe.
                  </p>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="bg-[#f0ece1] border-t border-[#a09e99] px-4 py-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPostingChoiceModal(false)}
                className="px-4 h-6 bg-white hover:bg-[#eae6db] border border-[#7f9db9] rounded-none font-bold text-neutral-800 text-[11px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL: OTHER CHARGE LIST */}
      {showOtherChargeListModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4">
          <div className="bg-[#f4ede2] border-2 border-[#5c7080] rounded shadow-2xl w-full max-w-3xl font-sans text-xs flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#f0ece1] border-b border-[#a09e99] px-3.5 py-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-700" />
                <span className="font-bold text-[13px] text-neutral-900 tracking-tight">
                  Other Charge List - Room {currentRoomNum} ({currentGuest})
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setShowOtherChargeListModal(false)}
                className="text-neutral-500 hover:text-black font-bold p-1 leading-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-[#fbf9f2] border-b border-[#c8c4bc] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1">
                {(['All', 'Food & Beverage', 'Laundry', 'Spa & Wellness', 'Transportation', 'Room Amenities', 'Miscellaneous'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setOtherChargeCategory(cat)}
                    className={`px-2 py-0.5 text-[10.5px] font-bold border transition-colors cursor-pointer ${
                      otherChargeCategory === cat 
                        ? 'bg-[#003366] text-white border-[#001f3f]' 
                        : 'bg-white text-neutral-700 hover:bg-neutral-100 border-[#b0aca3]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-1.5" />
                <input
                  type="text"
                  placeholder="Search other charges..."
                  value={otherChargeSearch}
                  onChange={(e) => setOtherChargeSearch(e.target.value)}
                  className="w-full h-6 pl-7 pr-2 bg-white border border-[#7f9db9] rounded-none text-xs font-sans placeholder:text-neutral-400 focus:border-[#003366] outline-hidden"
                />
              </div>
            </div>

            {/* Main 2-Column Content: Left = Catalog List, Right = Post Form */}
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-[340px]">
              
              {/* Catalog Table */}
              <div className="md:col-span-7 bg-white border border-[#7f9db9] flex flex-col overflow-hidden">
                <div className="bg-[#ffff99] px-2.5 py-1 font-bold text-neutral-900 border-b border-[#d4d470] text-[11px] flex justify-between items-center">
                  <span>Charge Catalog Items</span>
                  <span className="text-[10px] text-neutral-600 font-normal">Click a row to select</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full border-collapse text-left text-[11px]">
                    <thead>
                      <tr className="bg-[#f0ece1] border-b border-[#d4d470] text-neutral-700">
                        <th className="py-1 px-2 font-bold w-20">Code</th>
                        <th className="py-1 px-2 font-bold">Charge Description</th>
                        <th className="py-1 px-2 font-bold text-right w-18">Rate ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chargeCatalog
                        .filter(item => {
                          const matchCat = otherChargeCategory === 'All' || item.category === otherChargeCategory;
                          const q = otherChargeSearch.trim().toLowerCase();
                          const matchSearch = !q || item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
                          return matchCat && matchSearch;
                        })
                        .map((item) => {
                          const isSelected = otherChargeSelectedCode === item.code;
                          return (
                            <tr
                              key={item.code}
                              onClick={() => handleSelectCatalogItem(item)}
                              className={`border-b border-[#e2e8f0] cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-[#fff5cc] font-semibold border-amber-300' 
                                  : 'hover:bg-amber-50/60 bg-white'
                              }`}
                            >
                              <td className="py-1 px-2 font-mono text-[10px] text-neutral-600">
                                {item.code}
                              </td>
                              <td className="py-1 px-2">
                                <div className="text-neutral-900 font-medium">{item.name}</div>
                                <div className="text-[9.5px] text-neutral-500 line-clamp-1">{item.description}</div>
                              </td>
                              <td className="py-1 px-2 text-right font-mono font-bold text-neutral-800">
                                ${item.defaultPrice.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Posting Form */}
              <form onSubmit={handlePostOtherCharge} className="md:col-span-5 bg-[#fbf9f2] border border-[#7f9db9] p-3 flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="font-bold text-[12px] text-[#003366] pb-1 border-b border-[#c8c4bc] mb-2 flex items-center justify-between">
                    <span>Charge Line Particulars</span>
                    {isEditingChargeCode ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          autoFocus
                          value={otherChargeSelectedCode}
                          onChange={(e) => {
                            setOtherChargeSelectedCode(e.target.value.toUpperCase());
                            setCatalogSaveStatus(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveCatalogItemEdit(true);
                            } else if (e.key === 'Escape') {
                              setIsEditingChargeCode(false);
                            }
                          }}
                          className="h-5 px-1.5 py-0 font-mono text-[10px] uppercase font-bold bg-white border border-[#003366] rounded-xs text-[#003366] outline-none shadow-xs w-24"
                          placeholder="CODE"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCatalogItemEdit(true)}
                          className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#d1e7dd] hover:bg-[#badbcc] border border-[#a3cfbb] text-[#0f5132] text-[10px] font-bold rounded-xs cursor-pointer shadow-2xs"
                          title="Save Code & Changes"
                        >
                          <Check className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {catalogSaveStatus === 'saved' && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-emerald-100 border border-emerald-300 rounded-xs text-emerald-800 text-[9.5px] font-bold animate-in fade-in">
                            <Check className="w-2.5 h-2.5 text-emerald-700" />
                            <span>Saved</span>
                          </span>
                        )}
                        <span 
                          onClick={() => setIsEditingChargeCode(true)}
                          className="group inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 hover:border-amber-400 rounded-xs text-amber-900 cursor-pointer transition-colors shadow-2xs"
                          title="Click to edit charge code"
                        >
                          <span>{otherChargeSelectedCode}</span>
                          <Edit2 className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-amber-800" />
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10.5px] font-bold text-neutral-700 mb-0.5">
                        Description / Particulars:
                      </label>
                      <input
                        type="text"
                        value={otherChargeName}
                        onChange={(e) => {
                          setOtherChargeName(e.target.value);
                          setCatalogSaveStatus(null);
                        }}
                        required
                        className="w-full h-6 px-2 bg-white border border-[#7f9db9] rounded-none text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10.5px] font-bold text-neutral-700 mb-0.5">
                          Unit Price ($):
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={otherChargeUnitPrice}
                          onChange={(e) => {
                            setOtherChargeUnitPrice(parseFloat(e.target.value) || 0);
                            setCatalogSaveStatus(null);
                          }}
                          required
                          className="w-full h-6 px-2 bg-white border border-[#7f9db9] rounded-none font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-neutral-700 mb-0.5">
                          Quantity:
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setOtherChargeQty(Math.max(1, otherChargeQty - 1))}
                            className="w-6 h-6 bg-neutral-200 hover:bg-neutral-300 border border-[#7f9db9] font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={otherChargeQty}
                            onChange={(e) => setOtherChargeQty(Math.max(1, parseInt(e.target.value) || 1))}
                            required
                            className="flex-1 h-6 px-1 text-center bg-white border-y border-[#7f9db9] rounded-none font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setOtherChargeQty(otherChargeQty + 1)}
                            className="w-6 h-6 bg-neutral-200 hover:bg-neutral-300 border border-[#7f9db9] font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#eef2f6] border border-[#cbd5e1] p-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-neutral-700">Total Charge Amount:</span>
                      <span className="font-mono text-base font-bold text-[#003366]">
                        ${(otherChargeUnitPrice * otherChargeQty).toFixed(2)} USD
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10.5px] font-bold text-neutral-700 mb-0.5">
                          Target Folio Split:
                        </label>
                        <select
                          value={otherChargeSplit}
                          onChange={(e) => setOtherChargeSplit(parseInt(e.target.value) || 1)}
                          className="w-full h-6 px-1 bg-white border border-[#7f9db9] rounded-none font-bold text-xs"
                        >
                          <option value={1}>Split 1 (Guest Folio)</option>
                          <option value={2}>Split 2 (Company Folio)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-neutral-700 mb-0.5">
                          Posting Date:
                        </label>
                        <input
                          type="text"
                          value={otherChargeDate}
                          onChange={(e) => setOtherChargeDate(e.target.value)}
                          required
                          className="w-full h-6 px-2 bg-white border border-[#7f9db9] rounded-none font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-neutral-700 mb-0.5">
                        Voucher / Reference / Table (optional):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Table 12, Spa voucher #802"
                        value={otherChargeVoucher}
                        onChange={(e) => setOtherChargeVoucher(e.target.value)}
                        className="w-full h-6 px-2 bg-white border border-[#7f9db9] rounded-none text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-2 border-t border-[#c8c4bc] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtherChargeListModal(false);
                      setShowPostingChoiceModal(true);
                    }}
                    className="flex items-center gap-1 px-2.5 h-6 bg-white hover:bg-[#eae6db] border border-[#7f9db9] text-neutral-700 text-[10.5px] font-bold cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Options</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowOtherChargeListModal(false)}
                      className="px-2.5 h-6 bg-white hover:bg-[#eae6db] border border-[#7f9db9] font-bold text-neutral-800 text-[10.5px] cursor-pointer"
                    >
                      Cancel
                    </button>

                    {/* Save after Edit Button */}
                    <button
                      type="button"
                      id="btn-save-charge-edit"
                      onClick={() => handleSaveCatalogItemEdit(true)}
                      className={`flex items-center gap-1 px-2.5 h-6 border font-bold text-[10.5px] cursor-pointer shadow-2xs transition-all ${
                        catalogSaveStatus === 'saved'
                          ? 'bg-[#d1e7dd] hover:bg-[#badbcc] text-[#0f5132] border-[#a3cfbb]'
                          : 'bg-[#fff2b2] hover:bg-[#ffe680] text-[#73510d] border-[#d4b106]'
                      }`}
                      title="Save edited code, particulars, and unit price to the catalog list"
                    >
                      {catalogSaveStatus === 'saved' ? (
                        <>
                          <Check className="w-3 h-3 text-[#0f5132]" />
                          <span>Saved ✓</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 text-[#73510d]" />
                          <span>Save Edit</span>
                        </>
                      )}
                    </button>

                    <button
                      type="submit"
                      id="btn-post-charge-submit"
                      className="flex items-center gap-1 px-3 h-6 bg-[#d1e7dd] hover:bg-[#badbcc] border border-[#a3cfbb] font-bold text-[#0f5132] text-[10.5px] cursor-pointer shadow-2xs"
                      title="Post charge to guest folio"
                    >
                      <Check className="w-3 h-3 text-[#0f5132]" />
                      <span>Post Charge</span>
                    </button>
                  </div>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL: LINK TO PAYMENT METHOD */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-[1px] p-4">
          <div className="bg-[#f4ede2] border-2 border-[#5c7080] rounded shadow-2xl w-full max-w-2xl font-sans text-xs flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#f0ece1] border-b border-[#a09e99] px-3.5 py-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-[13px] text-neutral-900 tracking-tight">
                  Post Folio Payment - Link to Payment Method (Room {currentRoomNum})
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-neutral-500 hover:text-black font-bold p-1 leading-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Balances Status Banner */}
            <div className="bg-[#fbf9f2] border-b border-[#c8c4bc] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">Guest:</span>
                <strong className="text-neutral-900">{currentGuest}</strong>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-neutral-600">Split 1 Due: <strong className="text-neutral-900">${split1Total.toFixed(2)}</strong></span>
                <span className="text-neutral-300">|</span>
                <span className="text-neutral-600">Split 2 Due: <strong className="text-neutral-900">${split2Total.toFixed(2)}</strong></span>
                <span className="text-neutral-300">|</span>
                <span className="text-emerald-900 font-bold bg-emerald-100 px-2 py-0.5 border border-emerald-300 rounded-xs">
                  Grand Total: ${grandTotal.toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Payment Form Body */}
            <form onSubmit={handlePostPayment} className="flex-1 overflow-y-auto p-4 space-y-3.5">
              
              {/* Payment Method Selector Grid */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                  Select Payment Method:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Cash', name: 'Cash', sub: 'USD & KHR Currency', icon: DollarSign, color: 'text-emerald-700' },
                    { id: 'Master Card', name: 'Master Card', sub: 'Credit / Debit', icon: CreditCard, color: 'text-red-700' },
                    { id: 'Visa Card', name: 'Visa Card', sub: 'Credit / Debit', icon: CreditCard, color: 'text-blue-700' },
                    { id: 'ABA QR Pay', name: 'ABA QR Pay', sub: 'Bakong KHQR', icon: QrCode, color: 'text-indigo-700' },
                    { id: 'Bank Transfer', name: 'Bank Transfer', sub: 'ACLEDA / Canadia', icon: Building2, color: 'text-amber-700' },
                    { id: 'Credit Card', name: 'Credit Card (Other)', sub: 'JCB / Amex / UnionPay', icon: CreditCard, color: 'text-purple-700' },
                    { id: 'Apple Pay', name: 'Apple Pay', sub: 'NFC Contactless', icon: Sparkles, color: 'text-neutral-700' },
                  ].map((m) => {
                    const isSelected = paymentMethod === m.id;
                    const IconComp = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                        className={`p-2.5 border text-left rounded-xs transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected 
                            ? 'bg-[#e0f2fe] border-[#0284c7] ring-1 ring-[#0284c7] shadow-xs' 
                            : 'bg-white hover:bg-neutral-50 border-[#b0aca3]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <IconComp className={`w-4 h-4 ${m.color}`} />
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#0284c7]" />}
                        </div>
                        <div className="font-bold text-[11px] text-neutral-900 leading-tight">{m.name}</div>
                        <div className="text-[9.5px] text-neutral-500 line-clamp-1">{m.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Amount & Quick Buttons */}
              <div className="bg-white border border-[#7f9db9] p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <label className="text-[11px] font-bold text-neutral-800">
                    Payment Settlement Amount (USD):
                  </label>
                  {/* Quick preset amount pills */}
                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    {split1Total > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentSplit(1);
                          setPaymentAmount(split1Total.toFixed(2));
                        }}
                        className="px-1.5 py-0.2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xs font-mono font-semibold cursor-pointer"
                      >
                        Split 1: ${split1Total.toFixed(2)}
                      </button>
                    )}
                    {split2Total > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentSplit(2);
                          setPaymentAmount(split2Total.toFixed(2));
                        }}
                        className="px-1.5 py-0.2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xs font-mono font-semibold cursor-pointer"
                      >
                        Split 2: ${split2Total.toFixed(2)}
                      </button>
                    )}
                    {grandTotal > 0 && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(grandTotal.toFixed(2))}
                        className="px-1.5 py-0.2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xs font-mono font-semibold cursor-pointer"
                      >
                        Full: ${grandTotal.toFixed(2)}
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 font-mono text-sm font-bold text-neutral-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    className="w-full h-8 pl-6 pr-3 bg-[#f8fafc] border border-[#7f9db9] rounded-none font-mono text-base font-bold text-neutral-900 focus:bg-white focus:border-[#003366] outline-hidden"
                  />
                </div>

                {/* Cash / KHR Conversion Notice */}
                {(paymentMethod === 'Cash' || paymentMethod === 'ABA QR Pay') && (
                  <div className="bg-[#f0fdf4] border border-[#bbf7d0] px-2.5 py-1.5 rounded-xs flex items-center justify-between text-[10.5px]">
                    <span className="text-emerald-800 font-medium">
                      Cambodian Riel Equivalent:
                    </span>
                    <span className="font-mono font-bold text-emerald-950 text-xs">
                      ៛ {(Math.round((parseFloat(paymentAmount) || 0) * (settings.exchangeRateKHR || settings.exchangeRateUSDToKHR || 4015))).toLocaleString()} KHR
                    </span>
                    <span className="text-[9.5px] text-emerald-600">
                      (1 USD = {(settings.exchangeRateKHR || settings.exchangeRateUSDToKHR || 4015).toLocaleString()} KHR)
                    </span>
                  </div>
                )}
              </div>

              {/* Target Split, Posting Date, & Receipt Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10.5px] font-bold text-neutral-700 mb-0.5">
                    Target Folio Split:
                  </label>
                  <select
                    value={paymentSplit}
                    onChange={(e) => setPaymentSplit(parseInt(e.target.value) || 1)}
                    className="w-full h-6 px-1.5 bg-white border border-[#7f9db9] rounded-none font-bold text-xs"
                  >
                    <option value={1}>Split 1 (Guest Folio)</option>
                    <option value={2}>Split 2 (Company Folio)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-neutral-700 mb-0.5">
                    Payment Posting Date:
                  </label>
                  <input
                    type="text"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="w-full h-6 px-2 bg-white border border-[#7f9db9] rounded-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-neutral-700 mb-0.5">
                    Receipt / Reference Nº:
                  </label>
                  <input
                    type="text"
                    value={paymentReceiptNo}
                    onChange={(e) => setPaymentReceiptNo(e.target.value)}
                    placeholder="e.g. REC-2026-90231"
                    className="w-full h-6 px-2 bg-white border border-[#7f9db9] rounded-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Payer Name & Card Details / Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10.5px] font-bold text-neutral-700 mb-0.5">
                    Payer / Guest Name:
                  </label>
                  <input
                    type="text"
                    value={paymentPayerName}
                    onChange={(e) => setPaymentPayerName(e.target.value)}
                    className="w-full h-6 px-2 bg-white border border-[#7f9db9] rounded-none text-xs"
                  />
                </div>

                {paymentMethod === 'Credit Card' || paymentMethod === 'Visa Card' || paymentMethod === 'Master Card' ? (
                  <div>
                    <label className="block text-[10.5px] font-bold text-neutral-700 mb-0.5">
                      Card Last 4 Digits / Auth Code:
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      placeholder="e.g. 4242 / Auth 8910"
                      value={paymentCardLast4}
                      onChange={(e) => setPaymentCardLast4(e.target.value)}
                      className="w-full h-6 px-2 bg-white border border-[#7f9db9] rounded-none font-mono text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10.5px] font-bold text-neutral-700 mb-0.5">
                      Cashier Remarks / Notes:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Front desk settlement"
                      value={paymentRemarks}
                      onChange={(e) => setPaymentRemarks(e.target.value)}
                      className="w-full h-6 px-2 bg-white border border-[#7f9db9] rounded-none text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#c8c4bc] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setShowPostingChoiceModal(true);
                  }}
                  className="flex items-center gap-1 px-2.5 h-6 bg-white hover:bg-[#eae6db] border border-[#7f9db9] text-neutral-700 text-[10.5px] font-bold cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Options</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-3 h-6 bg-white hover:bg-[#eae6db] border border-[#7f9db9] font-bold text-neutral-800 text-[10.5px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-4 h-6 bg-[#d1e7dd] hover:bg-[#badbcc] border border-[#a3cfbb] font-bold text-[#0f5132] text-[10.5px] cursor-pointer shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5 text-[#0f5132]" />
                    <span>Post Payment to Folio</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Ledger Statement */}
      {showLedgerView && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#fbf9f2] border-2 border-[#5c7080] rounded shadow-2xl p-4 w-full max-w-lg font-sans text-xs">
            <div className="font-bold text-sm text-neutral-900 pb-2 border-b border-[#a09e99] mb-3 flex items-center justify-between">
              <span>Folio Ledger Summary (Room {currentRoomNum} - {currentGuest})</span>
              <button onClick={() => setShowLedgerView(false)} className="text-neutral-600 hover:text-black font-bold">×</button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="font-semibold text-neutral-700">Split 1 (Guest Folio)</span>
                <span className="font-mono font-bold">${split1Total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="font-semibold text-neutral-700">Split 2 (Company / Incidental)</span>
                <span className="font-mono font-bold">${split2Total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b-2 border-neutral-800 font-bold bg-[#ffff99] px-2">
                <span>Total Outstanding Balance</span>
                <span className="font-mono">${grandTotal.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 h-6 bg-white border border-[#7f9db9] font-bold text-neutral-800 rounded-none flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Ledger</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLedgerView(false)}
                className="px-4 h-6 bg-white border border-[#7f9db9] font-bold text-neutral-900 rounded-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Routing Configuration */}
      {showRoutingView && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#fbf9f2] border-2 border-[#5c7080] rounded shadow-2xl p-4 w-full max-w-md font-sans text-xs">
            <div className="font-bold text-sm text-neutral-900 pb-2 border-b border-[#a09e99] mb-3 flex items-center justify-between">
              <span>Automatic Bill Routing Rules</span>
              <button onClick={() => setShowRoutingView(false)} className="text-neutral-600 hover:text-black font-bold">×</button>
            </div>

            <div className="space-y-3 mb-4 text-[11px]">
              <div className="p-2 bg-white border border-[#7f9db9]">
                <div className="font-bold text-blue-900 mb-1">Accommodation Charges → Split 1</div>
                <div className="text-neutral-600">Room rate tariffs are posted directly to Split 1 by default.</div>
              </div>

              <div className="p-2 bg-white border border-[#7f9db9]">
                <div className="font-bold text-emerald-900 mb-1">F&B & Laundry Services → Split 1 / Split 2</div>
                <div className="text-neutral-600">Restaurant and laundry POS tickets route to Guest or Company billing.</div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowRoutingView(false)}
                className="px-4 h-6 bg-[#d1e7dd] border border-[#a3cfbb] font-bold text-[#0f5132] rounded-none"
              >
                Save Routing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: High-Fidelity WINHMS Print Preview by Split */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#f4ede2] border-2 border-[#5c7080] rounded shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col font-sans text-xs overflow-hidden">
            
            {/* Print Preview Header & Toolbar */}
            <div className="bg-[#003366] text-white px-3 py-2 flex flex-wrap items-center justify-between gap-2 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-300" />
                <span className="font-bold text-sm tracking-wide">
                  Invoice Print Preview
                </span>
              </div>

              {/* Split Selector Filter Tabs */}
              <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded">
                <span className="text-[10px] text-blue-200 px-1 font-semibold">Print Target:</span>
                {isSplitEnabled && numSplits > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setPrintSplitTarget('split1')}
                      className={`px-2 py-0.5 text-[10.5px] font-bold rounded-xs transition-colors cursor-pointer ${
                        printSplitTarget === 'split1'
                          ? 'bg-amber-400 text-neutral-900 shadow-xs'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      Split 1 (${split1Total.toFixed(2)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintSplitTarget('split2')}
                      className={`px-2 py-0.5 text-[10.5px] font-bold rounded-xs transition-colors cursor-pointer ${
                        printSplitTarget === 'split2'
                          ? 'bg-amber-400 text-neutral-900 shadow-xs'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      Split 2 (${split2Total.toFixed(2)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintSplitTarget('both')}
                      className={`px-2 py-0.5 text-[10.5px] font-bold rounded-xs transition-colors cursor-pointer ${
                        printSplitTarget === 'both'
                          ? 'bg-amber-400 text-neutral-900 shadow-xs'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      Both Splits (${grandTotal.toFixed(2)})
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPrintSplitTarget('single')}
                    className="px-2 py-0.5 text-[10.5px] font-bold bg-amber-400 text-neutral-900 rounded-xs shadow-xs"
                  >
                    Consolidated (${grandTotal.toFixed(2)})
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xs text-[11px] shadow-sm cursor-pointer active:scale-95 transition-all"
                  title="Send document to printer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  id="btn-preview-export-excel"
                  onClick={handleExportExcel}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold rounded-xs text-[11px] cursor-pointer shadow-xs border border-emerald-500/50 transition-colors"
                  title="Export styled folio to Microsoft Excel (.xls)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Excel (.xls)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="p-1 hover:bg-white/20 rounded-xs text-white cursor-pointer"
                  title="Close Print Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Paper Canvas Area */}
            <div className="flex-1 bg-neutral-300/70 p-3 sm:p-6 overflow-y-auto flex justify-center">
              <div 
                id="winhms-printable-folio"
                className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-10 text-neutral-900 border border-neutral-300 shadow-lg font-sans space-y-4 print:p-0 print:m-0 print:border-none print:shadow-none print:w-full print:max-w-none print:min-h-0 box-border flex flex-col justify-between"
              >
                <div className="space-y-4">
                
                {/* 1. Hotel Header */}
                <div className="border-b-2 border-neutral-900 pb-3 flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-neutral-950 font-serif font-black text-xl tracking-tight">
                      {settings?.hotelLogoUrl ? (
                        <img
                          src={settings.hotelLogoUrl}
                          alt={settings.hotelName || 'Hotel Logo'}
                          className="h-6 w-auto object-contain max-w-[120px]"
                        />
                      ) : (
                        <Building2 className="w-5 h-5 text-blue-900 shrink-0" />
                      )}
                      <span>{settings?.hotelName || 'ROYAL PALACE HOTEL & SUITES'}</span>
                    </div>
                    <p className="text-[10px] text-neutral-600">
                      {[
                        settings?.houseNumber,
                        settings?.streetAddress,
                        settings?.communeSangkat,
                        settings?.townKhan,
                        settings?.provinceCity || settings?.address,
                      ].filter(Boolean).join(', ') || settings?.address || '#168 Preah Norodom Blvd, Tonle Bassac, Daun Penh, Phnom Penh, Cambodia'}
                    </p>
                    <p className="text-[10px] text-neutral-600">
                      Tel: {settings?.phone || '(+855) 23 888 999'} &nbsp;|&nbsp; Email: {settings?.managerEmail || 'reservations@royalpalacehotel.com'}
                      {(settings?.vatNumber ?? 'K008-902401874') ? (
                        <> &nbsp;|&nbsp; VAT ID: {settings?.vatNumber ?? 'K008-902401874'}</>
                      ) : null}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="inline-block bg-[#003366] text-white font-bold px-2.5 py-0.5 text-xs rounded-xs uppercase tracking-wider">
                      Invoice
                    </div>
                    <div className="text-[10.5px] font-mono text-neutral-700">
                      Invoice Nº: <strong>INV-{currentRoomNum}-{printSplitTarget === 'split2' ? 'SPL2' : 'SPL1'}-0028</strong>
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      Issue Date: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* 2. Guest & Stay Metadata Box */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-neutral-50 border border-neutral-300 text-[11px]">
                  <div className="space-y-1.5 border-r border-neutral-200 pr-3">
                    <div className="grid grid-cols-[100px_1fr] items-baseline gap-1">
                      <span className="text-neutral-500 font-semibold text-left">Guest Name:</span>
                      <strong className="text-neutral-900 uppercase text-left">{currentGuest}</strong>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] items-baseline gap-1">
                      <span className="text-neutral-500 font-semibold text-left">Room Number:</span>
                      <strong className="text-neutral-900 font-mono text-xs text-left">{currentRoomNum}</strong>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] items-baseline gap-1">
                      <span className="text-neutral-500 font-semibold text-left">Adults / Pax:</span>
                      <span className="text-neutral-800 text-left">{paxCount} Person(s)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pl-2">
                    <div className="grid grid-cols-[1fr_auto] items-baseline gap-2.5">
                      <span className="text-neutral-500 font-semibold text-right">Arrival Date:</span>
                      <strong className="text-neutral-900 font-mono text-right min-w-[85px]">{arrivalDate}</strong>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] items-baseline gap-2.5">
                      <span className="text-neutral-500 font-semibold text-right">Departure Date:</span>
                      <strong className="text-neutral-900 font-mono text-right min-w-[85px]">{departureDate}</strong>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] items-baseline gap-2.5">
                      <span className="text-neutral-500 font-semibold text-right">Company:</span>
                      <span className="text-neutral-800 text-right">{companyName || 'Direct Booking'}</span>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] items-baseline gap-2.5">
                      <span className="text-neutral-500 font-semibold text-right">Cashier / Staff:</span>
                      <span className="text-neutral-800 font-mono text-right">{currentUser?.username || settings.managerName || 'PHANIT'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Itemized Charges Table according to Active Split */}
                <div className="space-y-3">
                  
                  {/* SPLIT 1 SECTION */}
                  {(printSplitTarget === 'split1' || printSplitTarget === 'both' || printSplitTarget === 'single') && (
                    <div className="border border-neutral-300">
                      <div className="bg-[#e4ebd9] px-2.5 py-1 font-bold text-neutral-900 text-[11px] flex justify-between items-center border-b border-neutral-300">
                        <span>Guest Charge</span>
                      </div>

                      <table className="w-full text-[10.5px] border-collapse">
                        <thead>
                          <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-700 font-semibold">
                            <th className="py-1 px-2 text-center w-8">#</th>
                            <th className="py-1 px-2 text-left w-24 font-mono">Date</th>
                            <th className="py-1 px-3 text-left">Description / Particulars</th>
                            <th className="py-1 px-2 text-right w-20">Debit ($)</th>
                            <th className="py-1 px-2 text-right w-20">Credit ($)</th>
                            <th className="py-1 px-2 text-right w-22">Balance ($)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {split1Charges.map((item, idx) => {
                            const isCredit = item.amount < 0;
                            return (
                              <tr key={item.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                                <td className="py-1 px-2 text-center text-neutral-400 font-mono">{idx + 1}</td>
                                <td className="py-1 px-2 font-mono text-neutral-700 whitespace-nowrap">{formatFolioDate(item.date)}</td>
                                <td className="py-1 px-3 text-neutral-900 font-medium">{cleanFolioDescription(item.description)}</td>
                                <td className="py-1 px-2 text-right font-mono">{!isCredit ? `$ ${item.amount.toFixed(2)}` : '-'}</td>
                                <td className="py-1 px-2 text-right font-mono text-red-700">{isCredit ? `$ ${Math.abs(item.amount).toFixed(2)}` : '-'}</td>
                                <td className="py-1 px-2 text-right font-mono font-semibold">$ {item.amount.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                          {split1Charges.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-3 text-center text-neutral-400 italic">
                                No charges recorded under Split 1.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* SPLIT 2 SECTION */}
                  {(printSplitTarget === 'split2' || printSplitTarget === 'both') && (
                    <div className="border border-neutral-300">
                      <div className="bg-[#e4ebd9] px-2.5 py-1 font-bold text-neutral-900 text-[11px] flex justify-between items-center border-b border-neutral-300">
                        <span>Guest Charge</span>
                      </div>

                      <table className="w-full text-[10.5px] border-collapse">
                        <thead>
                          <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-700 font-semibold">
                            <th className="py-1 px-2 text-center w-8">#</th>
                            <th className="py-1 px-2 text-left w-24 font-mono">Date</th>
                            <th className="py-1 px-3 text-left">Description / Particulars</th>
                            <th className="py-1 px-2 text-right w-20">Debit ($)</th>
                            <th className="py-1 px-2 text-right w-20">Credit ($)</th>
                            <th className="py-1 px-2 text-right w-22">Balance ($)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {split2Charges.map((item, idx) => {
                            const isCredit = item.amount < 0;
                            return (
                              <tr key={item.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                                <td className="py-1 px-2 text-center text-neutral-400 font-mono">{idx + 1}</td>
                                <td className="py-1 px-2 font-mono text-neutral-700 whitespace-nowrap">{formatFolioDate(item.date)}</td>
                                <td className="py-1 px-3 text-neutral-900 font-medium">{cleanFolioDescription(item.description)}</td>
                                <td className="py-1 px-2 text-right font-mono">{!isCredit ? `$ ${item.amount.toFixed(2)}` : '-'}</td>
                                <td className="py-1 px-2 text-right font-mono text-red-700">{isCredit ? `$ ${Math.abs(item.amount).toFixed(2)}` : '-'}</td>
                                <td className="py-1 px-2 text-right font-mono font-semibold">$ {item.amount.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                          {split2Charges.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-3 text-center text-neutral-400 italic">
                                No charges recorded under Split 2.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>

                {/* 4. Totals & Dual-Currency Breakdown Box */}
                {(() => {
                  const activeTotal = 
                    printSplitTarget === 'split1' ? split1Total :
                    printSplitTarget === 'split2' ? split2Total :
                    grandTotal;
                  
                  const totalPayableUSD = activeTotal;
                  const exchangeRate = settings?.exchangeRateKHR || settings?.exchangeRateUSDToKHR || 4015;
                  const totalKHR = Math.round(totalPayableUSD * exchangeRate);

                  return (
                    <div className="flex justify-end pt-2 totals-box">
                      {/* Currency & Amount Totals */}
                      <div className="border border-neutral-300 bg-neutral-50 p-2.5 space-y-1 text-[11px] w-72 sm:w-80">
                        <div className="flex justify-between py-1.5 border-t border-neutral-300 bg-[#ffff99] px-2 font-bold text-neutral-950 text-xs">
                          <span>Total in USD:</span>
                          <span className="font-mono font-black">$ {totalPayableUSD.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1 bg-neutral-200 px-2 font-bold text-neutral-900 text-[11px]">
                          <span>Total in KHR :</span>
                          <span className="font-mono">៛ {totalKHR.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                </div>

                {/* 5. Dual Signature Block */}
                <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[10.5px] signature-block">
                  <div className="space-y-10">
                    <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                    <div className="font-bold text-neutral-800">
                      Guest Signature
                      <div className="text-[9px] font-normal text-neutral-500">I have reviewed and accepted all folio line charges</div>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                    <div className="font-bold text-neutral-800">
                      Duty Cashier / Front Desk Officer
                      <div className="text-[9px] font-mono text-neutral-600">{currentUser?.username || settings.managerName || 'PHANIT'}</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Footer inside Preview Modal */}
            <div className="bg-[#f0ece1] border-t border-[#a09e99] px-4 py-2 flex items-center justify-between print:hidden text-xs">
              <span className="text-neutral-600 text-[11px]">
                Showing preview for: <strong className="text-blue-900 uppercase">{printSplitTarget}</strong> (Room {currentRoomNum})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-4 h-6 bg-[#003366] hover:bg-[#002244] text-white font-bold text-[11px] rounded-none shadow-2xs cursor-pointer active:scale-95 transition-all"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="px-4 h-6 bg-white hover:bg-[#eae6db] border border-[#7f9db9] font-bold text-neutral-900 text-[11px] rounded-none shadow-2xs cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
