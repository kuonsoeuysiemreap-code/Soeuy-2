import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Download, 
  Calendar, 
  DollarSign, 
  FileText, 
  Building2, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Moon, 
  CreditCard, 
  Coins, 
  ShieldCheck,
  ChevronDown,
  X,
  Ban,
  Trash2,
  Search,
  Filter,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import { Room, Transaction, UserSettings } from '../types';
import { AuthUser } from './PMSActionModals';
import { formatCurrency, playChime } from '../utils/helpers';

export interface NightAuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  transactions: Transaction[];
  settings: UserSettings;
  businessDate?: string;
  currentUser?: AuthUser;
  initialTab?: 'summary' | 'room_trial' | 'cashier' | 'kpis' | 'cancel_delete';
  initialMonth?: string;
  onUpdateExchangeRate?: (rate: number) => void;
}

export const NightAuditReportModal: React.FC<NightAuditReportModalProps> = ({
  isOpen,
  onClose,
  rooms,
  transactions,
  settings,
  businessDate = '2026-08-29',
  currentUser,
  initialTab = 'summary',
  initialMonth,
  onUpdateExchangeRate,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(businessDate);
  const [reportTab, setReportTab] = useState<'summary' | 'room_trial' | 'cashier' | 'kpis' | 'cancel_delete'>(initialTab);
  const [exchangeRate, setExchangeRate] = useState<number>(
    settings.exchangeRateUSDToKHR || settings.exchangeRateKHR || 4100
  );
  const [isEditingRate, setIsEditingRate] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Cancel & Delete Report State (Select by Month)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (initialMonth) return initialMonth;
    return businessDate ? businessDate.slice(0, 7) : '2026-08';
  });
  const [cancelDeleteFilter, setCancelDeleteFilter] = useState<'all' | 'cancel' | 'delete'>('all');
  const [cancelDeleteSearch, setCancelDeleteSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(businessDate);
      if (initialTab) {
        setReportTab(initialTab);
      }
      if (initialMonth) {
        setSelectedMonth(initialMonth);
      } else if (businessDate) {
        setSelectedMonth(businessDate.slice(0, 7));
      }
    }
  }, [isOpen, businessDate, initialTab, initialMonth]);

  useEffect(() => {
    setExchangeRate(settings.exchangeRateUSDToKHR || settings.exchangeRateKHR || 4100);
  }, [settings.exchangeRateUSDToKHR, settings.exchangeRateKHR]);

  if (!isOpen) return null;

  const handleRateChange = (newRate: number) => {
    if (newRate > 0 && !isNaN(newRate)) {
      setExchangeRate(newRate);
      if (onUpdateExchangeRate) {
        onUpdateExchangeRate(newRate);
      }
    }
  };

  // Occupancy metrics
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied');
  const availableRooms = rooms.filter((r) => r.status === 'available');
  const maintenanceRooms = rooms.filter((r) => r.status === 'maintenance');
  const cleaningRooms = rooms.filter((r) => r.status === 'cleaning');

  const totalGuests = occupiedRooms.reduce((acc, r) => acc + (r.guestsCount || 1), 0);
  const occupancyRate = totalRooms > 0 ? (occupiedRooms.length / totalRooms) * 100 : 0;

  // Revenue metrics
  const roomRevenue = occupiedRooms.reduce((acc, r) => acc + r.pricePerNight, 0);
  const adr = occupiedRooms.length > 0 ? roomRevenue / occupiedRooms.length : 0;
  const revPar = totalRooms > 0 ? roomRevenue / totalRooms : 0;

  // Extra revenue items from transactions today
  const incomeTx = transactions.filter((t) => t.type === 'income');
  const fbRevenue = incomeTx
    .filter((t) => t.category.toLowerCase().includes('food') || t.category.toLowerCase().includes('restaurant') || t.category.toLowerCase().includes('dining') || t.category.toLowerCase().includes('bar'))
    .reduce((acc, t) => acc + t.amount, 0);

  const minibarRevenue = incomeTx
    .filter((t) => t.category.toLowerCase().includes('minibar') || t.category.toLowerCase().includes('beverage') || t.category.toLowerCase().includes('pos'))
    .reduce((acc, t) => acc + t.amount, 0);

  const spaAndExtraRevenue = incomeTx
    .filter((t) => t.category.toLowerCase().includes('spa') || t.category.toLowerCase().includes('laundry') || t.category.toLowerCase().includes('transport') || t.category.toLowerCase().includes('tour') || t.category.toLowerCase().includes('service'))
    .reduce((acc, t) => acc + t.amount, 0);

  const totalDepartmentalRevenue = roomRevenue + fbRevenue + minibarRevenue + spaAndExtraRevenue;
  const taxCollected = (totalDepartmentalRevenue * settings.taxRatePercent) / 100;
  const totalGrossDailyRevenue = totalDepartmentalRevenue + taxCollected;

  // Dual Currency calculations (KHR)
  const grossDailyRevenueKHR = totalGrossDailyRevenue * exchangeRate;
  const roomRevenueKHR = roomRevenue * exchangeRate;
  const taxCollectedKHR = taxCollected * exchangeRate;

  // Payment Settlements Breakdown
  const cashPayments = incomeTx.filter((t) => t.paymentMethod === 'cash').reduce((acc, t) => acc + t.amount, 0);
  const cardPayments = incomeTx.filter((t) => t.paymentMethod === 'card').reduce((acc, t) => acc + t.amount, 0);
  const transferPayments = incomeTx.filter((t) => t.paymentMethod === 'bank_transfer').reduce((acc, t) => acc + t.amount, 0);
  const totalPaymentsCollected = cashPayments + cardPayments + transferPayments;

  // Guest Ledger Balance (Outstanding folios)
  const guestLedgerBalance = occupiedRooms.reduce((acc, r) => {
    const totalRoomBill = r.pricePerNight * 1.1; // estimate with tax
    return acc + totalRoomBill;
  }, 0);

  // -------------------------------------------------------------
  // CANCEL & DELETE TRANSACTIONS (MONTHLY AUDIT & REPORT 1)
  // -------------------------------------------------------------
  const allCancelDeleteTransactions = transactions.filter((t) => {
    return (
      t.category === 'Reservation Cancellation' ||
      t.category === 'Reservation Deletion' ||
      t.actionType === 'cancel' ||
      t.actionType === 'delete' ||
      t.invoiceNumber.startsWith('CAN-') ||
      t.invoiceNumber.startsWith('DEL-') ||
      (t.type === 'refund' && (t.description.toLowerCase().includes('cancel') || t.description.toLowerCase().includes('delete')))
    );
  });

  // Extract unique available months from transactions
  const detectedMonths: string[] = Array.from(
    new Set<string>(
      allCancelDeleteTransactions
        .map((t) => (t.date ? t.date.slice(0, 7) : ''))
        .filter(Boolean)
        .concat(['2026-08', '2026-09'])
    )
  ).sort().reverse();

  // Filter by selected month, action type, and search query
  const filteredCancelDeleteTransactions = allCancelDeleteTransactions.filter((t) => {
    // 1. Month filter
    if (selectedMonth && selectedMonth !== 'all') {
      if (!t.date || !t.date.startsWith(selectedMonth)) {
        return false;
      }
    }
    // 2. Action filter (Guest Cancel vs Delete)
    const isDeletion = 
      t.category === 'Reservation Deletion' || 
      t.actionType === 'delete' || 
      t.invoiceNumber.startsWith('DEL-') || 
      t.description.toLowerCase().includes('delete');

    if (cancelDeleteFilter === 'cancel' && isDeletion) return false;
    if (cancelDeleteFilter === 'delete' && !isDeletion) return false;

    // 3. Search query
    if (cancelDeleteSearch.trim()) {
      const q = cancelDeleteSearch.toLowerCase().trim();
      const match =
        (t.guestOrVendor && t.guestOrVendor.toLowerCase().includes(q)) ||
        (t.roomNumber && t.roomNumber.toLowerCase().includes(q)) ||
        (t.invoiceNumber && t.invoiceNumber.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        (t.cancellationReason && t.cancellationReason.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Monthly summary metrics
  const monthlyCancellations = filteredCancelDeleteTransactions.filter((t) => {
    return !(
      t.category === 'Reservation Deletion' || 
      t.actionType === 'delete' || 
      t.invoiceNumber.startsWith('DEL-') || 
      t.description.toLowerCase().includes('delete')
    );
  });

  const monthlyDeletions = filteredCancelDeleteTransactions.filter((t) => {
    return (
      t.category === 'Reservation Deletion' || 
      t.actionType === 'delete' || 
      t.invoiceNumber.startsWith('DEL-') || 
      t.description.toLowerCase().includes('delete')
    );
  });

  const totalMonthlyCancelAmount = monthlyCancellations.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalMonthlyDeleteAmount = monthlyDeletions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalMonthlyImpactUSD = totalMonthlyCancelAmount + totalMonthlyDeleteAmount;
  const totalMonthlyImpactKHR = totalMonthlyImpactUSD * exchangeRate;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (reportTab === 'cancel_delete') {
      const monthLabel = selectedMonth === 'all' ? 'All_Months' : selectedMonth;
      const csvRows = [
        ['HOTEL PMS - CANCELLATION & DELETION TRANSACTION REPORT', settings.hotelName],
        ['Report Period (Month)', monthLabel],
        ['Run Timestamp', new Date().toLocaleString()],
        ['Auditor / Operator', currentUser?.fullName || 'System Administrator'],
        ['Exchange Rate', `1 USD = ${exchangeRate} KHR`],
        [],
        ['--- SUMMARY FOR PERIOD ---'],
        ['Guest Cancellations Count', monthlyCancellations.length],
        ['Guest Cancellations Total ($)', `$${totalMonthlyCancelAmount.toFixed(2)}`],
        ['Guest Cancellations Total (KHR)', `${(totalMonthlyCancelAmount * exchangeRate).toLocaleString()} ៛`],
        ['Deletions Count', monthlyDeletions.length],
        ['Deletions Total ($)', `$${totalMonthlyDeleteAmount.toFixed(2)}`],
        ['Deletions Total (KHR)', `${(totalMonthlyDeleteAmount * exchangeRate).toLocaleString()} ៛`],
        ['Total Impact ($)', `$${totalMonthlyImpactUSD.toFixed(2)}`],
        ['Total Impact (KHR)', `${totalMonthlyImpactKHR.toLocaleString()} ៛`],
        [],
        ['--- DETAILED TRANSACTIONS ---'],
        ['Date', 'Voucher #', 'Action', 'Room #', 'Guest Name', 'Reason / Audit Notes', 'Amount ($)', 'Amount (KHR)', 'Payment / Refund Mode', 'Operator', 'Status']
      ];

      filteredCancelDeleteTransactions.forEach((t) => {
        const isDel = 
          t.category === 'Reservation Deletion' || 
          t.actionType === 'delete' || 
          t.invoiceNumber.startsWith('DEL-') || 
          t.description.toLowerCase().includes('delete');
        const amt = t.amount || 0;
        csvRows.push([
          t.date,
          t.invoiceNumber,
          isDel ? 'Delete' : 'Guest Cancel',
          t.roomNumber || 'N/A',
          t.guestOrVendor || 'Guest',
          t.cancellationReason || t.notes || t.description,
          `$${amt.toFixed(2)}`,
          `${(amt * exchangeRate).toLocaleString()} ៛`,
          t.paymentMethod || 'Cash',
          t.operatorName || 'Front Desk Operator',
          t.status || 'refunded'
        ]);
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Cancellation_Deletion_Report_${monthLabel}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const csvRows = [
      ['HOTEL NIGHT AUDIT CLOSING REPORT', settings.hotelName],
      ['Business Date', selectedDate],
      ['Audit Timestamp', new Date().toLocaleString()],
      ['Auditor / Manager', currentUser?.fullName || 'System Administrator'],
      ['Exchange Rate', `1 USD = ${exchangeRate} KHR`],
      [],
      ['--- OCCUPANCY SUMMARY ---'],
      ['Total Rooms', totalRooms],
      ['Occupied Rooms', occupiedRooms.length],
      ['Available Rooms', availableRooms.length],
      ['Maintenance Rooms', maintenanceRooms.length],
      ['Occupancy %', `${occupancyRate.toFixed(1)}%`],
      ['ADR (Avg Daily Rate)', `$${adr.toFixed(2)}`],
      ['RevPAR', `$${revPar.toFixed(2)}`],
      ['In-House Guests', totalGuests],
      [],
      ['--- DAILY REVENUE BREAKDOWN ---', 'USD ($)', 'KHR (៛)'],
      ['Room Revenue', `$${roomRevenue.toFixed(2)}`, `${roomRevenueKHR.toLocaleString()} ៛`],
      ['F&B / Dining Revenue', `$${fbRevenue.toFixed(2)}`, `${(fbRevenue * exchangeRate).toLocaleString()} ៛`],
      ['Minibar & POS Sales', `$${minibarRevenue.toFixed(2)}`, `${(minibarRevenue * exchangeRate).toLocaleString()} ៛`],
      ['Spa, Laundry & Extra Services', `$${spaAndExtraRevenue.toFixed(2)}`, `${(spaAndExtraRevenue * exchangeRate).toLocaleString()} ៛`],
      ['Taxes (VAT 10%)', `$${taxCollected.toFixed(2)}`, `${taxCollectedKHR.toLocaleString()} ៛`],
      ['TOTAL GROSS DAILY REVENUE', `$${totalGrossDailyRevenue.toFixed(2)}`, `${grossDailyRevenueKHR.toLocaleString()} ៛`],
      [],
      ['--- CASHIER SETTLEMENT SUMMARY ---'],
      ['Cash Settlements', `$${cashPayments.toFixed(2)}`],
      ['Credit Card Settlements', `$${cardPayments.toFixed(2)}`],
      ['ABA / Bank Transfers', `$${transferPayments.toFixed(2)}`],
      ['Total Settlements Collected', `$${totalPaymentsCollected.toFixed(2)}`],
      [],
      ['--- ROOM-BY-ROOM AUDIT TRIAL ---'],
      ['Room No', 'Type', 'Guest Name', 'Status', 'Nightly Rate ($)', 'Tax ($)', 'Total Daily Charge ($)']
    ];

    occupiedRooms.forEach((r) => {
      const roomTax = (r.pricePerNight * settings.taxRatePercent) / 100;
      csvRows.push([
        r.number,
        r.type.toUpperCase(),
        r.guestName || 'In-House Guest',
        r.status,
        `$${r.pricePerNight.toFixed(2)}`,
        `$${roomTax.toFixed(2)}`,
        `$${(r.pricePerNight + roomTax).toFixed(2)}`
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Night_Audit_Closing_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 md:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-[#f4f7fb] text-[#1c2d42] rounded-lg shadow-2xl border-2 border-[#5b8ec5] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* TOP TITLE BAR */}
        <div className="bg-gradient-to-r from-[#1e3a5f] via-[#244c7d] to-[#1e3a5f] text-white px-4 py-2 flex items-center justify-between shadow-md border-b border-[#0f243e]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-500/30 border border-blue-300/40 flex items-center justify-center">
              <Moon className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-bold tracking-wide flex items-center gap-2">
                DAILY NIGHT AUDIT CLOSING REPORT (MANAGER'S FLASH)
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono font-semibold">
                  EOD BALANCED
                </span>
              </h3>
              <p className="text-[11px] text-blue-200">
                {settings.hotelName} • Property Code: #KHM-REP • End of Day Daily Closing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-xs text-white font-medium transition-colors cursor-pointer"
              title="Export as CSV Spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-blue-200" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-500 hover:bg-blue-600 border border-blue-400 rounded text-xs text-white font-bold transition-colors cursor-pointer shadow-xs"
              title="Print Daily Closing Flash Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded bg-white/10 hover:bg-red-600 text-white text-base font-bold transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CONTROLS SUBHEADER (Date Selector, Tab Filter, Exchange Rate) */}
        <div className="bg-[#e9eff6] border-b border-[#cbd5e1] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-[#cbd5e1] shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-semibold text-neutral-700">Audit Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="font-mono text-xs font-bold text-blue-950 bg-transparent outline-none cursor-pointer"
              />
            </div>

            {/* Interactive Editable Exchange Rate */}
            <div className="flex items-center gap-1.5 text-neutral-800 bg-amber-50/90 px-2.5 py-1 rounded border border-amber-300 font-mono text-[11px] shadow-2xs">
              <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-bold text-neutral-700">Exchange Rate:</span>
              <span className="text-neutral-500 font-semibold">$1 =</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1000"
                  max="10000"
                  step="5"
                  value={exchangeRate}
                  onChange={(e) => handleRateChange(Number(e.target.value))}
                  className="w-16 text-center font-bold font-mono text-blue-900 bg-white border border-amber-400 rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  title="Edit USD to KHR Exchange Rate (updates all report figures live)"
                />
                <span className="font-bold text-amber-800">៛ KHR</span>
              </div>
              <div className="hidden lg:flex items-center gap-1 ml-1 border-l border-amber-200 pl-1.5">
                {[4015, 4100, 4120, 4150].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleRateChange(preset)}
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                      exchangeRate === preset
                        ? 'bg-amber-500 text-white font-bold'
                        : 'bg-white hover:bg-amber-100 text-neutral-700 border border-amber-200'
                    }`}
                    title={`Set Exchange Rate to ${preset.toLocaleString()} KHR`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Report Sub-Tabs */}
          <div className="flex items-center gap-1 bg-[#dbe6f3] p-0.5 rounded border border-[#b8cee4]">
            <button
              type="button"
              onClick={() => setReportTab('summary')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                reportTab === 'summary'
                  ? 'bg-white text-blue-950 shadow-xs border border-[#94a3b8]'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Executive Flash
            </button>
            <button
              type="button"
              onClick={() => setReportTab('room_trial')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                reportTab === 'room_trial'
                  ? 'bg-white text-blue-950 shadow-xs border border-[#94a3b8]'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Room Audit Trial ({occupiedRooms.length})
            </button>
            <button
              type="button"
              onClick={() => setReportTab('cashier')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                reportTab === 'cashier'
                  ? 'bg-white text-blue-950 shadow-xs border border-[#94a3b8]'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Cashiering & Settlements
            </button>
            <button
              type="button"
              onClick={() => setReportTab('kpis')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                reportTab === 'kpis'
                  ? 'bg-white text-blue-950 shadow-xs border border-[#94a3b8]'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              KPIs & Yield Matrix
            </button>
            <button
              type="button"
              id="btn-report-tab-cancel-delete"
              onClick={() => setReportTab('cancel_delete')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                reportTab === 'cancel_delete'
                  ? 'bg-[#fee2e2] text-red-950 shadow-xs border border-red-300 font-bold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <Ban className="w-3.5 h-3.5 text-red-600" />
              <span>Cancel & Delete Report</span>
              {allCancelDeleteTransactions.length > 0 && (
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold font-mono ${
                  reportTab === 'cancel_delete' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'
                }`}>
                  {allCancelDeleteTransactions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT BODY */}
        <div ref={printRef} className="p-4 md:p-6 overflow-y-auto space-y-4 flex-1 bg-[#ffffff] text-neutral-800">
          
          {/* REPORT HEADER FORM */}
          <div className="border-b-2 border-neutral-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-base md:text-lg font-black tracking-tight text-neutral-900 uppercase">
                {settings.hotelName} — DAILY CLOSING AUDIT REPORT
              </h1>
              <p className="text-xs text-neutral-600 font-medium">
                Official Night Audit Balance Sheet & Manager Flash Summary
              </p>
            </div>
            <div className="text-left sm:text-right font-mono text-[11px] space-y-0.5">
              <div><strong>Business Date:</strong> {selectedDate}</div>
              <div><strong>Run Time:</strong> {new Date().toLocaleTimeString()} (Terminal 01)</div>
              <div><strong>Auditor:</strong> <span className="text-blue-900 font-bold">{currentUser?.fullName || 'Administrator'}</span></div>
            </div>
          </div>

          {/* 4 HIGH-LEVEL KPI STAT TILES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100/70 border border-blue-200 rounded">
              <div className="flex items-center justify-between text-blue-900 text-xs font-bold uppercase tracking-wider mb-1">
                <span>Occupancy Rate</span>
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl md:text-2xl font-black text-blue-950 font-mono">
                {occupancyRate.toFixed(1)}%
              </div>
              <div className="text-[11px] text-blue-700 font-medium mt-0.5">
                {occupiedRooms.length} of {totalRooms} rooms occupied
              </div>
            </div>

            <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100/70 border border-emerald-200 rounded">
              <div className="flex items-center justify-between text-emerald-900 text-xs font-bold uppercase tracking-wider mb-1">
                <span>Total Gross Daily Rev</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl md:text-2xl font-black text-emerald-950 font-mono">
                ${totalGrossDailyRevenue.toFixed(2)}
              </div>
              <div className="text-[11px] text-emerald-700 font-bold font-mono mt-0.5">
                {grossDailyRevenueKHR.toLocaleString()} ៛ KHR
              </div>
            </div>

            <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100/70 border border-purple-200 rounded">
              <div className="flex items-center justify-between text-purple-900 text-xs font-bold uppercase tracking-wider mb-1">
                <span>ADR (Avg Daily Rate)</span>
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl md:text-2xl font-black text-purple-950 font-mono">
                ${adr.toFixed(2)}
              </div>
              <div className="text-[11px] text-purple-700 font-medium mt-0.5">
                RevPAR: <strong>${revPar.toFixed(2)}</strong>
              </div>
            </div>

            <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100/70 border border-amber-200 rounded">
              <div className="flex items-center justify-between text-amber-900 text-xs font-bold uppercase tracking-wider mb-1">
                <span>Total In-House Guests</span>
                <Users className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl md:text-2xl font-black text-amber-950 font-mono">
                {totalGuests} <span className="text-xs font-normal">Persons</span>
              </div>
              <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                {availableRooms.length} rooms ready for check-in
              </div>
            </div>
          </div>

          {/* TAB 1: EXECUTIVE FLASH / SUMMARY */}
          {reportTab === 'summary' && (
            <div className="space-y-4">
              
              {/* TWO COLUMN REVENUE & OCCUPANCY BALANCES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Daily Revenue Breakdown Table */}
                <div className="border border-neutral-300 rounded overflow-hidden shadow-2xs">
                  <div className="bg-[#1e3a5f] text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                    <span className="uppercase tracking-wide">1. Daily Revenue Posting Journal</span>
                    <span className="font-mono text-[10px] text-blue-200">USD / KHR</span>
                  </div>
                  <table className="w-full text-xs text-left border-collapse">
                    <tbody className="divide-y divide-neutral-200">
                      <tr className="hover:bg-neutral-50">
                        <td className="px-3 py-2 font-medium text-neutral-800">Room Revenue (Lodging)</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-neutral-900">${roomRevenue.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono text-[11px] text-neutral-600">{roomRevenueKHR.toLocaleString()} ៛</td>
                      </tr>
                      <tr className="hover:bg-neutral-50">
                        <td className="px-3 py-2 font-medium text-neutral-800">Food & Beverage / Restaurant</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-neutral-900">${fbRevenue.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono text-[11px] text-neutral-600">{(fbRevenue * exchangeRate).toLocaleString()} ៛</td>
                      </tr>
                      <tr className="hover:bg-neutral-50">
                        <td className="px-3 py-2 font-medium text-neutral-800">Minibar & POS Sales</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-neutral-900">${minibarRevenue.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono text-[11px] text-neutral-600">{(minibarRevenue * exchangeRate).toLocaleString()} ៛</td>
                      </tr>
                      <tr className="hover:bg-neutral-50">
                        <td className="px-3 py-2 font-medium text-neutral-800">Spa, Laundry & Airport Services</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-neutral-900">${spaAndExtraRevenue.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono text-[11px] text-neutral-600">{(spaAndExtraRevenue * exchangeRate).toLocaleString()} ៛</td>
                      </tr>
                      <tr className="bg-neutral-100/80 font-semibold text-neutral-900">
                        <td className="px-3 py-2">Net Departmental Revenue</td>
                        <td className="px-3 py-2 text-right font-mono font-bold">${totalDepartmentalRevenue.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono text-[11px]">{(totalDepartmentalRevenue * exchangeRate).toLocaleString()} ៛</td>
                      </tr>
                      <tr className="hover:bg-neutral-50">
                        <td className="px-3 py-2 font-medium text-neutral-800">Value Added Tax (VAT {settings.taxRatePercent}%)</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-amber-700">${taxCollected.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono text-[11px] text-amber-800">{taxCollectedKHR.toLocaleString()} ៛</td>
                      </tr>
                      <tr className="bg-[#e8f2fc] text-blue-950 font-black text-xs border-t-2 border-blue-900">
                        <td className="px-3 py-2.5 uppercase tracking-wide">TOTAL GROSS DAILY REVENUE</td>
                        <td className="px-3 py-2.5 text-right font-mono text-sm text-blue-950">${totalGrossDailyRevenue.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-blue-900">{grossDailyRevenueKHR.toLocaleString()} ៛</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. Room Statistics & Inventory Flash */}
                <div className="border border-neutral-300 rounded overflow-hidden shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="bg-[#1e3a5f] text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                      <span className="uppercase tracking-wide">2. Room Statistics & Inventory Status</span>
                      <span className="font-mono text-[10px] text-blue-200">Units / %</span>
                    </div>
                    <table className="w-full text-xs text-left border-collapse">
                      <tbody className="divide-y divide-neutral-200">
                        <tr className="hover:bg-neutral-50">
                          <td className="px-3 py-2 font-medium text-neutral-800">Total Hotel Room Capacity</td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-neutral-900">{totalRooms} Rooms</td>
                          <td className="px-3 py-2 text-right font-mono text-[11px] text-neutral-500">100.0%</td>
                        </tr>
                        <tr className="hover:bg-neutral-50">
                          <td className="px-3 py-2 font-medium text-neutral-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Occupied Rooms (In-House)
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-red-700">{occupiedRooms.length} Rooms</td>
                          <td className="px-3 py-2 text-right font-mono text-[11px] text-red-700 font-bold">{occupancyRate.toFixed(1)}%</td>
                        </tr>
                        <tr className="hover:bg-neutral-50">
                          <td className="px-3 py-2 font-medium text-neutral-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available Vacant Clean
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">{availableRooms.length} Rooms</td>
                          <td className="px-3 py-2 text-right font-mono text-[11px] text-neutral-500">
                            {totalRooms > 0 ? ((availableRooms.length / totalRooms) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                        <tr className="hover:bg-neutral-50">
                          <td className="px-3 py-2 font-medium text-neutral-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Cleaning / In-Progress
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-amber-700">{cleaningRooms.length} Rooms</td>
                          <td className="px-3 py-2 text-right font-mono text-[11px] text-neutral-500">
                            {totalRooms > 0 ? ((cleaningRooms.length / totalRooms) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                        <tr className="hover:bg-neutral-50">
                          <td className="px-3 py-2 font-medium text-neutral-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-neutral-400"></span> Out of Order / Maintenance
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-neutral-600">{maintenanceRooms.length} Rooms</td>
                          <td className="px-3 py-2 text-right font-mono text-[11px] text-neutral-500">
                            {totalRooms > 0 ? ((maintenanceRooms.length / totalRooms) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Bar inside container */}
                  <div className="p-3 bg-neutral-100 border-t border-neutral-300 flex items-center justify-between text-xs font-mono">
                    <span>Average Daily Rate (ADR): <strong>${adr.toFixed(2)}</strong></span>
                    <span>RevPAR: <strong>${revPar.toFixed(2)}</strong></span>
                  </div>
                </div>
              </div>

              {/* 3. CASHIERING & LEDGER BALANCES */}
              <div className="border border-neutral-300 rounded overflow-hidden shadow-2xs">
                <div className="bg-[#1e3a5f] text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                  <span className="uppercase tracking-wide">3. Front Office Cashiering & Ledger Balances</span>
                  <span className="font-mono text-[10px] text-blue-200">Shift Balances</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-200 text-xs">
                  <div className="p-3 space-y-1.5">
                    <div className="font-bold text-neutral-900 uppercase text-[11px]">Settlements Collected</div>
                    <div className="flex justify-between"><span>Cash (Drawer):</span> <strong className="font-mono">${cashPayments.toFixed(2)}</strong></div>
                    <div className="flex justify-between"><span>Credit Card POS:</span> <strong className="font-mono">${cardPayments.toFixed(2)}</strong></div>
                    <div className="flex justify-between"><span>ABA / Bank Transfers:</span> <strong className="font-mono">${transferPayments.toFixed(2)}</strong></div>
                    <div className="pt-1 border-t border-neutral-200 flex justify-between font-bold text-blue-900">
                      <span>Total Shift Collections:</span>
                      <span className="font-mono">${totalPaymentsCollected.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="p-3 space-y-1.5">
                    <div className="font-bold text-neutral-900 uppercase text-[11px]">Ledger Balances</div>
                    <div className="flex justify-between"><span>In-House Guest Ledger:</span> <strong className="font-mono text-amber-800">${guestLedgerBalance.toFixed(2)}</strong></div>
                    <div className="flex justify-between"><span>City Ledger (Direct Bill):</span> <strong className="font-mono">$0.00</strong></div>
                    <div className="flex justify-between"><span>Advance Deposit Ledger:</span> <strong className="font-mono text-emerald-800">$0.00</strong></div>
                    <div className="pt-1 border-t border-neutral-200 flex justify-between font-bold text-neutral-900">
                      <span>Total Active Receivables:</span>
                      <span className="font-mono">${guestLedgerBalance.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="p-3 space-y-1.5 bg-emerald-50/50">
                    <div className="font-bold text-emerald-950 uppercase text-[11px] flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Audit Verification Status
                    </div>
                    <p className="text-[11px] text-neutral-600 leading-tight">
                      All guest folios verified against room rate matrix. Dual tax rates applied. Night batch ready for final close.
                    </p>
                    <div className="pt-2 text-[10px] text-emerald-800 font-mono font-bold">
                      STATUS: BALANCED & CLOSED
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. RESERVATION CANCELLATIONS & DELETIONS SUMMARY */}
              <div className="border border-red-200 rounded overflow-hidden shadow-2xs bg-white">
                <div className="bg-[#881337] text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                  <span className="uppercase tracking-wide flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5 text-rose-300" />
                    4. Reservation Cancellations & Deletions Summary (Audit Month: {selectedMonth})
                  </span>
                  <button
                    type="button"
                    onClick={() => setReportTab('cancel_delete')}
                    className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-[10.5px] font-semibold transition-colors cursor-pointer flex items-center gap-1 text-white"
                  >
                    <span>Open Monthly Ledger</span>
                    <span>→</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-200 text-xs">
                  <div className="p-3 bg-amber-50/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-700 uppercase text-[10.5px]">Guest Cancellations</span>
                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-bold font-mono text-[10px]">
                        {monthlyCancellations.length} records
                      </span>
                    </div>
                    <div className="text-base font-black text-amber-900 font-mono">
                      ${totalMonthlyCancelAmount.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      {(totalMonthlyCancelAmount * exchangeRate).toLocaleString()} ៛ KHR
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-700 uppercase text-[10.5px]">Deleted Reservations</span>
                      <span className="px-1.5 py-0.2 bg-rose-100 text-rose-900 rounded font-bold font-mono text-[10px]">
                        {monthlyDeletions.length} records
                      </span>
                    </div>
                    <div className="text-base font-black text-rose-900 font-mono">
                      ${totalMonthlyDeleteAmount.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      {(totalMonthlyDeleteAmount * exchangeRate).toLocaleString()} ៛ KHR
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-700 uppercase text-[10.5px]">Total Value Impact</span>
                      <span className="px-1.5 py-0.2 bg-neutral-200 text-neutral-800 rounded font-bold font-mono text-[10px]">
                        {filteredCancelDeleteTransactions.length} Total
                      </span>
                    </div>
                    <div className="text-base font-black text-neutral-900 font-mono">
                      ${totalMonthlyImpactUSD.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      {totalMonthlyImpactKHR.toLocaleString()} ៛ KHR
                    </div>
                  </div>

                  <div className="p-3 flex flex-col justify-center items-start gap-1 bg-white">
                    <span className="text-[11px] text-neutral-600">
                      Audit tracking for all guest cancelled and operator deleted bookings with reasons and voucher numbers.
                    </span>
                    <button
                      type="button"
                      onClick={() => setReportTab('cancel_delete')}
                      className="mt-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-[11px] shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Ban className="w-3 h-3" />
                      <span>View Full Monthly Details</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ROOM-BY-ROOM AUDIT TRIAL */}
          {reportTab === 'room_trial' && (
            <div className="border border-neutral-300 rounded overflow-hidden shadow-2xs">
              <div className="bg-[#1e3a5f] text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                <span className="uppercase tracking-wide">Detailed Room Revenue & Tax Trial Balance</span>
                <span className="font-mono text-[10px] text-blue-200">{occupiedRooms.length} Active Folios</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#f0f4f9] text-neutral-700 border-b border-neutral-300 text-[11px]">
                    <tr>
                      <th className="px-3 py-2">Room #</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">In-House Guest</th>
                      <th className="px-3 py-2 text-center">Pax</th>
                      <th className="px-3 py-2 text-right">Room Rate</th>
                      <th className="px-3 py-2 text-right">Tax (10%)</th>
                      <th className="px-3 py-2 text-right">Total Daily Post</th>
                      <th className="px-3 py-2 text-right">KHR Equivalent</th>
                      <th className="px-3 py-2 text-center">Audit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {occupiedRooms.map((room) => {
                      const roomTax = (room.pricePerNight * settings.taxRatePercent) / 100;
                      const roomTotal = room.pricePerNight + roomTax;
                      const roomTotalKHR = roomTotal * exchangeRate;

                      return (
                        <tr key={room.id} className="hover:bg-blue-50/40 font-mono text-[11px]">
                          <td className="px-3 py-2 font-bold text-blue-900 font-sans">{room.number}</td>
                          <td className="px-3 py-2 uppercase font-sans text-neutral-600">{room.type}</td>
                          <td className="px-3 py-2 font-sans font-medium text-neutral-900">{room.guestName || 'In-House Guest'}</td>
                          <td className="px-3 py-2 text-center font-sans">{room.guestsCount || 1}</td>
                          <td className="px-3 py-2 text-right font-bold text-neutral-800">${room.pricePerNight.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right text-amber-800">${roomTax.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-bold text-emerald-800">${roomTotal.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right text-neutral-600">{roomTotalKHR.toLocaleString()} ៛</td>
                          <td className="px-3 py-2 text-center">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-sans font-bold text-[10px]">
                              Posted
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {occupiedRooms.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-neutral-500 font-sans">
                          No occupied rooms currently in-house.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {occupiedRooms.length > 0 && (
                    <tfoot className="bg-[#e8f2fc] text-blue-950 font-black border-t-2 border-blue-900 font-mono text-xs">
                      <tr>
                        <td colSpan={4} className="px-3 py-2.5 font-sans uppercase">Total Room Trial Posting</td>
                        <td className="px-3 py-2.5 text-right">${roomRevenue.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-right text-amber-900">${taxCollected.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-right text-emerald-950">${totalGrossDailyRevenue.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-right">{grossDailyRevenueKHR.toLocaleString()} ៛</td>
                        <td className="px-3 py-2.5 text-center font-sans text-emerald-800">100% OK</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CASHIERING & SETTLEMENTS */}
          {reportTab === 'cashier' && (
            <div className="border border-neutral-300 rounded overflow-hidden shadow-2xs">
              <div className="bg-[#1e3a5f] text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                <span className="uppercase tracking-wide">Shift Cashier & Payment Settlements Ledger</span>
                <span className="font-mono text-[10px] text-blue-200">{incomeTx.length} Transactions Logged</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#f0f4f9] text-neutral-700 border-b border-neutral-300 text-[11px]">
                    <tr>
                      <th className="px-3 py-2">Tx ID</th>
                      <th className="px-3 py-2">Description / Category</th>
                      <th className="px-3 py-2">Room / Folio</th>
                      <th className="px-3 py-2">Payment Method</th>
                      <th className="px-3 py-2 text-right">Amount (USD)</th>
                      <th className="px-3 py-2 text-right">Amount (KHR)</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {incomeTx.slice(0, 15).map((tx) => (
                      <tr key={tx.id} className="hover:bg-blue-50/40 text-[11px]">
                        <td className="px-3 py-2 font-mono text-neutral-500">{tx.id.substring(0, 8)}</td>
                        <td className="px-3 py-2 font-medium text-neutral-900">{tx.description || tx.category}</td>
                        <td className="px-3 py-2 font-mono text-blue-900">{tx.roomNumber ? `Room ${tx.roomNumber}` : 'General POS'}</td>
                        <td className="px-3 py-2 capitalize">
                          <span className="px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 font-mono text-[10px]">
                            {tx.paymentMethod.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-neutral-900">${tx.amount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono text-neutral-600">{(tx.amount * exchangeRate).toLocaleString()} ៛</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {incomeTx.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                          No transactions recorded for this business period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: KPIS & YIELD MATRIX */}
          {reportTab === 'kpis' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 bg-white border border-neutral-300 rounded shadow-2xs">
                  <div className="font-bold text-neutral-800 text-xs mb-1">Room Revenue vs Extra POS</div>
                  <div className="text-sm font-mono text-neutral-600">
                    Room: <strong>${roomRevenue.toFixed(2)}</strong> ({totalDepartmentalRevenue > 0 ? ((roomRevenue / totalDepartmentalRevenue) * 100).toFixed(0) : 0}%)
                  </div>
                  <div className="text-sm font-mono text-neutral-600">
                    Extra POS: <strong>${(fbRevenue + minibarRevenue + spaAndExtraRevenue).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-neutral-300 rounded shadow-2xs">
                  <div className="font-bold text-neutral-800 text-xs mb-1">Average Daily Spend per Guest</div>
                  <div className="text-2xl font-black text-blue-900 font-mono">
                    ${totalGuests > 0 ? (totalGrossDailyRevenue / totalGuests).toFixed(2) : '0.00'}
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono">
                    {totalGuests > 0 ? ((totalGrossDailyRevenue / totalGuests) * exchangeRate).toLocaleString() : 0} ៛ per guest
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-neutral-300 rounded shadow-2xs">
                  <div className="font-bold text-neutral-800 text-xs mb-1">Tax Audit Compliance</div>
                  <div className="text-sm font-mono text-emerald-800 font-bold">
                    VAT (10%): ${taxCollected.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    National dual-currency tax reporting standard
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CANCELLATIONS & DELETIONS TRANSACTION REPORT (MONTHLY) */}
          {reportTab === 'cancel_delete' && (
            <div className="space-y-4">
              
              {/* TOP MONTH SELECTION & FILTER TOOLBAR */}
              <div className="bg-[#f8fafc] p-3.5 rounded-lg border border-[#cbd5e1] shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-red-100 border border-red-200 flex items-center justify-center text-red-700">
                      <Ban className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs md:text-sm font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                        RESERVATION CANCELLATION & DELETION AUDIT JOURNAL
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 font-mono font-semibold">
                          REPORT 1
                        </span>
                      </h4>
                      <p className="text-[11px] text-neutral-600">
                        Tracks all booking cancellations and purged records with voucher IDs, reasons, and dual-currency figures.
                      </p>
                    </div>
                  </div>

                  {/* Monthly Export & Print buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-300 rounded text-xs font-semibold text-neutral-800 shadow-2xs transition-colors cursor-pointer"
                      title="Download Monthly Cancel & Delete CSV Spreadsheet"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <span>Export Monthly CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      title="Print Monthly Cancellation & Deletion Report"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Monthly Report</span>
                    </button>
                  </div>
                </div>

                {/* FILTERS ROW: Month Selector, Quick Months, Action Filter, Search */}
                <div className="pt-2 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  {/* Month Selection Control */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-neutral-300 shadow-2xs">
                      <Calendar className="w-3.5 h-3.5 text-red-600" />
                      <span className="font-bold text-neutral-700">Select Month:</span>
                      <input
                        type="month"
                        value={selectedMonth === 'all' ? '' : selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value || 'all')}
                        className="font-mono text-xs font-bold text-red-950 bg-transparent outline-none cursor-pointer"
                        title="Filter transactions by specific Year and Month"
                      />
                    </div>

                    {/* Quick Month Selectors */}
                    <div className="flex items-center gap-1">
                      {detectedMonths.map((m) => {
                        const [year, month] = m.split('-');
                        const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('default', { month: 'short' });
                        const isSelected = selectedMonth === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setSelectedMonth(m)}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-red-600 text-white font-bold shadow-2xs'
                                : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300'
                            }`}
                          >
                            {monthName} {year}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setSelectedMonth('all')}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                          selectedMonth === 'all'
                            ? 'bg-neutral-800 text-white font-bold shadow-2xs'
                            : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300'
                        }`}
                      >
                        All Months
                      </button>
                    </div>
                  </div>

                  {/* Action Type Filter & Search Query */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Action Type Filter */}
                    <div className="flex items-center gap-1 bg-[#e2e8f0] p-0.5 rounded border border-neutral-300">
                      <button
                        type="button"
                        onClick={() => setCancelDeleteFilter('all')}
                        className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${
                          cancelDeleteFilter === 'all'
                            ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        All Actions ({allCancelDeleteTransactions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelDeleteFilter('cancel')}
                        className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${
                          cancelDeleteFilter === 'cancel'
                            ? 'bg-[#fff1f2] text-amber-900 border border-amber-300 font-bold shadow-2xs'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        Guest Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelDeleteFilter('delete')}
                        className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${
                          cancelDeleteFilter === 'delete'
                            ? 'bg-[#fee2e2] text-red-950 border border-red-300 font-bold shadow-2xs'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        Delete
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Search guest, room, voucher..."
                        value={cancelDeleteSearch}
                        onChange={(e) => setCancelDeleteSearch(e.target.value)}
                        className="pl-7 pr-2.5 py-1 bg-white border border-neutral-300 rounded text-xs w-44 md:w-56 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* MONTHLY SUMMARY METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Guest Cancellations */}
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                      <Ban className="w-3.5 h-3.5 text-amber-700" />
                      Guest Cancellations ({selectedMonth === 'all' ? 'All Months' : selectedMonth})
                    </span>
                    <span className="px-1.5 py-0.2 bg-amber-200/70 text-amber-950 rounded font-mono font-bold text-[10px]">
                      {monthlyCancellations.length} Bookings
                    </span>
                  </div>
                  <div className="text-xl font-black text-amber-900 font-mono">
                    ${totalMonthlyCancelAmount.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-amber-800 font-mono">
                    {(totalMonthlyCancelAmount * exchangeRate).toLocaleString()} ៛ KHR
                  </div>
                  <div className="text-[10px] text-neutral-500 pt-1 border-t border-amber-200/60">
                    Released room inventory back to available status
                  </div>
                </div>

                {/* 2. Deletions */}
                <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-950 uppercase tracking-wide flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                      Deleted Reservations ({selectedMonth === 'all' ? 'All Months' : selectedMonth})
                    </span>
                    <span className="px-1.5 py-0.2 bg-rose-200/70 text-rose-950 rounded font-mono font-bold text-[10px]">
                      {monthlyDeletions.length} Purged
                    </span>
                  </div>
                  <div className="text-xl font-black text-rose-900 font-mono">
                    ${totalMonthlyDeleteAmount.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-rose-800 font-mono">
                    {(totalMonthlyDeleteAmount * exchangeRate).toLocaleString()} ៛ KHR
                  </div>
                  <div className="text-[10px] text-neutral-500 pt-1 border-t border-rose-200/60">
                    Permanently removed records tracked for audit trail
                  </div>
                </div>

                {/* 3. Total Combined Impact */}
                <div className="p-3 bg-[#f8fafc] border border-neutral-300 rounded-lg shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-800 uppercase tracking-wide flex items-center gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5 text-blue-700" />
                      Total Released Revenue Value
                    </span>
                    <span className="px-1.5 py-0.2 bg-neutral-200 text-neutral-800 rounded font-mono font-bold text-[10px]">
                      {filteredCancelDeleteTransactions.length} Total Records
                    </span>
                  </div>
                  <div className="text-xl font-black text-neutral-900 font-mono">
                    ${totalMonthlyImpactUSD.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-blue-900 font-mono font-bold">
                    {totalMonthlyImpactKHR.toLocaleString()} ៛ KHR
                  </div>
                  <div className="text-[10px] text-neutral-500 pt-1 border-t border-neutral-200">
                    Converted at 1 USD = {exchangeRate.toLocaleString()} KHR
                  </div>
                </div>
              </div>

              {/* MONTHLY TRANSACTION JOURNAL TABLE */}
              <div className="border border-neutral-300 rounded-lg overflow-hidden shadow-2xs">
                <div className="bg-[#1e3a5f] text-white px-3 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2">
                  <span className="uppercase tracking-wide flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-300" />
                    Month Transaction Ledger: {selectedMonth === 'all' ? 'All Months' : selectedMonth}
                    <span className="text-[10.5px] font-mono text-blue-200 font-normal">
                      ({filteredCancelDeleteTransactions.length} transactions matched)
                    </span>
                  </span>
                  <div className="text-[11px] font-mono text-blue-100 flex items-center gap-2">
                    <span>Audit Batch: Active</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#f0f4f9] text-neutral-700 border-b border-neutral-300 text-[11px]">
                      <tr>
                        <th className="px-3 py-2.5 font-bold">Date</th>
                        <th className="px-3 py-2.5 font-bold">Voucher #</th>
                        <th className="px-3 py-2.5 font-bold text-center">Action</th>
                        <th className="px-3 py-2.5 font-bold">Room #</th>
                        <th className="px-3 py-2.5 font-bold">Guest Name</th>
                        <th className="px-3 py-2.5 font-bold">Cancellation / Deletion Reason</th>
                        <th className="px-3 py-2.5 font-bold text-right">Amount ($)</th>
                        <th className="px-3 py-2.5 font-bold text-right">Amount (KHR)</th>
                        <th className="px-3 py-2.5 font-bold text-center">Payment Mode</th>
                        <th className="px-3 py-2.5 font-bold">Operator</th>
                        <th className="px-3 py-2.5 font-bold text-center">Audit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {filteredCancelDeleteTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="px-4 py-8 text-center bg-neutral-50 text-neutral-500">
                            <div className="max-w-md mx-auto space-y-2">
                              <Ban className="w-8 h-8 text-neutral-400 mx-auto" />
                              <div className="font-bold text-neutral-700 text-sm">
                                No Cancel or Delete Transactions Found
                              </div>
                              <p className="text-xs text-neutral-500">
                                No cancellation or deletion transactions recorded for month <strong>{selectedMonth}</strong>.
                              </p>
                              <div className="pt-2 flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedMonth('all')}
                                  className="px-3 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 rounded font-semibold text-xs text-neutral-800 shadow-2xs cursor-pointer"
                                >
                                  View All Months
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredCancelDeleteTransactions.map((tx) => {
                          const isDel = 
                            tx.category === 'Reservation Deletion' || 
                            tx.actionType === 'delete' || 
                            tx.invoiceNumber.startsWith('DEL-') || 
                            tx.description.toLowerCase().includes('delete');
                          const amt = tx.amount || 0;
                          const reasonText = tx.cancellationReason || tx.notes || tx.description;

                          return (
                            <tr key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                              {/* Date */}
                              <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap text-neutral-700">
                                {tx.date}
                              </td>

                              {/* Voucher Number */}
                              <td className="px-3 py-2 font-mono font-bold text-[11px] text-blue-900 whitespace-nowrap">
                                {tx.invoiceNumber}
                              </td>

                              {/* Action Badge */}
                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                {isDel ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                    <Trash2 className="w-3 h-3 text-rose-600" />
                                    Delete
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    <Ban className="w-3 h-3 text-amber-700" />
                                    Guest Cancel
                                  </span>
                                )}
                              </td>

                              {/* Room Number */}
                              <td className="px-3 py-2 font-bold font-mono text-neutral-900 whitespace-nowrap">
                                {tx.roomNumber ? `Room ${tx.roomNumber}` : 'N/A'}
                              </td>

                              {/* Guest Name */}
                              <td className="px-3 py-2 font-medium text-neutral-900">
                                {tx.guestOrVendor}
                              </td>

                              {/* Cancellation / Deletion Reason */}
                              <td className="px-3 py-2 text-neutral-700 max-w-xs">
                                <div className="text-[11px] font-medium leading-tight line-clamp-2" title={reasonText}>
                                  {reasonText}
                                </div>
                              </td>

                              {/* Amount USD */}
                              <td className="px-3 py-2 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                                ${amt.toFixed(2)}
                              </td>

                              {/* Amount KHR */}
                              <td className="px-3 py-2 text-right font-mono text-[11px] text-neutral-600 whitespace-nowrap">
                                {(amt * exchangeRate).toLocaleString()} ៛
                              </td>

                              {/* Payment Mode */}
                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                <span className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-[10px] font-semibold text-neutral-700">
                                  {tx.paymentMethod || 'Cash'}
                                </span>
                              </td>

                              {/* Operator */}
                              <td className="px-3 py-2 text-[11px] text-neutral-600 whitespace-nowrap">
                                {tx.operatorName || 'Receptionist'}
                              </td>

                              {/* Status */}
                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  isDel 
                                    ? 'bg-neutral-100 text-neutral-800 border border-neutral-300' 
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                }`}>
                                  {isDel ? 'PURGED' : 'PROCESSED'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    
                    {/* TABLE SUMMARY FOOTER */}
                    {filteredCancelDeleteTransactions.length > 0 && (
                      <tfoot className="bg-[#e8f2fc] text-blue-950 font-bold border-t-2 border-blue-900 text-xs">
                        <tr>
                          <td colSpan={6} className="px-3 py-2 uppercase tracking-wide text-left">
                            TOTAL FOR SELECTED MONTH ({selectedMonth === 'all' ? 'ALL MONTHS' : selectedMonth}): {filteredCancelDeleteTransactions.length} TRANSACTIONS
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-sm text-blue-950">
                            ${totalMonthlyImpactUSD.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs text-blue-900">
                            {totalMonthlyImpactKHR.toLocaleString()} ៛
                          </td>
                          <td colSpan={3} className="px-3 py-2 text-center font-mono text-[11px] text-blue-800">
                            AUDIT LOGGED
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* MANAGER & AUDITOR SIGN-OFF STAMP (For official hotel operations) */}
          <div className="pt-6 border-t-2 border-neutral-400 grid grid-cols-2 md:grid-cols-3 gap-6 text-xs">
            <div>
              <div className="text-neutral-500 text-[11px] uppercase font-bold">Night Auditor Sign-off</div>
              <div className="mt-8 border-b border-neutral-800 pb-1 font-mono font-bold text-neutral-900">
                {currentUser?.fullName || 'System Administrator'}
              </div>
              <div className="text-[10px] text-neutral-400 font-mono">Time: {new Date().toLocaleTimeString()}</div>
            </div>

            <div>
              <div className="text-neutral-500 text-[11px] uppercase font-bold">Front Office Manager Approval</div>
              <div className="mt-8 border-b border-neutral-800 pb-1 font-mono text-neutral-700 italic">
                Verified & Endorsed
              </div>
              <div className="text-[10px] text-neutral-400 font-mono">Status: Approved EOD</div>
            </div>

            <div className="hidden md:block">
              <div className="text-neutral-500 text-[11px] uppercase font-bold">General Manager / Financial Controller</div>
              <div className="mt-8 border-b border-neutral-800 pb-1 font-mono text-neutral-400">
                [ Signature ]
              </div>
              <div className="text-[10px] text-neutral-400 font-mono">Date: {selectedDate}</div>
            </div>
          </div>

        </div>

        {/* BOTTOM MODAL FOOTER */}
        <div className="bg-[#e9eff6] border-t border-[#cbd5e1] px-4 py-2 flex items-center justify-between text-xs">
          <div className="text-[11px] text-neutral-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dual-Currency Closing Balanced • Generated from Hotel PMS Core Ledger</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 rounded font-semibold text-neutral-800 text-xs shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-600" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs cursor-pointer"
            >
              Close Report
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
