import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  DoorOpen, 
  Receipt, 
  FileText,
  Settings, 
  Bell, 
  Plus, 
  Sparkles, 
  DollarSign,
  User,
  ChevronDown
} from 'lucide-react';
import { ActiveTab, UserSettings, Room, Transaction } from '../types';
import { getAccentClasses, formatCurrency } from '../utils/helpers';
import { AuthUser } from './PMSActionModals';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: UserSettings;
  rooms: Room[];
  transactions: Transaction[];
  businessDate?: string;
  currentUser?: AuthUser;
  onOpenQuickBooking: () => void;
  onOpenAddTransaction: () => void;
  onOpenSampleInvoice?: () => void;
  onOpenBillDetails?: () => void;
  onOpenGuestProfile?: () => void;
  onOpenLoginModal?: () => void;
  // Extended PMS actions
  onOpenCheckIn?: () => void;
  onOpenChangeRoom?: () => void;
  onOpenGuestMessages?: () => void;
  onOpenAdvanceDeposit?: () => void;
  onOpenMiscSales?: () => void;
  onOpenCheckOut?: () => void;
  onOpenInHouse?: () => void;
  onOpenNightAudit?: () => void;
  onOpenNightAuditReport?: () => void;
  onOpenExchangeRateModal?: () => void;
  onOpenAddRoom?: () => void;
  onOpenTapeChart?: () => void;
  onOpenRoomStatus?: () => void;
  onSelectRoomsSubTab?: (subTab: 'tape_chart' | 'grid' | 'list') => void;
  onExit?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  rooms,
  transactions,
  businessDate = '2026-08-29',
  currentUser,
  onOpenQuickBooking,
  onOpenAddTransaction,
  onOpenSampleInvoice,
  onOpenBillDetails,
  onOpenGuestProfile,
  onOpenLoginModal,
  onOpenCheckIn,
  onOpenChangeRoom,
  onOpenGuestMessages,
  onOpenAdvanceDeposit,
  onOpenMiscSales,
  onOpenCheckOut,
  onOpenInHouse,
  onOpenNightAudit,
  onOpenNightAuditReport,
  onOpenExchangeRateModal,
  onOpenAddRoom,
  onOpenTapeChart,
  onOpenRoomStatus,
  onSelectRoomsSubTab,
  onExit,
}) => {
  const [activeMenuDropdown, setActiveMenuDropdown] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const menuBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close menu dropdown on outside click & hotkeys
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(event.target as Node)) {
        setActiveMenuDropdown(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      // Avoid intercepting inside inputs or textareas
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      if (event.key === 'F11') {
        event.preventDefault();
        if (onOpenExchangeRateModal) {
          onOpenExchangeRateModal();
        }
      } else if (event.key === 'F2') {
        event.preventDefault();
        if (onOpenTapeChart) onOpenTapeChart();
        else setActiveTab('rooms');
      } else if (event.key === 'F3') {
        event.preventDefault();
        if (onOpenInHouse) onOpenInHouse();
      } else if (event.key === 'F4') {
        event.preventDefault();
        if (onOpenSampleInvoice) onOpenSampleInvoice();
      } else if (event.key === 'F10') {
        event.preventDefault();
        setActiveTab('settings');
      } else if (event.altKey && event.key === '4') {
        event.preventDefault();
        if (onOpenRoomStatus) onOpenRoomStatus();
      } else if (event.altKey && (event.key === '1' || event.key === '2' || event.key === '6')) {
        event.preventDefault();
        setActiveTab('accounting');
      } else if (event.altKey && (event.key === '3' || event.key === '5')) {
        event.preventDefault();
        setActiveTab('invoices');
      } else if (event.altKey && event.key === '7') {
        event.preventDefault();
        setActiveTab('rooms');
      } else if (event.ctrlKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        if (onOpenNightAuditReport) onOpenNightAuditReport();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onOpenExchangeRateModal, onOpenRoomStatus, onOpenTapeChart, onOpenInHouse, onOpenSampleInvoice, onOpenNightAuditReport, setActiveTab]);

  const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
  const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;
  const totalMonthIncome = transactions
    .filter((t) => t.type === 'income' && t.status === 'paid')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Top Menu Definitions with classic PMS shortcuts
  const menuItems = [
    {
      id: 'reservation',
      label: 'Reservation',
      subItems: [
        { label: 'New Individual Reservation', action: onOpenQuickBooking, hotkey: 'Ctrl+N', icon: '📝' },
        { label: 'Amend / Search Reservation', action: onOpenGuestProfile, hotkey: 'Ctrl+F', icon: '🔍' },
        { label: 'Tape Chart & Rack View', action: onOpenTapeChart || (() => setActiveTab('rooms')), hotkey: 'F2', icon: '📊' },
        { label: 'Add New Room / Suite', action: onOpenAddRoom || (() => setActiveTab('rooms')), hotkey: 'Alt+N', icon: '🚪' },
        { divider: true },
        { label: 'Advance Deposit / Prepayment', action: onOpenAdvanceDeposit || onOpenAddTransaction, hotkey: 'Ctrl+D', icon: '💰' },
        { label: 'Room Availability Forecast', action: onOpenTapeChart || (() => setActiveTab('rooms')), hotkey: 'Alt+A', icon: '📅' },
      ],
    },
    {
      id: 'front_desk',
      label: 'Front Desk',
      subItems: [
        { label: 'Individual Check-In', action: onOpenCheckIn || onOpenQuickBooking, hotkey: 'Ctrl+I', icon: '📥' },
        { label: 'In-House Guests Roster', action: onOpenInHouse, hotkey: 'F3', icon: '👥' },
        { label: 'Room Move / Change Room', action: onOpenChangeRoom, hotkey: 'Ctrl+M', icon: '🔄' },
        { label: 'Express Check-Out', action: onOpenCheckOut, hotkey: 'Ctrl+O', icon: '📤' },
        { divider: true },
        { label: 'Guest Messages & Wake-Up Calls', action: onOpenGuestMessages, hotkey: 'Ctrl+W', icon: '✉️' },
      ],
    },
    {
      id: 'cashier',
      label: 'Cashier',
      subItems: [
        { label: 'Bill Details (Split Folios)', action: onOpenBillDetails || onOpenSampleInvoice, hotkey: 'F3', icon: '📊' },
        { label: 'Guest Folio & Tax Invoice', action: onOpenSampleInvoice, hotkey: 'F4', icon: '🧾' },
        { label: 'Post Room Charges', action: onOpenAddTransaction, hotkey: 'Ctrl+P', icon: '💲' },
        { label: 'Miscellaneous POS Sales', action: onOpenMiscSales, hotkey: 'Ctrl+S', icon: '🛒' },
        { divider: true },
        { label: 'Settle Bill & Cashiering', action: onOpenBillDetails || onOpenSampleInvoice, hotkey: 'Ctrl+B', icon: '💳' },
        { label: 'All Transactions Ledger', action: () => setActiveTab('accounting'), hotkey: 'Alt+L', icon: '📑' },
      ],
    },
    {
      id: 'night_audit',
      label: 'Night Audit',
      subItems: [
        { label: `Run Daily Night Audit Wizard (Roll ${businessDate} ➔ +1 Day)`, action: onOpenNightAudit, hotkey: 'Ctrl+Alt+N', icon: '🌙' },
        { label: 'Daily Closing Report (Manager Flash)', action: onOpenNightAuditReport, hotkey: 'Ctrl+R', icon: '📑' },
        { label: 'Post Room & Tax Batch', action: onOpenNightAudit, hotkey: 'Alt+T', icon: '🏷️' },
        { divider: true },
        { label: 'Daily Revenue Balances', action: () => setActiveTab('accounting'), hotkey: 'Alt+R', icon: '📈' },
        { label: 'Cashier Shift Audit Trail', action: () => setActiveTab('accounting'), hotkey: 'Alt+C', icon: '🔍' },
      ],
    },
    {
      id: 'queries1',
      label: 'Queries1',
      subItems: [
        { label: 'In-House Guests Directory', action: onOpenInHouse, hotkey: 'Ctrl+1', icon: '📋' },
        { label: 'Today Expected Arrivals', action: () => setActiveTab('rooms'), hotkey: 'Ctrl+2', icon: '🛬' },
        { label: 'Today Expected Departures', action: onOpenCheckOut, hotkey: 'Ctrl+3', icon: '🛫' },
        { label: 'VIP Guests List', action: onOpenInHouse, hotkey: 'Ctrl+4', icon: '⭐' },
      ],
    },
    {
      id: 'queries2',
      label: 'Queries2',
      subItems: [
        { label: 'Room Status & Housekeeping', action: () => setActiveTab('rooms'), hotkey: 'Ctrl+5', icon: '🧹' },
        { label: 'Guest Message Logs', action: onOpenGuestMessages, hotkey: 'Ctrl+6', icon: '📨' },
        { label: 'Blocked / Future Bookings', action: () => setActiveTab('rooms'), hotkey: 'Ctrl+7', icon: '🔒' },
      ],
    },
    {
      id: 'reports1',
      label: 'Reports1',
      subItems: [
        { label: 'Night Audit Closing Report', action: onOpenNightAuditReport, hotkey: 'Ctrl+R', icon: '🌙' },
        { label: 'Daily Revenue Summary', action: () => setActiveTab('accounting'), hotkey: 'Alt+1', icon: '📊' },
        { label: 'Monthly Occupancy Report', action: () => setActiveTab('accounting'), hotkey: 'Alt+2', icon: '🏨' },
        { label: 'Dual Currency Tax Summary', action: () => setActiveTab('invoices'), hotkey: 'Alt+3', icon: '💵' },
      ],
    },
    {
      id: 'reports2',
      label: 'Reports2',
      subItems: [
        { label: 'Suite & Room Operations Status Report', action: onOpenRoomStatus || (() => {}), hotkey: 'Alt+4', icon: '📊' },
        { label: 'Guest Folios Archive', action: () => setActiveTab('invoices'), hotkey: 'Alt+5', icon: '📁' },
        { label: 'Payment Method Breakdown', action: () => setActiveTab('accounting'), hotkey: 'Alt+6', icon: '💳' },
        { label: 'Housekeeping Task Sheet', action: () => setActiveTab('rooms'), hotkey: 'Alt+7', icon: '🛏️' },
      ],
    },
    {
      id: 'analysis',
      label: 'Analysis',
      subItems: [
        { label: 'ADR & RevPAR Analytics', action: () => setActiveTab('accounting'), hotkey: 'Shift+A', icon: '📉' },
        { label: 'Room Type Yield Matrix', action: () => setActiveTab('rooms'), hotkey: 'Shift+Y', icon: '📊' },
        { label: 'Direct vs OTA Channels', action: () => setActiveTab('accounting'), hotkey: 'Shift+C', icon: '🌐' },
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      subItems: [
        { label: 'System & Hotel Settings', action: () => setActiveTab('settings'), hotkey: 'F10', icon: '⚙️' },
        { label: 'KHR / USD Exchange Settings', action: onOpenExchangeRateModal || (() => setActiveTab('settings')), hotkey: 'F11', icon: '💱' },
        { label: 'Sound & Chime Alerts', action: () => setActiveTab('settings'), hotkey: 'F12', icon: '🔔' },
        { divider: true },
        { 
          label: 'Room Cards View (Visual Grid)', 
          action: () => { 
            setActiveTab('rooms'); 
            onSelectRoomsSubTab?.('grid'); 
          }, 
          hotkey: 'Alt+G', 
          icon: '🔲' 
        },
        { 
          label: 'Room Table View (Detailed List)', 
          action: () => { 
            setActiveTab('rooms'); 
            onSelectRoomsSubTab?.('list'); 
          }, 
          hotkey: 'Alt+L', 
          icon: '📋' 
        },
        { 
          label: settings?.hotelName ? `Tape Chart (${settings.hotelName} Rack View)` : 'Tape Chart (Room Rack Matrix)', 
          action: () => { 
            setActiveTab('rooms'); 
            onSelectRoomsSubTab?.('tape_chart'); 
          }, 
          hotkey: 'Alt+T', 
          icon: '📊' 
        },
      ],
    },
    {
      id: 'favorites',
      label: 'Favorites',
      subItems: [
        { label: '1. Tape Chart (TpChrt)', action: () => setActiveTab('rooms'), hotkey: '1', icon: '⭐' },
        { label: '2. Guest Folio (Invoice)', action: onOpenSampleInvoice, hotkey: '2', icon: '⭐' },
        { label: '3. Amend Reservation (GstAmnd)', action: onOpenGuestProfile, hotkey: '3', icon: '⭐' },
        { label: '4. New Reservation (Reserve)', action: onOpenQuickBooking, hotkey: '4', icon: '⭐' },
      ],
    },
  ];

  return (
    <div className="w-full bg-[#f4f7fb] border-b border-[#a0b8d5] shadow-xs select-none sticky top-0 z-40">
      
      {/* 1. TOP CLASSIC WINDOWS MENU BAR */}
      <div 
        ref={menuBarRef}
        className="bg-gradient-to-b from-[#ffffff] via-[#eef4fa] to-[#dbe8f6] border-b border-[#b5ccde] px-2 py-0.5 flex items-center justify-between text-xs relative z-50 overflow-visible"
      >
        <div className="flex items-center space-x-1 py-0.5 overflow-visible">
          {/* Company / Hotel Name Branding Header */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 mr-1 bg-gradient-to-r from-[#0c2444] to-[#1e3a8a] text-white rounded-xs shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-blue-300" />
            <span className="font-extrabold text-[11px] tracking-tight uppercase">
              {settings?.hotelName || 'ROYAL PALACE HOTEL & SUITES'}
            </span>
          </div>
          {menuItems.map((item) => {
            const isOpen = activeMenuDropdown === item.id;
            return (
              <div key={item.id} className="relative overflow-visible">
                <button
                  type="button"
                  id={`pms-menu-${item.id}`}
                  onClick={() => setActiveMenuDropdown(isOpen ? null : item.id)}
                  onMouseEnter={() => {
                    if (activeMenuDropdown !== null) {
                      setActiveMenuDropdown(item.id);
                    }
                  }}
                  className={`px-2.5 py-0.5 text-[12px] rounded-xs transition-colors whitespace-nowrap cursor-pointer ${
                    isOpen 
                      ? 'bg-gradient-to-b from-[#bfdbfe] to-[#90cdf4] text-[#0c2444] border border-[#60a5fa] shadow-inner font-bold' 
                      : 'text-[#1e3a5f] hover:bg-[#e1effa] hover:text-[#0f2d52] border border-transparent'
                  }`}
                >
                  {item.label}
                </button>

                {isOpen && (
                  <div 
                    id={`pms-dropdown-${item.id}`}
                    className="absolute left-0 top-full mt-1 min-w-[280px] bg-[#ffffff] rounded-xs shadow-[0_12px_28px_rgba(0,0,0,0.3),0_4px_10px_rgba(0,0,0,0.12)] border-2 border-[#5b8ec5] py-1 z-50 animate-in fade-in-50 duration-100 ring-1 ring-black/10"
                  >
                    {/* Header indicator banner */}
                    <div className="px-3 py-1 bg-gradient-to-r from-[#e8f2fc] to-[#f0f6fd] border-b border-[#cbd5e1] mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#1e3a8a] uppercase tracking-wider">
                        {item.label} Menu
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Hotkeys
                      </span>
                    </div>

                    {item.subItems.map((sub, idx) => {
                      if (sub.divider) {
                        return <div key={`div-${idx}`} className="my-1 border-t border-[#e2e8f0]"></div>;
                      }

                      return (
                        <button
                          key={idx}
                          id={`pms-dropdown-item-${item.id}-${idx}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveMenuDropdown(null);
                            if (sub.action) {
                              sub.action();
                            }
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-[#1e293b] hover:bg-gradient-to-r hover:from-[#1d4ed8] hover:to-[#2563eb] hover:text-white active:bg-blue-800 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] w-4 text-center opacity-80 group-hover:opacity-100">
                              {sub.icon || '•'}
                            </span>
                            <span className="font-medium group-hover:font-semibold">
                              {sub.label}
                            </span>
                          </div>
                          {sub.hotkey && (
                            <span className="text-[10px] font-mono text-neutral-500 group-hover:text-blue-100 font-normal ml-3 px-1 py-0.2 rounded bg-neutral-100 group-hover:bg-blue-800/40 border border-neutral-200 group-hover:border-blue-400/40">
                              {sub.hotkey}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Info: Exchange Rate & Occupancy */}
        <div className="hidden sm:flex items-center gap-2.5 text-[11px] text-[#2c4c70] font-mono pr-2">
          {/* Interactive Editable Exchange Rate Button */}
          <button
            type="button"
            id="btn-navbar-exchange-rate"
            onClick={onOpenExchangeRateModal}
            className="flex items-center gap-1 bg-[#e0ecf8] hover:bg-[#d0e5f7] border border-[#a8c7e6] hover:border-[#6fa4d5] text-[#133c66] px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer shadow-2xs group active:scale-95"
            title="Click to edit KHR / USD Exchange Rate (F11)"
          >
            <span className="text-[12px] group-hover:rotate-12 transition-transform">💱</span>
            <span>$1 = <strong className="text-blue-950 font-bold">{(settings.exchangeRateUSDToKHR || settings.exchangeRateKHR || 4100).toLocaleString()}</strong> ៛</span>
            <span className="text-[9px] text-blue-600 font-sans ml-0.5 bg-blue-100/80 px-1 py-0.2 rounded border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">Edit</span>
          </button>

          <span className="text-[#a5bccc]">|</span>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Occ: <strong>{occupancyRate}%</strong></span>
          </div>
          <span className="text-[#a5bccc]">|</span>
          <span className="font-bold text-[#1a3350]">{currentTime}</span>
        </div>
      </div>

      {/* 2. ICON TOOLBAR (Left: 13 Skeuomorphic 3D Buttons | Right: Accounting & User Login) */}
      <div className="bg-gradient-to-b from-[#f9fbfe] via-[#ebf2fa] to-[#d6e5f7] border-b border-[#a8c3de] px-1.5 py-1 flex items-center justify-between overflow-x-auto scrollbar-none shadow-inner gap-1">
        
        {/* LEFT PMS ACTION BUTTONS */}
        <div className="flex items-center gap-0 shrink-0">
          {/* BUTTON 1: Reserve */}
          <button
            type="button"
            id="btn-pms-reserve"
            onClick={onOpenQuickBooking}
            className="group flex flex-col items-center justify-center min-w-[54px] px-1.5 py-0.5 rounded-xs hover:bg-gradient-to-b hover:from-white hover:to-[#e2effd] border border-transparent hover:border-[#96bfe6] transition-all cursor-pointer"
            title="New Reservation / Booking"
          >
            <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-xs">
              <svg viewBox="0 0 36 36" className="w-7 h-7">
                {/* Calendar body */}
                <rect x="4" y="8" width="28" height="24" rx="3" fill="#ffffff" stroke="#718096" strokeWidth="1.2" />
                <rect x="4" y="8" width="28" height="8" rx="2" fill="url(#pmsCalGreenGrad)" />
                {/* Spiral rings */}
                <circle cx="9" cy="6" r="2" fill="#718096" />
                <circle cx="18" cy="6" r="2" fill="#718096" />
                <circle cx="27" cy="6" r="2" fill="#718096" />
                {/* Checkmark bubble */}
                <circle cx="24" cy="22" r="7" fill="url(#pmsGreenBubble)" stroke="#276749" strokeWidth="1" />
                <path d="M21 22.5 L23 24.5 L27 19.5" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="pmsCalGreenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#48bb78" />
                    <stop offset="100%" stopColor="#2f855a" />
                  </linearGradient>
                  <linearGradient id="pmsGreenBubble" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#68d391" />
                    <stop offset="100%" stopColor="#22543d" />
                  </linearGradient>
                  <linearGradient id="pmsShieldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-[#1a3350] tracking-tight group-hover:text-blue-900">
              Reserve
            </span>
          </button>

        <div className="h-9 w-px bg-[#c2d7ed] mx-0.5 shadow-[1px_0_0_rgba(255,255,255,0.8)]"></div>

        {/* BUTTON 2: CheckIn */}
        <button
          type="button"
          id="btn-pms-checkin"
          onClick={onOpenCheckIn || onOpenQuickBooking}
          className="group flex flex-col items-center justify-center min-w-[54px] px-1.5 py-0.5 rounded-xs hover:bg-gradient-to-b hover:from-white hover:to-[#e2effd] border border-transparent hover:border-[#96bfe6] transition-all cursor-pointer"
          title="Guest Check-In"
        >
          <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-xs">
            <svg viewBox="0 0 36 36" className="w-7 h-7">
              {/* Manila Folder */}
              <path d="M4 10 L14 10 L17 13 L31 13 L31 29 L4 29 Z" fill="url(#pmsFolderGrad)" stroke="#c09853" strokeWidth="1" />
              <path d="M4 14 L31 14 L30 29 L4 29 Z" fill="#fff9db" opacity="0.6" />
              {/* Red/Brown Guest silhouette in front */}
              <circle cx="23" cy="20" r="4" fill="#c53030" stroke="#742a2a" strokeWidth="0.8" />
              <path d="M17 29 C17 25 20 24 23 24 C26 24 29 25 29 29 Z" fill="#9b2c2c" />
              <defs>
                <linearGradient id="pmsFolderGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-[#1a3350] tracking-tight group-hover:text-blue-900">
            CheckIn
          </span>
        </button>

        <div className="h-9 w-px bg-[#c2d7ed] mx-0.5 shadow-[1px_0_0_rgba(255,255,255,0.8)]"></div>

        {/* BUTTON 3: ChangeRM */}
        <button
          type="button"
          id="btn-pms-changerm"
          onClick={onOpenChangeRoom || onOpenGuestProfile}
          className="group flex flex-col items-center justify-center min-w-[58px] px-1.5 py-0.5 rounded-xs hover:bg-gradient-to-b hover:from-white hover:to-[#e2effd] border border-transparent hover:border-[#96bfe6] transition-all cursor-pointer"
          title="Room Move / Change Room"
        >
          <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-xs">
            <svg viewBox="0 0 36 36" className="w-7 h-7">
              {/* Bed */}
              <rect x="5" y="16" width="26" height="11" rx="2" fill="#d97706" stroke="#92400e" strokeWidth="1" />
              <rect x="7" y="19" width="22" height="7" fill="#ffffff" />
              <rect x="8" y="17" width="7" height="4" rx="1" fill="#fef3c7" />
              {/* Blue Circular Swap / Recycle Arrows */}
              <circle cx="21" cy="11" r="6" fill="#3182ce" opacity="0.9" />
              <path d="M19 9 L23 9 L23 13" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M23 13 L19 13 L19 9" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-[#1a3350] tracking-tight group-hover:text-blue-900">
            ChangeRM
          </span>
        </button>

        <div className="h-9 w-px bg-[#c2d7ed] mx-0.5 shadow-[1px_0_0_rgba(255,255,255,0.8)]"></div>

        {/* BUTTON 4: GstAmnd */}
        <button
          type="button"
          id="btn-pms-gstamnd"
          onClick={onOpenGuestProfile}
          className="group flex flex-col items-center justify-center min-w-[56px] px-1.5 py-0.5 rounded-xs hover:bg-gradient-to-b hover:from-white hover:to-[#e2effd] border border-transparent hover:border-[#96bfe6] transition-all cursor-pointer"
          title="Guest Amend / Reservation Profile"
        >
          <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-xs">
            <svg viewBox="0 0 36 36" className="w-7 h-7">
              {/* Guest 1 (Male - Blue shirt) */}
              <circle cx="14" cy="14" r="4.5" fill="#fbd38d" stroke="#c05621" strokeWidth="0.8" />
              <path d="M11 11 Q14 8 17 11" stroke="#4a5568" strokeWidth="1.5" fill="none" />
              <path d="M8 26 C8 21 11 20 14 20 C17 20 20 21 20 26 Z" fill="url(#pmsBlueShirt)" />
              {/* Guest 2 (Female - Tan shirt/Gold hair) */}
              <circle cx="23" cy="15" r="4.5" fill="#fed7d7" stroke="#c53030" strokeWidth="0.8" />
              <path d="M19 12 Q23 7 27 12" stroke="#d69e2e" strokeWidth="2.5" fill="none" />
              <path d="M18 26 C18 22 20 21 23 21 C26 21 28 22 28 26 Z" fill="url(#pmsOrangeShirt)" />
              <defs>
                <linearGradient id="pmsBlueShirt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4299e1" />
                  <stop offset="100%" stopColor="#2b6cb0" />
                </linearGradient>
                <linearGradient id="pmsOrangeShirt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f6ad55" />
                  <stop offset="100%" stopColor="#dd6b20" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-[#1a3350] tracking-tight group-hover:text-blue-900">
            GstAmnd
          </span>
        </button>

        <div className="h-9 w-px bg-[#c2d7ed] mx-0.5 shadow-[1px_0_0_rgba(255,255,255,0.8)]"></div>

        {/* BUTTON 5: Message */}
        <button
          type="button"
          id="btn-pms-message"
          onClick={onOpenGuestMessages}
          className="group flex flex-col items-center justify-center min-w-[56px] px-1.5 py-0.5 rounded-xs hover:bg-gradient-to-b hover:from-white hover:to-[#e2effd] border border-transparent hover:border-[#96bfe6] transition-all cursor-pointer"
          title="Guest Messages & Front Desk Notes"
        >
          <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-xs">
            <svg viewBox="0 0 36 36" className="w-7 h-7">
              {/* White envelope with gold inside */}
              <path d="M5 14 L18 6 L31 14 L31 28 L5 28 Z" fill="#ffffff" stroke="#a0aec0" strokeWidth="1" />
              <path d="M5 14 L18 22 L31 14" fill="#fefcbf" stroke="#d69e2e" strokeWidth="1" />
              {/* Protruding Blue Note */}
              <rect x="10" y="8" width="16" height="10" rx="1" fill="#ebf8ff" stroke="#4299e1" strokeWidth="0.8" />
              <line x1="13" y1="12" x2="23" y2="12" stroke="#3182ce" strokeWidth="1" />
              <line x1="13" y1="15" x2="20" y2="15" stroke="#3182ce" strokeWidth="1" />
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-[#1a3350] tracking-tight group-hover:text-blue-900">
            Message
          </span>
        </button>

        <div className="h-9 w-px bg-[#c2d7ed] mx-0.5 shadow-[1px_0_0_rgba(255,255,255,0.8)]"></div>

        {/* BUTTON 6: Advance */}
        <button
          type="button"
          id="btn-pms-advance"
          onClick={onOpenAdvanceDeposit || onOpenAddTransaction}
          className="group flex flex-col items-center justify-center min-w-[54px] px-1.5 py-0.5 rounded-xs hover:bg-gradient-to-b hover:from-white hover:to-[#e2effd] border border-transparent hover:border-[#96bfe6] transition-all cursor-pointer"
          title="Advance Deposit / Pre-payment"
        >
          <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-xs">
            <svg viewBox="0 0 36 36" className="w-7 h-7">
              {/* Banknote behind */}
              <rect x="12" y="10" width="19" height="12" rx="1.5" fill="#c6f6d5" stroke="#38a169" strokeWidth="1" transform="rotate(8 21 16)" />
              {/* Stack of Gold Coins */}
              <ellipse cx="12" cy="24" rx="6" ry="2.5" fill="#ecc94b" stroke="#b7791f" strokeWidth="0.8" />
              <rect x="6" y="21" width="12" height="3" fill="#d69e2e" />
              <ellipse cx="12" cy="21" rx="6" ry="2.5" fill="#f6e05e" stroke="#b7791f" strokeWidth="0.8" />
              <rect x="6" y="18" width="12" height="3" fill="#d69e2e" />
              <ellipse cx="12" cy="18" rx="6" ry="2.5" fill="#faf089" stroke="#b7791f" strokeWidth="0.8" />
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-[#1a3350] tracking-tight group-hover:text-blue-900">
            Advance
          </span>
        </button>

        <div className="h-9 w-px bg-[#c2d7ed] mx-0.5 shadow-[1px_0_0_rgba(255,255,255,0.8)]"></div>

        {/* BUTTON 7: Charges */}
        <button
          type="button"
          id="btn-pms-charges"
          onClick={onOpenAddTransaction}
          className="group flex flex-col items-center justify-center min-w-[54px] px-1.5 py-0.5 rounded-xs hover:bg-gradient-to-b hover:from-white hover:to-[#e2effd] border border-transparent hover:border-[#96bfe6] transition-all cursor-pointer"
          title="Post Room Charges / Add Transaction"
        >
          <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-xs">
            <svg viewBox="0 0 36 36" className="w-7 h-7">
              {/* Money Bag */}
              <path d="M14 9 C14 7 22 7 22 9 L25 12 L11 12 Z" fill="#d69e2e" stroke="#744210" strokeWidth="0.8" />
              <circle cx="18" cy="13" r="2.5" fill="#ecc94b" />
              <path d="M11 12 C6 17 6 27 11 29 C15 31 21 31 25 29 C30 27 30 17 25 12 Z" fill="url(#pmsMoneyBagGrad)" stroke="#975a16" strokeWidth="1" />
              <text x="18" y="24" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#744210" fontFamily="sans-serif">$</text>
              <defs>
                <linearGradient id="pmsMoneyBagGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f6e05e" />
                  <stop offset="100%" stopColor="#b7791f" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-[#1a3350] tracking-tight group-hover:text-blue-900">
            Charges
          </span>
        </button>

        <div className="h-9 w-px bg-[#c2d7ed] mx-0.5 shadow-[1px_0_0_rgba(255,255,255,0.8)]"></div>

        {/* BUTTON 8: MiscSales */}
        <button
          type="button"
          id="btn-pms-miscsales"
          onClick={onOpenMiscSales}
          className="group flex flex-col items-center justify-center min-w-[56px] px-1.5 py-0.5 rounded-xs hover:bg-gradient-to-b hover:from-white hover:to-[#e2effd] border border-transparent hover:border-[#96bfe6] transition-all cursor-pointer"
          title="Miscellaneous POS Sales & Services"
        >
          <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-xs">
            <svg viewBox="0 0 36 36" className="w-7 h-7">
              {/* House/Shop */}
              <polygon points="18,6 6,16 30,16" fill="url(#pmsRoofGrad)" stroke="#9c4221" strokeWidth="1" />
              <rect x="8" y="16" width="20" height="12" fill="#ffffff" stroke="#718096" strokeWidth="1" />
              <rect x="11" y="19" width="5" height="5" fill="#63b3ed" stroke="#3182ce" strokeWidth="0.8" />
              <rect x="20" y="19" width="5" height="9" fill="#dd6b20" stroke="#7b341e" strokeWidth="0.8" />
              <defs>
                <linearGradient id="pmsRoofGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f56565" />
                  <stop offset="100%" stopColor="#c53030" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-[#1a3350] tracking-tight group-hover:text-blue-900">
            MiscSales
          </span>
        </button>

        <div className="h-9 w-px bg-[#c2d7ed] mx-0.5 shadow-[1px_0_0_rgba(255,255,255,0.8)]"></div>

        {/* BUTTON 9: ChkOut */}
        <button
          type="button"
          id="btn-pms-chkout"
          onClick={onOpenCheckOut || onOpenSampleInvoice}
          className="group flex flex-col items-center justify-center min-w-[54px] px-1.5 py-0.5 rounded-xs hover:bg-gradient-to-b hover:from-white hover:to-[#e2effd] border border-transparent hover:border-[#96bfe6] transition-all cursor-pointer"
          title="Express Check-Out"
        >
          <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-xs">
            <svg viewBox="0 0 36 36" className="w-7 h-7">
              {/* Orange Suitcase on Wheels */}
              <rect x="14" y="6" width="8" height="5" rx="1" fill="none" stroke="#718096" strokeWidth="1.5" />
              <rect x="10" y="11" width="16" height="18" rx="2.5" fill="url(#pmsLuggageGrad)" stroke="#c05621" strokeWidth="1" />
              <line x1="10" y1="18" x2="26" y2="18" stroke="#dd6b20" strokeWidth="1" />
              <circle cx="13" cy="30" r="1.5" fill="#4a5568" />
              <circle cx="23" cy="30" r="1.5" fill="#4a5568" />
              <defs>
                <linearGradient id="pmsLuggageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbd38d" />
                  <stop offset="100%" stopColor="#dd6b20" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-[#1a3350] tracking-tight group-hover:text-blue-900">
            ChkOut
          </span>
        </button>

        <div className="h-9 w-px bg-[#c2d7ed] mx-0.5 shadow-[1px_0_0_rgba(255,255,255,0.8)]"></div>

        {/* BUTTON 10: Settle */}
        <button
          type="button"
          id="btn-pms-settle"
          onClick={onOpenSampleInvoice}
          className="group flex flex-col items-center justify-center min-w-[54px] px-1.5 py-0.5 rounded-xs hover:bg-gradient-to-b hover:from-white hover:to-[#e2effd] border border-transparent hover:border-[#96bfe6] transition-all cursor-pointer"
          title="Settle Guest Folio & Master Invoice"
        >
          <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-xs">
            <svg viewBox="0 0 36 36" className="w-7 h-7">
              {/* Blue Credit Card */}
              <rect x="6" y="9" width="24" height="15" rx="2" fill="url(#pmsCreditCardGrad)" stroke="#1a365d" strokeWidth="1" />
              <rect x="6" y="12" width="24" height="3" fill="#2a4365" />
              {/* Golden Key overlaid */}
              <circle cx="13" cy="24" r="3.5" fill="#f6e05e" stroke="#b7791f" strokeWidth="0.8" />
              <rect x="15" y="23" width="10" height="2" fill="#d69e2e" stroke="#b7791f" strokeWidth="0.6" />
              <rect x="23" y="25" width="2" height="2.5" fill="#b7791f" />
              <defs>
                <linearGradient id="pmsCreditCardGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4299e1" />
                  <stop offset="100%" stopColor="#2b6cb0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-[#1a3350] tracking-tight group-hover:text-blue-900">
            Settle
          </span>
        </button>

        <div className="h-9 w-px bg-[#c2d7ed] mx-0.5 shadow-[1px_0_0_rgba(255,255,255,0.8)]"></div>

        {/* BUTTON 11: Room (+ Add Room / Room Rack) */}
        <button
          type="button"
          id="btn-pms-room"
          onClick={() => {
            if (onOpenAddRoom) {
              onOpenAddRoom();
            } else if (onOpenTapeChart) {
              onOpenTapeChart();
            } else {
              setActiveTab('rooms');
            }
          }}
          className="group flex flex-col items-center justify-center min-w-[54px] px-1.5 py-0.5 rounded-xs hover:bg-gradient-to-b hover:from-white hover:to-[#e2effd] border border-transparent hover:border-[#96bfe6] transition-all cursor-pointer"
          title="Add New Room or Open Room Management (Ctrl+N)"
        >
          <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-xs">
            <svg viewBox="0 0 36 36" className="w-7 h-7">
              {/* Hotel Door */}
              <rect x="7" y="4" width="22" height="28" rx="2" fill="url(#pmsDoorGrad)" stroke="#78350f" strokeWidth="1" />
              {/* Door Paneling */}
              <rect x="10" y="7" width="16" height="8" rx="1" fill="#9a3412" opacity="0.6" stroke="#451a03" strokeWidth="0.6" />
              <rect x="10" y="18" width="16" height="11" rx="1" fill="#9a3412" opacity="0.6" stroke="#451a03" strokeWidth="0.6" />
              {/* Golden Door Knob */}
              <circle cx="23" cy="18" r="2" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
              {/* Green '+' Add Badge */}
              <circle cx="26" cy="26" r="5" fill="#16a34a" stroke="#ffffff" strokeWidth="1.2" />
              <path d="M26 23.5 L26 28.5 M23.5 26 L28.5 26" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
              <defs>
                <linearGradient id="pmsDoorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#c2410c" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-[#1a3350] tracking-tight group-hover:text-blue-900">
            Room
          </span>
        </button>

        <div className="h-9 w-px bg-[#c2d7ed] mx-0.5 shadow-[1px_0_0_rgba(255,255,255,0.8)]"></div>

        {/* BUTTON 12: TpChrt (Tape Chart Grid) */}
        <button
          type="button"
          id="btn-pms-tpchrt"
          onClick={() => {
            if (onOpenTapeChart) {
              onOpenTapeChart();
            } else {
              setActiveTab('rooms');
            }
          }}
          className="group flex flex-col items-center justify-center min-w-[54px] px-1.5 py-0.5 rounded-xs hover:bg-gradient-to-b hover:from-white hover:to-[#e2effd] border border-transparent hover:border-[#96bfe6] transition-all cursor-pointer"
          title="Tape Chart & Graphical Room Matrix"
        >
          <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-xs">
            <svg viewBox="0 0 36 36" className="w-7 h-7">
              {/* 3D Vertical Bar Chart */}
              {/* Green Bar */}
              <rect x="8" y="10" width="5" height="19" fill="#48bb78" stroke="#22543d" strokeWidth="0.8" />
              {/* Blue Bar */}
              <rect x="16" y="14" width="5" height="15" fill="#4299e1" stroke="#2b6cb0" strokeWidth="0.8" />
              {/* Orange Bar */}
              <rect x="24" y="19" width="5" height="10" fill="#ed8936" stroke="#c05621" strokeWidth="0.8" />
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-[#1a3350] tracking-tight group-hover:text-blue-900">
            TpChrt
          </span>
        </button>

        <div className="h-9 w-px bg-[#c2d7ed] mx-0.5 shadow-[1px_0_0_rgba(255,255,255,0.8)]"></div>

        {/* BUTTON 13: Status (Room Cards & Housekeeping Grid) */}
        <button
          type="button"
          id="btn-pms-status"
          onClick={() => {
            if (onOpenRoomStatus) {
              onOpenRoomStatus();
            } else {
              setActiveTab('rooms');
            }
          }}
          className="group flex flex-col items-center justify-center min-w-[54px] px-1.5 py-0.5 rounded-xs hover:bg-gradient-to-b hover:from-white hover:to-[#e2effd] border border-transparent hover:border-[#96bfe6] transition-all cursor-pointer"
          title="Room Status & Housekeeping Overview"
        >
          <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-xs">
            <svg viewBox="0 0 36 36" className="w-7 h-7">
              {/* Tear-off Desk Calendar "15" */}
              <rect x="6" y="7" width="24" height="23" rx="2" fill="#ffffff" stroke="#718096" strokeWidth="1.2" />
              <path d="M6 7 L30 7 L30 13 L6 13 Z" fill="#e53e3e" />
              <circle cx="10" cy="5" r="1.5" fill="#718096" />
              <circle cx="26" cy="5" r="1.5" fill="#718096" />
              <text x="18" y="24" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1a202c" fontFamily="monospace">15</text>
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-[#1a3350] tracking-tight group-hover:text-blue-900">
            Status
          </span>
        </button>

        <div className="h-9 w-px bg-[#c2d7ed] mx-0.5 shadow-[1px_0_0_rgba(255,255,255,0.8)]"></div>

        {/* BUTTON 14: In House */}
        <button
          type="button"
          id="btn-pms-inhouse"
          onClick={onOpenInHouse}
          className="group flex flex-col items-center justify-center min-w-[58px] px-1.5 py-0.5 rounded-xs hover:bg-gradient-to-b hover:from-white hover:to-[#e2effd] border border-transparent hover:border-[#96bfe6] transition-all cursor-pointer"
          title="In-House Guests Roster"
        >
          <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-xs">
            <svg viewBox="0 0 36 36" className="w-7 h-7">
              {/* Bed */}
              <rect x="13" y="18" width="18" height="10" rx="1.5" fill="#4a5568" stroke="#2d3748" strokeWidth="0.8" />
              <rect x="15" y="20" width="14" height="6" fill="#ffffff" />
              {/* Guests beside bed */}
              <circle cx="9" cy="14" r="3.5" fill="#fbd38d" stroke="#c05621" strokeWidth="0.8" />
              <path d="M5 24 C5 20 7 19 9 19 C11 19 13 20 13 24 Z" fill="#3182ce" />
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-[#1a3350] tracking-tight group-hover:text-blue-900 whitespace-nowrap">
            In House
          </span>
        </button>
      </div>

      {/* RIGHT SIDE TOOLS: Accounting & User Login */}
      <div className="flex items-center gap-1 pl-2 pr-1 ml-auto shrink-0">
        <div className="h-9 w-px bg-[#c2d7ed] mx-0.5 shadow-[1px_0_0_rgba(255,255,255,0.8)]"></div>

        {/* BUTTON: Accounting */}
        <button
          type="button"
          id="btn-pms-accounting"
          onClick={() => setActiveTab('accounting')}
          className={`group flex flex-col items-center justify-center min-w-[62px] px-2 py-0.5 rounded-xs border transition-all cursor-pointer ${
            activeTab === 'accounting'
              ? 'bg-gradient-to-b from-[#d9ebfb] to-[#bddcf7] border-[#7fa8cf] shadow-inner'
              : 'hover:bg-gradient-to-b hover:from-white hover:to-[#e2effd] border-transparent hover:border-[#96bfe6]'
          }`}
          title="Accounting, Ledgers, Expenses & Financial Balance"
        >
          <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-xs">
            <svg viewBox="0 0 36 36" className="w-7 h-7">
              {/* Ledger Book with Gold Trim */}
              <rect x="7" y="6" width="22" height="24" rx="2" fill="#2b6cb0" stroke="#1a365d" strokeWidth="1" />
              <path d="M7 6 L12 6 L12 30 L7 30 Z" fill="#1a365d" />
              <line x1="12" y1="6" x2="12" y2="30" stroke="#ecc94b" strokeWidth="1" />
              {/* Calculator / Money badge on cover */}
              <rect x="15" y="10" width="11" height="15" rx="1.5" fill="#ebf8ff" stroke="#3182ce" strokeWidth="0.8" />
              <rect x="17" y="12" width="7" height="3" rx="0.5" fill="#319795" />
              <circle cx="18" cy="18" r="1" fill="#4a5568" />
              <circle cx="21" cy="18" r="1" fill="#4a5568" />
              <circle cx="24" cy="18" r="1" fill="#4a5568" />
              <circle cx="18" cy="22" r="1" fill="#4a5568" />
              <circle cx="21" cy="22" r="1" fill="#4a5568" />
              <circle cx="24" cy="22" r="1" fill="#dd6b20" />
            </svg>
          </div>
          <span className={`text-[11px] font-semibold tracking-tight whitespace-nowrap ${
            activeTab === 'accounting' ? 'text-blue-950 font-bold' : 'text-[#1a3350] group-hover:text-blue-900'
          }`}>
            Accounting
          </span>
        </button>

        <div className="h-9 w-px bg-[#c2d7ed] mx-0.5 shadow-[1px_0_0_rgba(255,255,255,0.8)]"></div>

        {/* BUTTON: User Login (Administrator / Admin1234) */}
        <button
          type="button"
          id="btn-pms-user-login"
          onClick={onOpenLoginModal}
          className="group flex flex-col items-center justify-center min-w-[68px] px-2 py-0.5 rounded-xs hover:bg-gradient-to-b hover:from-white hover:to-[#e2effd] border border-[#b4cce3] hover:border-[#7ba9d4] bg-white/70 transition-all cursor-pointer shadow-2xs"
          title="User Login / Switch User (Administrator - Admin1234)"
        >
          <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-xs">
            <svg viewBox="0 0 36 36" className="w-7 h-7">
              {/* 3D Security Shield & User */}
              <path d="M18 4 L30 8 L30 18 C30 25 24 30 18 32 C12 30 6 25 6 18 L6 8 Z" fill="url(#pmsShieldGrad)" stroke="#2b6cb0" strokeWidth="1" />
              {/* User Avatar in center */}
              <circle cx="18" cy="13" r="3.5" fill="#ffffff" />
              <path d="M13 22 C13 18.5 15.5 17.5 18 17.5 C20.5 17.5 23 18.5 23 22 Z" fill="#ffffff" />
              <circle cx="25" cy="9" r="3" fill="#ecc94b" stroke="#b7791f" strokeWidth="0.8" />
            </svg>
            {/* Online indicator light */}
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="flex items-center gap-0.5">
            <span className="text-[11px] font-bold text-[#0c2e55] tracking-tight group-hover:text-blue-900 whitespace-nowrap">
              {currentUser?.isLoggedIn ? (currentUser.username === 'Administrator' ? 'Admin' : currentUser.username) : 'Login'}
            </span>
          </div>
        </button>
      </div>

      </div>

    </div>
  );
};
