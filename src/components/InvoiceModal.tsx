import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Mail, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  User, 
  RotateCcw,
  Building2, 
  Receipt, 
  FileText,
  BedDouble, 
  Crown, 
  MapPin, 
  Save, 
  Check, 
  Columns
} from 'lucide-react';
import { Transaction, Room, UserSettings, RoomType, PaymentMethod } from '../types';
import { playChime } from '../utils/helpers';

export interface InvoiceItem {
  id: string;
  no: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface CustomerBookingUpdateData {
  id?: string;
  roomId?: string;
  roomNumber: string;
  roomType?: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  customerAddress?: string;
  customerPassport?: string;
  customerNationality?: string;
  checkInDate: string;
  checkOutDate: string;
  rate: number;
  guestsCount: number;
  adultsCount?: number;
  childrenCount?: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: string;
  notes?: string;
  extraBed?: boolean;
  extraBedCount?: number;
  vipStatus?: boolean;
  isCurrentStay?: boolean;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  room?: Room | null;
  settings: UserSettings;
  initialTab?: 'booking' | 'invoice' | 'split';
  onEditGuestProfile?: (guestName: string, roomNumber?: string) => void;
  onSaveCustomerBooking?: (data: CustomerBookingUpdateData) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  transaction,
  room,
  settings,
  initialTab = 'split',
  onSaveCustomerBooking,
}) => {
  const [activeTab, setActiveTab] = useState<'split' | 'booking' | 'invoice'>(initialTab);
  const [emailSent, setEmailSent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [zoomLevel] = useState<number>(100);

  const [companyName, setCompanyName] = useState('ROYAL PALACE HOTEL & SUITES');
  const [houseNumber, setHouseNumber] = useState('#168');
  const [streetAddress, setStreetAddress] = useState('Preah Norodom Blvd');
  const [communeSangkat, setCommuneSangkat] = useState('Tonle Bassac');
  const [townKhan, setTownKhan] = useState('Daun Penh');
  const [provinceCity, setProvinceCity] = useState('Phnom Penh');
  const [companyTelephone, setCompanyTelephone] = useState('(+855) 23 888 999');
  const [companyEmail, setCompanyEmail] = useState('reservations@royalpalacehotel.com');
  const [companyVatNumber, setCompanyVatNumber] = useState(settings.vatNumber || 'K008-902401874');

  const [guestTitle, setGuestTitle] = useState('Mr.');
  const [customerName, setCustomerName] = useState('Mr. SOK ELEONORE');
  const [customerPhone, setCustomerPhone] = useState('(+855) 12 345 678');
  const [customerEmail, setCustomerEmail] = useState('sok.eleonore@email.com');
  const [customerAddress, setCustomerAddress] = useState('No. 45 Monivong Blvd, Phnom Penh, Cambodia');
  const [customerPassport, setCustomerPassport] = useState('N-8932410');
  const [customerNationality, setCustomerNationality] = useState('Cambodia');

  const [roomNumber, setRoomNumber] = useState('102');
  const [roomType, setRoomType] = useState<RoomType>('Deluxe Suite');
  const [checkInDate, setCheckInDate] = useState('2026-08-26');
  const [checkOutDate, setCheckOutDate] = useState('2026-08-29');
  const [nightlyRate, setNightlyRate] = useState<number>(120);
  const [adultsCount, setAdultsCount] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [extraBed, setExtraBed] = useState<boolean>(false);
  const [extraBedCount] = useState<number>(1);
  const [extraBedRate] = useState<number>(25);
  const [vipStatus, setVipStatus] = useState<boolean>(false);
  const [bookingStatus, setBookingStatus] = useState<'occupied' | 'reserved' | 'checked_out'>('occupied');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [paymentStatus, setPaymentStatus] = useState('Paid / Settled');
  const [specialRequests, setSpecialRequests] = useState('High floor room, quiet wing. Executive airport transfer requested.');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-00188');
  const [invoiceDate, setInvoiceDate] = useState('27/08/2026');
  const [dateDigits, setDateDigits] = useState<string[]>(['2', '7', '0', '8', '2', '0', '2', '6']);

  const [customerSignerName, setCustomerSignerName] = useState("Customer's Signature & Name");
  const [sellerSignerName, setSellerSignerName] = useState("Seller's Signature & Name");

  const [exchangeRate, setExchangeRate] = useState<number>(settings?.exchangeRateKHR || 4015);

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    {
      id: 'item-1',
      no: 1,
      description: 'FHD-FXRD Executive Suite Accommodation (Room #102) - 3 Nights',
      quantity: 1,
      unitPrice: 1100.00,
      amount: 1100.00,
    }
  ]);

  const handleSyncFromHotelSetup = () => {
    setCompanyName(settings.hotelName || 'ROYAL PALACE HOTEL & SUITES');
    setHouseNumber(settings.houseNumber || '#168');
    setStreetAddress(settings.streetAddress || 'Preah Norodom Blvd');
    setCommuneSangkat(settings.communeSangkat || 'Tonle Bassac');
    setTownKhan(settings.townKhan || 'Daun Penh');
    setProvinceCity(settings.provinceCity || 'Phnom Penh');
    setCompanyTelephone(settings.phone || '(+855) 23 888 999');
    setCompanyEmail(settings.managerEmail || 'reservations@royalpalacehotel.com');
    setCompanyVatNumber(settings.vatNumber || 'K008-902401874');
    if (settings.exchangeRateKHR) {
      setExchangeRate(settings.exchangeRateKHR);
    }
  };

  const calculatedNights = useMemo(() => {
    try {
      const d1 = new Date(checkInDate);
      const d2 = new Date(checkOutDate);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  }, [checkInDate, checkOutDate]);

  useEffect(() => {
    if (isOpen) {
      setCompanyName(settings.hotelName || 'ROYAL PALACE HOTEL & SUITES');
      setHouseNumber(settings.houseNumber || '#168');
      setStreetAddress(settings.streetAddress || 'Preah Norodom Blvd');
      setCommuneSangkat(settings.communeSangkat || 'Tonle Bassac');
      setTownKhan(settings.townKhan || 'Daun Penh');
      setProvinceCity(settings.provinceCity || 'Phnom Penh');
      setCompanyTelephone(settings.phone || '(+855) 23 888 999');
      setCompanyEmail(settings.managerEmail || 'reservations@royalpalacehotel.com');
      setCompanyVatNumber(settings.vatNumber || 'K008-902401874');
      if (settings.exchangeRateKHR) {
        setExchangeRate(settings.exchangeRateKHR);
      }

      if (transaction) {
        const invNum = transaction.invoiceNumber || `INV-2026-${transaction.roomNumber || '01'}${Date.now().toString().slice(-4)}`;
        const formattedDate = new Date(transaction.date).toLocaleDateString('en-GB');
        const rawGuest = transaction.guestOrVendor || 'Valued Customer';
        setInvoiceNumber(invNum);
        setInvoiceDate(formattedDate);
        setCustomerName(rawGuest);
        setPaymentStatus(transaction.status === 'paid' ? 'Paid / Settled' : 'Pending');
        setPaymentMethod((transaction.paymentMethod as PaymentMethod) || 'Credit Card');
        
        const rawDigits = formattedDate.replace(/[^0-9]/g, '').slice(0, 8).split('');
        if (rawDigits.length === 8) setDateDigits(rawDigits);

        if (room) {
          setRoomNumber(room.roomNumber);
          setRoomType(room.type);
          setNightlyRate(room.pricePerNight);
          setVipStatus(room.type === 'Presidential Suite');
          setBookingStatus(room.status === 'occupied' ? 'occupied' : 'reserved');
          if (room.guestEmail) setCustomerEmail(room.guestEmail);
          if (room.guestPhone) setCustomerPhone(room.guestPhone);
          if (room.notes) setSpecialRequests(room.notes);
          const cIn = room.checkInDate || '2026-08-26';
          const cOut = room.checkOutDate || '2026-08-29';
          setCheckInDate(cIn);
          setCheckOutDate(cOut);
          const d1 = new Date(cIn);
          const d2 = new Date(cOut);
          const nights = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) || 1);
          setInvoiceItems([
            {
              id: 'item-room',
              no: 1,
              description: `${room.type} Accommodation (Room #${room.roomNumber}) - ${nights} Nights`,
              quantity: nights,
              unitPrice: room.pricePerNight,
              amount: room.pricePerNight * nights,
            }
          ]);
        } else {
          setRoomNumber(transaction.roomNumber || '102');
          setInvoiceItems([
            {
              id: 'tx-1',
              no: 1,
              description: transaction.description || `${transaction.category} Service`,
              quantity: 1,
              unitPrice: transaction.amount,
              amount: transaction.amount,
            }
          ]);
        }
      } else if (room) {
        const invNum = `INV-2026-${room.roomNumber}${Math.floor(100 + Math.random() * 899)}`;
        const dateStr = new Date().toLocaleDateString('en-GB');
        setInvoiceNumber(invNum);
        setInvoiceDate(dateStr);
        setRoomNumber(room.roomNumber);
        setRoomType(room.type);
        setNightlyRate(room.pricePerNight);
        setCustomerName(room.guestName || 'Mr. SOK ELEONORE');
        setCustomerEmail(room.guestEmail || 'guest@example.com');
        setCustomerPhone(room.guestPhone || '(+855) 12 345 678');
        setCheckInDate(room.checkInDate || '2026-08-26');
        setCheckOutDate(room.checkOutDate || '2026-08-29');
        setBookingStatus(room.status === 'occupied' ? 'occupied' : 'reserved');
        setPaymentStatus(room.status === 'occupied' ? 'Paid / Settled' : 'Pending');
        const d1 = new Date(room.checkInDate || '2026-08-26');
        const d2 = new Date(room.checkOutDate || '2026-08-29');
        const nights = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) || 1);
        setInvoiceItems([
          {
            id: 'item-room',
            no: 1,
            description: `${room.type} Accommodation (Room #${room.roomNumber}) - ${nights} Nights`,
            quantity: nights,
            unitPrice: room.pricePerNight,
            amount: room.pricePerNight * nights,
          }
        ]);
      } else {
        loadDefaultSample();
      }
    }
  }, [isOpen, transaction, room, settings]);

  const loadDefaultSample = () => {
    setCompanyName(settings.hotelName || 'ROYAL PALACE HOTEL & SUITES');
    setHouseNumber('#168');
    setStreetAddress('Preah Norodom Blvd');
    setCommuneSangkat('Tonle Bassac');
    setTownKhan('Daun Penh');
    setProvinceCity('Phnom Penh');
    setCompanyTelephone('(+855) 23 888 999');
    setCompanyEmail('reservations@royalpalacehotel.com');
    setGuestTitle('Mr.');
    setCustomerName('Mr. SOK ELEONORE');
    setCustomerPhone('(+855) 12 345 678');
    setCustomerEmail('sok.eleonore@email.com');
    setCustomerAddress('No. 45 Monivong Blvd, Phnom Penh, Cambodia');
    setCustomerPassport('N-8932410');
    setCustomerNationality('Cambodia');
    setRoomNumber('102');
    setRoomType('Deluxe Suite');
    setCheckInDate('2026-08-26');
    setCheckOutDate('2026-08-29');
    setNightlyRate(120);
    setAdultsCount(2);
    setChildrenCount(0);
    setExtraBed(false);
    setVipStatus(false);
    setBookingStatus('occupied');
    setInvoiceNumber('INV-2026-00188');
    setInvoiceDate('27/08/2026');
    setDateDigits(['2', '7', '0', '8', '2', '0', '2', '6']);
    setPaymentStatus('Paid / Settled');
    setPaymentMethod('Credit Card');
    setCustomerSignerName("Customer's Signature & Name");
    setSellerSignerName("Seller's Signature & Name");
    setInvoiceItems([
      {
        id: 'item-1',
        no: 1,
        description: 'FHD-FXRD',
        quantity: 1,
        unitPrice: 1100.00,
        amount: 1100.00,
      }
    ]);
    setExchangeRate(4015);
  };

  if (!isOpen) return null;

  const handleSyncBookingToInvoice = () => {
    const updatedItems = [...invoiceItems];
    const roomItemIndex = updatedItems.findIndex(i => i.id === 'item-room' || i.no === 1);
    const nights = calculatedNights;
    const roomDesc = `${roomType} Accommodation (Room #${roomNumber}) - ${nights} Nights`;
    if (roomItemIndex >= 0) {
      updatedItems[roomItemIndex] = {
        ...updatedItems[roomItemIndex],
        description: roomDesc,
        quantity: nights,
        unitPrice: nightlyRate,
        amount: nights * nightlyRate,
      };
    } else {
      updatedItems.unshift({
        id: 'item-room',
        no: 1,
        description: roomDesc,
        quantity: nights,
        unitPrice: nightlyRate,
        amount: nights * nightlyRate,
      });
      updatedItems.forEach((it, idx) => { it.no = idx + 1; });
    }

    const extraBedIndex = updatedItems.findIndex(i => i.id === 'item-extra-bed');
    if (extraBed) {
      const extraBedTotal = extraBedCount * extraBedRate * nights;
      if (extraBedIndex >= 0) {
        updatedItems[extraBedIndex] = {
          ...updatedItems[extraBedIndex],
          description: `Rollaway Extra Bed (${extraBedCount}x) - ${nights} Nights`,
          quantity: nights,
          unitPrice: extraBedCount * extraBedRate,
          amount: extraBedTotal,
        };
      } else {
        updatedItems.push({
          id: 'item-extra-bed',
          no: updatedItems.length + 1,
          description: `Rollaway Extra Bed (${extraBedCount}x) - ${nights} Nights`,
          quantity: nights,
          unitPrice: extraBedCount * extraBedRate,
          amount: extraBedTotal,
        });
      }
    } else if (extraBedIndex >= 0) {
      updatedItems.splice(extraBedIndex, 1);
      updatedItems.forEach((it, idx) => { it.no = idx + 1; });
    }
    setInvoiceItems(updatedItems);
  };

  const invoiceSubTotal = invoiceItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const invoiceGrandTotalUSD = invoiceSubTotal;
  const invoiceGrandTotalKHR = Math.round(invoiceGrandTotalUSD * exchangeRate);

  const handleAddInvoiceItem = () => {
    const nextNo = invoiceItems.length + 1;
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      no: nextNo,
      description: 'Additional Service / Item',
      quantity: 1,
      unitPrice: 50.00,
      amount: 50.00,
    };
    setInvoiceItems([...invoiceItems, newItem]);
  };

  const handleRemoveInvoiceItem = (id: string) => {
    if (invoiceItems.length <= 1) return;
    const filtered = invoiceItems.filter(item => item.id !== id);
    const reNumbered = filtered.map((item, idx) => ({ ...item, no: idx + 1 }));
    setInvoiceItems(reNumbered);
  };

  const handleUpdateInvoiceItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = field === 'quantity' ? Number(value) || 0 : item.quantity;
          const price = field === 'unitPrice' ? Number(value) || 0 : item.unitPrice;
          updated.amount = qty * price;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSaveCustomerProfileAndBooking = () => {
    handleSyncBookingToInvoice();
    if (onSaveCustomerBooking) {
      onSaveCustomerBooking({
        id: transaction?.id || room?.id,
        roomId: room?.id,
        roomNumber,
        roomType,
        guestName: customerName,
        guestEmail: customerEmail,
        guestPhone: customerPhone,
        customerAddress,
        customerPassport,
        customerNationality,
        checkInDate,
        checkOutDate,
        rate: nightlyRate,
        guestsCount: adultsCount + childrenCount,
        adultsCount,
        childrenCount,
        paymentMethod,
        paymentStatus,
        notes: specialRequests,
        extraBed,
        extraBedCount,
        vipStatus,
        isCurrentStay: bookingStatus === 'occupied',
      });
    }
    setSaveSuccess(true);
    if (settings.soundEffects) playChime();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    setEmailSent(true);
    if (settings.soundEffects) playChime();
    setTimeout(() => setEmailSent(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-2 sm:p-4 backdrop-blur-sm print:p-0 print:bg-white animate-in fade-in">
      
      {/* Main Master Container: GUEST FOLIO */}
      <div className="relative w-full max-w-6xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden my-4 flex flex-col max-h-[96vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:m-0 print:w-full">
        
        {/* HEADER: GUEST FOLIO */}
        <div 
          id="guest-folio-header-bar"
          className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950 px-5 py-3.5 text-white print:hidden shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <span>Guest Folio</span>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/50 font-bold">
                    {invoiceNumber}
                  </span>
                </h3>
                {vipStatus && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 uppercase">
                    <Crown className="h-3 w-3 text-amber-400" /> VIP
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 font-medium flex items-center gap-2 mt-0.5">
                <span className="text-white font-bold">{customerName || 'Valued Guest'}</span>
                <span>•</span>
                <span className="font-mono text-amber-300 font-bold">Room #{roomNumber}</span>
                <span>({roomType})</span>
                <span>•</span>
                <span className="text-neutral-400">{calculatedNights} Nights Stay</span>
              </p>
            </div>
          </div>

          <div className="flex items-center rounded-xl bg-neutral-900 border border-neutral-800 p-1 text-xs font-semibold shadow-inner">
            <button
              type="button"
              id="btn-tab-booking-info"
              onClick={() => setActiveTab('booking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'booking'
                  ? 'bg-amber-600 text-white shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Customer & Booking Info</span>
            </button>
            <button
              type="button"
              id="btn-tab-invoice-statement"
              onClick={() => setActiveTab('invoice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'invoice'
                  ? 'bg-purple-600 text-white shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Invoice</span>
            </button>
            <button
              type="button"
              id="btn-tab-split-view"
              onClick={() => setActiveTab('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'split'
                  ? 'bg-neutral-700 text-white shadow-md font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Side-by-side Booking Editor and Live Invoice"
            >
              <Columns className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Split View</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-save-guest-folio"
              onClick={handleSaveCustomerProfileAndBooking}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-md active:scale-95"
              title="Save all changes to Customer Information, Booking Schedule, and Live Invoice"
            >
              {saveSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              <span>{saveSuccess ? 'Saved!' : 'Save Folio'}</span>
            </button>

            <button
              id="btn-print-guest-folio"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 px-3 py-1.5 text-xs font-bold text-purple-200 transition-all shadow-sm active:scale-95"
            >
              <Printer className="h-3.5 w-3.5 text-purple-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleSendEmail}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-200 transition-colors"
            >
              {emailSent ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Mail className="h-3.5 w-3.5" />}
              <span className="hidden md:inline">{emailSent ? 'Sent!' : 'Email'}</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors ml-1"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* MAIN BODY */}
        <div className="flex-1 overflow-y-auto bg-neutral-950 p-4 sm:p-6 print:p-0 print:overflow-visible print:bg-white">
          
          {saveSuccess && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-4 py-2.5 text-xs text-emerald-200 animate-in fade-in print:hidden">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-bold">Guest Folio & Booking details updated successfully!</span>
                <span className="text-emerald-300/80">Rates, dates, and invoice line items are synchronized.</span>
              </div>
            </div>
          )}

          <div className={`${activeTab === 'split' ? 'grid grid-cols-1 lg:grid-cols-12 gap-6' : 'max-w-5xl mx-auto'}`}>
            
            {/* SECTION 1: CUSTOMER & BOOKING INFORMATION */}
            {(activeTab === 'booking' || activeTab === 'split') && (
              <div className={`${activeTab === 'split' ? 'lg:col-span-5' : 'w-full'} space-y-4 print:hidden`}>
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-amber-400" />
                      <h4 className="text-sm font-bold text-white">Customer Booking Information</h4>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700">
                      Editable Record
                    </span>
                  </div>

                  {/* Customer Identity Fields */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-4 sm:col-span-3">
                        <label className="block text-[11px] font-bold text-neutral-400 mb-1">Title</label>
                        <select
                          value={guestTitle}
                          onChange={(e) => {
                            setGuestTitle(e.target.value);
                            const nameWithoutTitle = customerName.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.)\s*/i, '');
                            setCustomerName(`${e.target.value} ${nameWithoutTitle}`);
                          }}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-2.5 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                        >
                          <option value="Mr.">Mr.</option>
                          <option value="Ms.">Ms.</option>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Dr.">Dr.</option>
                          <option value="Prof.">Prof.</option>
                        </select>
                      </div>
                      <div className="col-span-8 sm:col-span-9">
                        <label className="block text-[11px] font-bold text-neutral-400 mb-1">Customer Full Name *</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Mr. SOK ELEONORE"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="(+855) 12 345 678"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="guest@example.com"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Passport / National ID</label>
                        <input
                          type="text"
                          value={customerPassport}
                          onChange={(e) => setCustomerPassport(e.target.value)}
                          placeholder="N-8932410"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Nationality</label>
                        <input
                          type="text"
                          value={customerNationality}
                          onChange={(e) => setCustomerNationality(e.target.value)}
                          placeholder="Cambodia"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Residential / Company Address</label>
                      <input
                        type="text"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="No. 45 Monivong Blvd, Phnom Penh"
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Room & Stay Schedule */}
                  <div className="pt-3 border-t border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                        <BedDouble className="h-3.5 w-3.5 text-amber-400" /> Room & Stay Details
                      </span>
                      <span className="text-[11px] font-mono font-bold text-amber-300">
                        {calculatedNights} Night{calculatedNights > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Room #</label>
                        <input
                          type="text"
                          value={roomNumber}
                          onChange={(e) => setRoomNumber(e.target.value)}
                          placeholder="102"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Room Type</label>
                        <select
                          value={roomType}
                          onChange={(e) => setRoomType(e.target.value as RoomType)}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                        >
                          <option value="Standard Room">Standard Room</option>
                          <option value="Deluxe Suite">Deluxe Suite</option>
                          <option value="Presidential Suite">Presidential Suite</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Check-In Date</label>
                        <input
                          type="date"
                          value={checkInDate}
                          onChange={(e) => setCheckInDate(e.target.value)}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Check-Out Date</label>
                        <input
                          type="date"
                          value={checkOutDate}
                          onChange={(e) => setCheckOutDate(e.target.value)}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Rate ($/Night)</label>
                        <input
                          type="number"
                          min={10}
                          value={nightlyRate}
                          onChange={(e) => setNightlyRate(Number(e.target.value))}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs font-bold text-amber-300 focus:border-amber-400 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Adults</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={adultsCount}
                          onChange={(e) => setAdultsCount(Number(e.target.value))}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Children</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={childrenCount}
                          onChange={(e) => setChildrenCount(Number(e.target.value))}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Extra Bed & VIP Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-800 bg-neutral-950 cursor-pointer hover:border-neutral-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={extraBed}
                          onChange={(e) => setExtraBed(e.target.checked)}
                          className="rounded border-neutral-700 text-amber-500 focus:ring-amber-400"
                        />
                        <span className="text-xs text-neutral-200 font-medium">Extra Bed (+${extraBedRate}/n)</span>
                      </label>
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-800 bg-neutral-950 cursor-pointer hover:border-neutral-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={vipStatus}
                          onChange={(e) => setVipStatus(e.target.checked)}
                          className="rounded border-neutral-700 text-amber-500 focus:ring-amber-400"
                        />
                        <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                          <Crown className="h-3 w-3 text-amber-400" /> VIP Guest
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Payment & Status */}
                  <div className="pt-3 border-t border-neutral-800 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Payment Method</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
                        >
                          <option value="Credit Card">Credit Card</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="ABA QR Pay">ABA QR Pay</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Folio Status</label>
                        <select
                          value={paymentStatus}
                          onChange={(e) => setPaymentStatus(e.target.value)}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
                        >
                          <option value="Paid / Settled">Paid / Settled</option>
                          <option value="Pending">Pending Collection</option>
                          <option value="Deposit Paid">Deposit Paid</option>
                          <option value="Complimentary">Complimentary</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Special Requests & Instructions</label>
                      <textarea
                        rows={2}
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="e.g. VIP welcome drinks, airport transfer details..."
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveCustomerProfileAndBooking}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition-all shadow-md active:scale-95"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save & Sync Customer Information to Invoice</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: INVOICE TEMPLATE */}
            {(activeTab === 'invoice' || activeTab === 'split') && (
              <div className={`${activeTab === 'split' ? 'lg:col-span-7' : 'w-full'} space-y-4`}>
                
                {/* Invoice Toolbar controls */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-neutral-800 bg-neutral-900/90 p-3 text-xs print:hidden shadow-md">
                  
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-200">Invoice Nº :</span>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-1 text-xs font-mono font-bold text-amber-300 focus:border-amber-500 focus:outline-none w-36"
                    />
                    <span className="text-neutral-400 ml-1 font-medium">Date:</span>
                    <input
                      type="text"
                      value={invoiceDate}
                      onChange={(e) => {
                        setInvoiceDate(e.target.value);
                        const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 8).split('');
                        if (raw.length === 8) setDateDigits(raw);
                      }}
                      className="rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs font-mono text-neutral-300 focus:border-amber-500 focus:outline-none w-28"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSyncFromHotelSetup}
                      className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 px-2.5 py-1 text-xs font-semibold text-cyan-200 transition-all shadow-sm"
                      title="Reload hotel name, address, telephone, email, and exchange rate directly from Setup"
                    >
                      <RotateCcw className="h-3 w-3 text-cyan-400" />
                      <span>Sync from Setup</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddInvoiceItem}
                      className="flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/60 px-2.5 py-1 text-xs font-bold text-amber-200 transition-all shadow-sm"
                    >
                      <Plus className="h-3 w-3 text-amber-400" />
                      <span>Add Line Item</span>
                    </button>
                    <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
                      <span>Rate:</span>
                      <input
                        type="number"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(Number(e.target.value))}
                        className="w-16 rounded border border-neutral-700 bg-neutral-950 px-1.5 py-0.5 text-right font-bold text-white focus:outline-none"
                        title="Exchange Rate KHR per USD"
                      />
                    </div>
                  </div>
                </div>

                {/* Printable Document Sheet Canvas */}
                <div 
                  className="overflow-y-auto p-4 sm:p-6 flex justify-center rounded-2xl border border-neutral-800 bg-neutral-950 print:p-0 print:overflow-visible print:bg-white print:border-none"
                >
                  <div 
                    id="printable-sample-invoice"
                    style={{ 
                      fontFamily: "'Segoe UI', Arial, sans-serif",
                      transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
                      transformOrigin: 'top center'
                    }}
                    className="w-full max-w-[820px] bg-white text-neutral-950 p-6 sm:p-10 shadow-2xl rounded-sm print:shadow-none print:p-0 print:w-full print:max-w-none text-[12px] leading-tight font-sans border border-neutral-300 print:border-none transition-transform duration-150"
                  >
                    
                    {/* 1. TOP HEADER: LOGO BOX + COMPANY NAME + ADDRESS DETAILS */}
                    <div className="grid grid-cols-12 gap-4 items-start pb-2">
                      <div className="col-span-3">
                        {settings.hotelLogoUrl ? (
                          <div className="border border-neutral-600 rounded-xs bg-neutral-50 h-20 w-32 flex items-center justify-center p-1 overflow-hidden shadow-xs">
                            <img 
                              src={settings.hotelLogoUrl} 
                              alt="Hotel Logo" 
                              referrerPolicy="no-referrer"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="border border-neutral-600 rounded-xs bg-neutral-50 h-20 w-32 flex flex-col items-center justify-center p-2 text-center shadow-xs">
                            <Building2 className="h-5 w-5 text-neutral-700 mb-1" />
                            <span className="text-[11px] font-bold text-neutral-800 tracking-tight">Company's logo</span>
                          </div>
                        )}
                      </div>

                      <div className="col-span-9 pl-1 text-left space-y-1.5">
                        <div className="text-center sm:text-left">
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="text-base sm:text-lg font-black text-black uppercase tracking-wider w-full bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-black focus:outline-none"
                            placeholder="COMPANY NAME"
                            title="Synced from Hotel Setup"
                          />
                        </div>

                        <div className="grid grid-cols-12 gap-2 text-[11px] text-black">
                          <div className="col-span-3 flex items-center gap-1">
                            <span className="font-semibold text-black">Address:</span>
                            <input
                              type="text"
                              value={houseNumber}
                              onChange={(e) => setHouseNumber(e.target.value)}
                              className="w-12 bg-transparent border-b border-neutral-300 px-0.5 text-black focus:outline-none font-medium"
                              placeholder="#168"
                              title="House / Building No."
                            />
                          </div>
                          <div className="col-span-4 flex items-center gap-1">
                            <span className="font-semibold text-black">Street:</span>
                            <input
                              type="text"
                              value={streetAddress}
                              onChange={(e) => setStreetAddress(e.target.value)}
                              className="w-full bg-transparent border-b border-neutral-300 px-0.5 text-black focus:outline-none font-medium"
                              placeholder="Preah Norodom Blvd"
                              title="Street Address"
                            />
                          </div>
                          <div className="col-span-5 flex items-center gap-1">
                            <span className="font-semibold text-black whitespace-nowrap">Commune / Sangkat:</span>
                            <input
                              type="text"
                              value={communeSangkat}
                              onChange={(e) => setCommuneSangkat(e.target.value)}
                              className="w-full bg-transparent border-b border-neutral-300 px-0.5 text-black focus:outline-none font-medium"
                              placeholder="Tonle Bassac"
                              title="Commune / Sangkat"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-12 gap-2 text-[11px] text-black">
                          <div className="col-span-5 flex items-center gap-1">
                            <span className="font-semibold text-black whitespace-nowrap">Town / District / Khan:</span>
                            <input
                              type="text"
                              value={townKhan}
                              onChange={(e) => setTownKhan(e.target.value)}
                              className="w-full bg-transparent border-b border-neutral-300 px-0.5 text-black focus:outline-none font-medium"
                              placeholder="Daun Penh"
                              title="Town / Khan"
                            />
                          </div>
                          <div className="col-span-4 flex items-center gap-1">
                            <span className="font-semibold text-black whitespace-nowrap">Province / City:</span>
                            <input
                              type="text"
                              value={provinceCity}
                              onChange={(e) => setProvinceCity(e.target.value)}
                              className="w-full bg-transparent border-b border-neutral-300 px-0.5 text-black focus:outline-none font-medium"
                              placeholder="Phnom Penh"
                              title="Province / City"
                            />
                          </div>
                          <div className="col-span-3 flex items-center gap-1">
                            <span className="font-semibold text-black">Telephone:</span>
                            <input
                              type="text"
                              value={companyTelephone}
                              onChange={(e) => setCompanyTelephone(e.target.value)}
                              className="w-full bg-transparent border-b border-neutral-300 px-0.5 text-black focus:outline-none font-mono font-medium"
                              placeholder="(+855) 23 888 999"
                              title="Direct Phone Contact"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-12 gap-2 text-[11px] text-black">
                          <div className="col-span-6 flex items-center gap-1">
                            <span className="font-semibold text-black whitespace-nowrap">Email:</span>
                            <input
                              type="email"
                              value={companyEmail}
                              onChange={(e) => setCompanyEmail(e.target.value)}
                              className="w-full bg-transparent border-b border-neutral-300 px-0.5 text-black focus:outline-none font-medium"
                              placeholder="reservations@royalpalacehotel.com"
                              title="Company Reservations & Manager Email"
                            />
                          </div>
                          <div className="col-span-6 flex items-center gap-1">
                            <span className="font-semibold text-black whitespace-nowrap">VAT ID / TIN:</span>
                            <input
                              type="text"
                              value={companyVatNumber}
                              onChange={(e) => setCompanyVatNumber(e.target.value)}
                              className="w-full bg-transparent border-b border-neutral-300 px-0.5 text-black focus:outline-none font-mono font-bold"
                              placeholder="K008-902401874"
                              title="Company VAT ID / Tax Identification Number (Synced from Hotel Settings)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t-2 border-black my-2.5 w-full"></div>

                    {/* 2. DOCUMENT TITLE */}
                    <div className="text-center my-3">
                      <h1 className="text-xl font-bold tracking-normal text-black uppercase">
                        Invoice
                      </h1>
                    </div>

                    {/* 3. CUSTOMER PROFILE & INVOICE DETAILS */}
                    <div className="grid grid-cols-12 gap-6 items-start my-3">
                      <div className="col-span-7 space-y-1.5 text-[11px]">
                        <div className="font-bold text-black text-xs mb-1">
                          Customer:
                        </div>
                        
                        <div className="flex items-end gap-1.5">
                          <span className="font-semibold text-black whitespace-nowrap">Company / Customer Name:</span>
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="flex-1 bg-transparent border-b border-dotted border-black px-1 font-bold text-black focus:outline-none text-[11px]"
                          />
                        </div>

                        <div className="flex items-end gap-1.5 pt-0.5">
                          <span className="font-semibold text-black whitespace-nowrap">Address:</span>
                          <input
                            type="text"
                            value={customerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                            className="flex-1 bg-transparent border-b border-dotted border-black px-1 text-black focus:outline-none text-[11px]"
                          />
                        </div>

                        <div className="flex items-end gap-1.5 pt-0.5">
                          <span className="font-semibold text-black whitespace-nowrap">Telephone No.:</span>
                          <input
                            type="text"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="flex-1 bg-transparent border-b border-dotted border-black px-1 font-mono text-black focus:outline-none text-[11px]"
                          />
                        </div>
                      </div>

                      <div className="col-span-5 space-y-2 text-[11px]">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold text-black whitespace-nowrap">Invoice Nº :</span>
                          <input
                            type="text"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            className="w-48 bg-transparent border-b border-black px-1 font-mono font-bold text-black focus:outline-none text-xs text-right"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <span className="font-semibold text-black tracking-wider">Date :</span>
                          <div className="flex items-center gap-0.5">
                            {dateDigits.map((digit, idx) => (
                              <input
                                key={idx}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => {
                                  const newDigits = [...dateDigits];
                                  newDigits[idx] = e.target.value;
                                  setDateDigits(newDigits);
                                }}
                                className="w-5 h-6 text-center border border-black text-xs font-mono font-bold text-black bg-white focus:outline-none focus:ring-1 focus:ring-black shadow-xs"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4. MAIN TABLE */}
                    <div className="my-4 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse border border-black">
                        <thead>
                          <tr className="border-b border-black text-black font-bold text-[11px] bg-white">
                            <th className="border-r border-black py-2 px-2 text-center w-12 tracking-wider">
                              No
                            </th>
                            <th className="border-r border-black py-2 px-3 tracking-wider">
                              Description
                            </th>
                            <th className="border-r border-black py-2 px-2 text-center w-24 tracking-wider">
                              Quantity
                            </th>
                            <th className="border-r border-black py-2 px-3 text-right w-36 tracking-wider">
                              Unit Price
                            </th>
                            <th className="py-2 px-3 text-right w-36 tracking-wider">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceItems.map((item) => (
                            <tr key={item.id} className="border-t border-black group">
                              <td className="border-r border-black py-2.5 px-2 text-center font-mono font-medium text-black">
                                {item.no}
                              </td>
                              <td className="border-r border-black py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => handleUpdateInvoiceItem(item.id, 'description', e.target.value)}
                                    className="w-full font-medium text-black bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-black focus:outline-none text-xs"
                                  />
                                  {invoiceItems.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveInvoiceItem(item.id)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-rose-600 print:hidden p-0.5"
                                      title="Remove item"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="border-r border-black py-2 px-2 text-center font-mono">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateInvoiceItem(item.id, 'quantity', e.target.value)}
                                  className="w-full text-center bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-black focus:outline-none font-bold text-xs"
                                />
                              </td>
                              <td className="border-r border-black py-2 px-3 text-right font-mono">
                                <div className="flex items-center justify-between">
                                  <span className="text-black font-semibold">$</span>
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={item.unitPrice}
                                    onChange={(e) => handleUpdateInvoiceItem(item.id, 'unitPrice', e.target.value)}
                                    className="w-24 text-right bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-black focus:outline-none text-xs font-semibold"
                                  />
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-black">
                                <div className="flex items-center justify-between">
                                  <span className="text-black font-semibold">$</span>
                                  <span>{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              </td>
                            </tr>
                          ))}

                          {/* CONNECTED TOTALS ROWS */}
                          <tr className="border-t border-black">
                            <td colSpan={3} rowSpan={3} className="border-r border-black p-3 align-middle bg-white">
                              <div className="flex items-center gap-1.5 text-xs text-black pl-2">
                                <span className="font-semibold text-black">Exchange Rate:</span>
                                <input
                                  type="number"
                                  value={exchangeRate}
                                  onChange={(e) => setExchangeRate(Number(e.target.value))}
                                  className="w-16 bg-transparent border-b border-black px-1 font-mono font-bold text-black focus:outline-none"
                                />
                              </div>
                            </td>
                            <td className="border-r border-black py-2 px-3 text-right font-semibold text-black">
                              Sub Total
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-black">
                              <div className="flex items-center justify-between">
                                <span className="text-black font-semibold">$</span>
                                <span>{invoiceSubTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            </td>
                          </tr>

                          <tr className="border-t border-black">
                            <td className="border-r border-black py-2 px-3 text-right font-bold text-black">
                              Grand Total
                            </td>
                            <td className="py-2 px-3 font-mono font-black text-right text-black">
                              <div className="flex items-center justify-between">
                                <span className="text-black font-semibold">$</span>
                                <span>{invoiceGrandTotalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            </td>
                          </tr>

                          <tr className="border-t border-black">
                            <td className="border-r border-black py-2 px-3 text-right font-semibold text-black">
                              Grand Total in KHR
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-right text-black">
                              <div className="flex items-center justify-end gap-1">
                                <span>{invoiceGrandTotalKHR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <span> </span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* 6. SIGNATURES */}
                    <div className="grid grid-cols-2 gap-12 pt-14 pb-8 text-center text-xs">
                      <div className="space-y-2">
                        <div className="w-56 mx-auto border-b border-black"></div>
                        <input
                          type="text"
                          value={customerSignerName}
                          onChange={(e) => setCustomerSignerName(e.target.value)}
                          className="w-full text-center bg-transparent border-none font-medium text-black text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="w-56 mx-auto border-b border-black"></div>
                        <input
                          type="text"
                          value={sellerSignerName}
                          onChange={(e) => setSellerSignerName(e.target.value)}
                          className="w-full text-center bg-transparent border-none font-medium text-black text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* 7. FOOTER NOTE */}
                    <div className="pt-4 border-t border-neutral-300 text-left text-[11px] text-neutral-800 space-y-0.5">
                      <div>
                        <span className="font-bold text-black">Note:</span> Original Invoice for customer , Copied Invoice for seller
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
