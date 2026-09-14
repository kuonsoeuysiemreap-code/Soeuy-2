import React, { useState, useEffect, useMemo } from 'react';
import { 
  Room, 
  Transaction, 
  UserSettings 
} from '../types';
import { 
  Users, 
  DoorOpen, 
  MessageSquare, 
  ShoppingBag, 
  Moon, 
  CheckCircle2, 
  ArrowRightLeft, 
  X, 
  Send,
  Coffee,
  Wine,
  Utensils,
  Sparkles,
  DollarSign,
  ShieldCheck,
  Calendar,
  ArrowRight,
  Eye,
  AlertTriangle,
  Layers,
  Clock,
  Settings
} from 'lucide-react';
import { formatCurrency, playChime, formatFolioDate } from '../utils/helpers';

// ----------------------------------------------------
// 1. IN-HOUSE GUEST DIRECTORY MODAL
// ----------------------------------------------------
export interface InHouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  settings: UserSettings;
  onSelectRoom: (room: Room) => void;
  onOpenFolio: (room: Room, guestName?: string) => void;
}

export const InHouseGuestsModal: React.FC<InHouseModalProps> = ({
  isOpen,
  onClose,
  rooms,
  settings,
  onSelectRoom,
  onOpenFolio,
}) => {
  if (!isOpen) return null;

  const occupiedRooms = rooms.filter((r) => r.status === 'occupied');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#f0f4f8] text-[#1c2d42] rounded-lg shadow-2xl border border-[#94a3b8] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Title bar */}
        <div className="bg-gradient-to-r from-[#d9ebfb] via-[#bddcf7] to-[#99c4eb] border-b border-[#7fa8cf] px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1e3a5f]" />
            <span className="text-xs font-bold text-[#1e3a5f] tracking-wide">
              In-House Guest Roster & Room Directory ({occupiedRooms.length} Active Stays)
            </span>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center rounded bg-white/70 hover:bg-red-500 hover:text-white text-neutral-700 text-xs font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content table */}
        <div className="p-3 overflow-auto flex-1">
          <table className="w-full text-left border-collapse border border-[#cbd5e1] text-xs bg-white">
            <thead>
              <tr className="bg-[#e2e8f0] text-[#334155] font-bold border-b border-[#cbd5e1] text-[11px]">
                <th className="p-2 border-r border-[#cbd5e1]">Room #</th>
                <th className="p-2 border-r border-[#cbd5e1]">Guest Name</th>
                <th className="p-2 border-r border-[#cbd5e1]">Room Type</th>
                <th className="p-2 border-r border-[#cbd5e1]">Arrival</th>
                <th className="p-2 border-r border-[#cbd5e1]">Departure</th>
                <th className="p-2 border-r border-[#cbd5e1] text-right">Daily Rate</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {occupiedRooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-neutral-500 italic">
                    No guests currently in-house. All rooms are available or in turnaround.
                  </td>
                </tr>
              ) : (
                occupiedRooms.map((room) => (
                  <tr key={room.id} className="border-b border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors">
                    <td className="p-2 border-r border-[#cbd5e1] font-mono font-bold text-blue-900">
                      {room.roomNumber}
                    </td>
                    <td className="p-2 border-r border-[#cbd5e1] font-semibold">
                      {room.guestName || 'Unnamed Guest'}
                    </td>
                    <td className="p-2 border-r border-[#cbd5e1] text-neutral-600">
                      {room.type}
                    </td>
                    <td className="p-2 border-r border-[#cbd5e1] font-mono">
                      {room.checkInDate || '2026-08-26'}
                    </td>
                    <td className="p-2 border-r border-[#cbd5e1] font-mono">
                      {room.checkOutDate || '2026-08-29'}
                    </td>
                    <td className="p-2 border-r border-[#cbd5e1] text-right font-mono font-bold text-emerald-800">
                      ${room.pricePerNight.toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenFolio(room, room.guestName);
                          }}
                          className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-900 font-bold text-[10px] shadow-2xs"
                        >
                          Folio
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectRoom(room);
                          }}
                          className="px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 border border-blue-400 text-blue-900 font-bold text-[10px] shadow-2xs"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-[#e2e8f0] border-t border-[#cbd5e1] px-3 py-2 flex items-center justify-between text-xs">
          <span className="text-neutral-600 font-medium">
            Total Occupied: <strong className="text-neutral-900">{occupiedRooms.length}</strong> / {rooms.length} Rooms ({Math.round((occupiedRooms.length / (rooms.length || 1)) * 100)}% Occ)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-neutral-300 hover:bg-neutral-400 border border-neutral-500 rounded font-semibold text-neutral-800 text-xs shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 2. GUEST MESSAGES & NOTES MODAL
// ----------------------------------------------------
export interface GuestMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
}

export const GuestMessageModal: React.FC<GuestMessageModalProps> = ({
  isOpen,
  onClose,
  rooms,
}) => {
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]?.roomNumber || '101');
  const [messageType, setMessageType] = useState<'Wake-Up Call' | 'Front Desk Note' | 'Special Request' | 'Package Arrival'>('Front Desk Note');
  const [messageText, setMessageText] = useState('');
  const [recentMessages, setRecentMessages] = useState([
    { id: '1', room: '101', type: 'Wake-Up Call', text: 'Wake up call scheduled for 06:30 AM (Flight pickup)', time: 'Today 08:15 AM' },
    { id: '2', room: '201', type: 'Special Request', text: 'Extra hypoallergenic pillows requested in afternoon', time: 'Today 11:20 AM' },
    { id: '3', room: '301', type: 'Package Arrival', text: 'Luggage transfer delivery received at reception', time: 'Today 02:45 PM' },
  ]);

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      room: selectedRoom,
      type: messageType,
      text: messageText,
      time: 'Just now',
    };
    setRecentMessages([newMsg, ...recentMessages]);
    setMessageText('');
    playChime();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#f0f4f8] text-[#1c2d42] rounded-lg shadow-2xl border border-[#94a3b8] overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-gradient-to-r from-[#d9ebfb] via-[#bddcf7] to-[#99c4eb] border-b border-[#7fa8cf] px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#1e3a5f]" />
            <span className="text-xs font-bold text-[#1e3a5f] tracking-wide">
              Guest Messages, Wake-up Calls & Front Desk Communication
            </span>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center rounded bg-white/70 hover:bg-red-500 hover:text-white text-neutral-700 text-xs font-bold transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* New message form */}
          <form onSubmit={handleSendMessage} className="bg-white p-3 rounded border border-[#cbd5e1] space-y-3">
            <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Log New Message / Request</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Target Room #</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full px-2 py-1 bg-neutral-50 border border-neutral-300 rounded text-xs"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.roomNumber}>
                      Room {r.roomNumber} - {r.guestName ? r.guestName : `(${r.type})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Message Category</label>
                <select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value as any)}
                  className="w-full px-2 py-1 bg-neutral-50 border border-neutral-300 rounded text-xs"
                >
                  <option value="Front Desk Note">Front Desk Note</option>
                  <option value="Wake-Up Call">Wake-Up Call</option>
                  <option value="Special Request">Special Request</option>
                  <option value="Package Arrival">Package Arrival</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Message / Instruction</label>
              <textarea
                rows={2}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Enter guest message, time schedule, or request details..."
                className="w-full p-2 bg-neutral-50 border border-neutral-300 rounded text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs"
              >
                <Send className="w-3 h-3" />
                <span>Save Message</span>
              </button>
            </div>
          </form>

          {/* Message log */}
          <div>
            <h4 className="text-xs font-bold text-neutral-700 mb-2">Recent Guest Communications</h4>
            <div className="space-y-2">
              {recentMessages.map((m) => (
                <div key={m.id} className="p-2.5 bg-white rounded border border-[#cbd5e1] flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        Room {m.room}
                      </span>
                      <span className="font-semibold text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded">
                        {m.type}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">{m.time}</span>
                    </div>
                    <p className="text-neutral-700">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#e2e8f0] border-t border-[#cbd5e1] px-3 py-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-neutral-300 hover:bg-neutral-400 border border-neutral-500 rounded font-semibold text-neutral-800 text-xs shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 3. MISCELLANEOUS POS SALES MODAL
// ----------------------------------------------------
export interface MiscSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  onAddTransaction: (tx: Transaction) => void;
}

export const MiscSalesModal: React.FC<MiscSalesModalProps> = ({
  isOpen,
  onClose,
  rooms,
  onAddTransaction,
}) => {
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]?.roomNumber || '101');
  const [category, setCategory] = useState<'Minibar' | 'Restaurant / Bar' | 'Laundry' | 'Airport Transfer' | 'Spa'>('Restaurant / Bar');
  const [description, setDescription] = useState('Dinner Service & Drinks');
  const [amount, setAmount] = useState<number>(25.00);

  if (!isOpen) return null;

  const quickItems = [
    { label: 'Minibar Soda & Snack', cat: 'Minibar', price: 8.50 },
    { label: 'Buffet Breakfast (2 Pax)', cat: 'Restaurant / Bar', price: 24.00 },
    { label: 'Laundry & Pressing Service', cat: 'Laundry', price: 15.00 },
    { label: 'Airport SUV Transfer', cat: 'Airport Transfer', price: 35.00 },
    { label: 'Khmer Traditional Spa (60min)', cat: 'Spa', price: 40.00 },
  ];

  const handlePostSale = (e: React.FormEvent) => {
    e.preventDefault();
    const targetRoom = rooms.find(r => r.roomNumber === selectedRoom);
    const newTx: Transaction = {
      id: `pos-${Date.now()}`,
      invoiceNumber: `POS-${selectedRoom}-${Math.floor(100 + Math.random() * 899)}`,
      date: new Date().toISOString().split('T')[0],
      description: `[${category}] ${description} (Room #${selectedRoom})`,
      type: 'income',
      category: 'Food & Beverage',
      amount: amount,
      paymentMethod: 'Credit Card',
      status: 'paid',
      guestOrVendor: targetRoom?.guestName || `Room ${selectedRoom} Guest`,
      roomNumber: selectedRoom,
      taxAmount: (amount * 10) / 100,
    };

    onAddTransaction(newTx);
    playChime();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#f0f4f8] text-[#1c2d42] rounded-lg shadow-2xl border border-[#94a3b8] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-[#d9ebfb] via-[#bddcf7] to-[#99c4eb] border-b border-[#7fa8cf] px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#1e3a5f]" />
            <span className="text-xs font-bold text-[#1e3a5f] tracking-wide">
              Post Miscellaneous POS Sales / Guest Charges
            </span>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center rounded bg-white/70 hover:bg-red-500 hover:text-white text-neutral-700 text-xs font-bold transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handlePostSale} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Target Room #</label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-neutral-300 rounded text-xs font-mono font-bold"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.roomNumber}>
                    Room {r.roomNumber} {r.guestName ? `(${r.guestName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Outlet / Service</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-white border border-neutral-300 rounded text-xs"
              >
                <option value="Restaurant / Bar">Restaurant / Bar</option>
                <option value="Minibar">Minibar</option>
                <option value="Laundry">Laundry</option>
                <option value="Airport Transfer">Airport Transfer</option>
                <option value="Spa">Spa & Wellness</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Item Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-neutral-300 rounded text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Total Charge Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1.5 text-neutral-500 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="0.5"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="w-full pl-6 pr-3 py-1.5 bg-white border border-neutral-300 rounded text-xs font-mono font-bold text-emerald-800"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="pt-2 border-t border-[#cbd5e1]">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1.5">Quick Presets</span>
            <div className="flex flex-wrap gap-1.5">
              {quickItems.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setDescription(item.label);
                    setCategory(item.cat as any);
                    setAmount(item.price);
                  }}
                  className="px-2 py-1 rounded bg-white hover:bg-neutral-100 border border-neutral-300 text-[10px] font-medium text-neutral-800 shadow-2xs transition-colors"
                >
                  {item.label} (${item.price.toFixed(2)})
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#cbd5e1] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-neutral-300 hover:bg-neutral-400 border border-neutral-500 rounded font-semibold text-neutral-800 text-xs shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 px-4 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded shadow-xs"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Post to Room Folio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 4. NIGHT AUDIT RUNNER MODAL
// ----------------------------------------------------
export interface AuthUser {
  username: string;
  fullName: string;
  role: string;
  isLoggedIn: boolean;
  lastLogin?: string;
}

export interface NightAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  transactions: Transaction[];
  settings: UserSettings;
  businessDate: string;
  currentUser?: AuthUser;
  onRunAuditAndRollDate: (
    targetNextDate?: string,
    daysCount?: number,
    postToFolio?: boolean,
    targetSplit?: number
  ) => void;
  onOpenReport?: () => void;
  onOpenBillDetails?: (room?: Room, guestName?: string) => void;
  onCheckInAllDueRooms?: () => void;
  onOpenTapeChart?: () => void;
}

const DEFAULT_ALLOWED_AUDIT_ROLES = [
  'Super Admin',
  'General Manager',
  'Front Desk Manager',
  'Night Auditor',
  'Chief Accountant',
];

export const NightAuditModal: React.FC<NightAuditModalProps> = ({
  isOpen,
  onClose,
  rooms,
  transactions,
  settings,
  businessDate,
  currentUser,
  onRunAuditAndRollDate,
  onOpenReport,
  onOpenBillDetails,
  onCheckInAllDueRooms,
  onOpenTapeChart,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [daysCount, setDaysCount] = useState<number>(1);
  const [customNextDate, setCustomNextDate] = useState<string>(() => {
    const d = new Date(businessDate || '2026-08-29');
    d.setDate(d.getDate() + 1);
    return isNaN(d.getTime()) ? '2026-08-30' : d.toISOString().split('T')[0];
  });
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [closedDate, setClosedDate] = useState<string>(businessDate);

  // Role Permissions Configuration
  const [allowedRoles, setAllowedRoles] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('winhms_night_audit_allowed_roles');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_ALLOWED_AUDIT_ROLES;
  });

  const [autoPostCharges, setAutoPostCharges] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('winhms_night_audit_auto_post_charges');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true;
  });

  const [targetSplit, setTargetSplit] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('winhms_night_audit_target_split');
      if (saved) return parseInt(saved, 10) || 1;
    } catch (e) {}
    return 1;
  });

  // Policy Rule: All rooms from chart must be checked in before running night audit
  const [requireCheckInAllRooms, setRequireCheckInAllRooms] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('winhms_night_audit_require_checkin_all_rooms');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true;
  });

  const [isRoleConfigModalOpen, setIsRoleConfigModalOpen] = useState(false);
  const [tempAllowedRoles, setTempAllowedRoles] = useState<string[]>(allowedRoles);
  const [tempAutoPost, setTempAutoPost] = useState<boolean>(autoPostCharges);
  const [tempTargetSplit, setTempTargetSplit] = useState<number>(targetSplit);
  const [tempRequireCheckInAllRooms, setTempRequireCheckInAllRooms] = useState<boolean>(requireCheckInAllRooms);

  // Compute rooms with pending arrivals on or before businessDate that must be checked in
  const pendingCheckInRooms = useMemo(() => {
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

  const hasPendingCheckIns = pendingCheckInRooms.length > 0;
  const isAuditBlockedByCheckInRule = requireCheckInAllRooms && hasPendingCheckIns;

  // Current active staff operator role
  const activeUserRole = currentUser?.role || 'Super Admin';
  const isUserAuthorized =
    allowedRoles.includes(activeUserRole) ||
    allowedRoles.includes('All Staff Roles') ||
    activeUserRole === 'Super Admin';

  // Sync custom next date when businessDate or daysCount changes
  useEffect(() => {
    const d = new Date(businessDate || '2026-08-29');
    d.setDate(d.getDate() + daysCount);
    const nextStr = isNaN(d.getTime()) ? '2026-08-30' : d.toISOString().split('T')[0];
    setCustomNextDate(nextStr);
    setClosedDate(businessDate);
    setIsCompleted(false);
    setCurrentStep(0);
    setAuditLog([]);
  }, [businessDate, daysCount, isOpen]);

  // Handle manual date change
  const handleDateChange = (newDateStr: string) => {
    setCustomNextDate(newDateStr);
    try {
      const t1 = new Date(closedDate).getTime();
      const t2 = new Date(newDateStr).getTime();
      if (!isNaN(t1) && !isNaN(t2) && t2 > t1) {
        const diffDays = Math.max(1, Math.round((t2 - t1) / (1000 * 60 * 60 * 24)));
        setDaysCount(diffDays);
      }
    } catch (e) {}
  };

  const handleQuickDaysSelect = (count: number) => {
    setDaysCount(count);
    const d = new Date(closedDate);
    d.setDate(d.getDate() + count);
    if (!isNaN(d.getTime())) {
      setCustomNextDate(d.toISOString().split('T')[0]);
    }
  };

  const handleSaveRoleConfig = () => {
    setAllowedRoles(tempAllowedRoles);
    setAutoPostCharges(tempAutoPost);
    setTargetSplit(tempTargetSplit);
    setRequireCheckInAllRooms(tempRequireCheckInAllRooms);
    try {
      localStorage.setItem('winhms_night_audit_allowed_roles', JSON.stringify(tempAllowedRoles));
      localStorage.setItem('winhms_night_audit_auto_post_charges', String(tempAutoPost));
      localStorage.setItem('winhms_night_audit_target_split', String(tempTargetSplit));
      localStorage.setItem('winhms_night_audit_require_checkin_all_rooms', String(tempRequireCheckInAllRooms));
    } catch (e) {}
    setIsRoleConfigModalOpen(false);
    if (settings.soundEffects) playChime();
  };

  if (!isOpen) return null;

  const occupiedRooms = rooms.filter((r) => r.status === 'occupied');
  const expectedRoomRevenue = occupiedRooms.reduce((acc, r) => acc + r.pricePerNight, 0);
  const expectedTax = (expectedRoomRevenue * settings.taxRatePercent) / 100;
  const totalDailyPosting = expectedRoomRevenue + expectedTax;

  // Compute sequence of dates for Day-by-Day counting
  const sequenceDates = Array.from({ length: daysCount }).map((_, idx) => {
    const d = new Date(closedDate);
    d.setDate(d.getDate() + idx);
    const iso = isNaN(d.getTime()) ? closedDate : d.toISOString().split('T')[0];
    return {
      dayNumber: idx + 1,
      iso,
      formatted: formatFolioDate(iso),
    };
  });

  const totalMultiDayAccommodation = expectedRoomRevenue * daysCount;
  const totalMultiDayTax = expectedTax * daysCount;
  const totalMultiDayGrand = totalDailyPosting * daysCount;

  const handleRunAudit = () => {
    if (!isUserAuthorized) return;

    // Hard Guard Clause: Enforce room role rule that all pending arrivals must be checked in from chart before running night audit
    if (isAuditBlockedByCheckInRule) {
      setAuditLog([
        `⚠️ Night Audit BLOCKED: Pre-Night Audit Rule Enforcement.`,
        `Policy Mandate: All rooms scheduled for arrival on or before ${closedDate} must be checked in from Tape Chart before running Night Audit.`,
        `Pending Arrivals (${pendingCheckInRooms.length}): ${pendingCheckInRooms.map((r) => `#${r.roomNumber}`).join(', ')}.`,
        `Action Required: Check in all rooms from the Tape Chart first, or click "Check In All Rooms from Chart Now" to resolve immediately.`,
      ]);
      return;
    }

    setIsRunning(true);
    setCurrentStep(1);
    const companyDisplayName = settings?.hotelName || 'Property PMS';
    setAuditLog([
      `${companyDisplayName} Security: Verifying operator role authorization...`,
      `Active Auditor: ${currentUser?.fullName || 'System Administrator'} (${activeUserRole}) - ✓ Authorized`,
      `Starting Day-by-Day Audit Count: ${daysCount} Day(s) [${sequenceDates.map((s) => s.formatted).join(' ➔ ')}]`,
    ]);

    setTimeout(() => {
      setCurrentStep(2);
      const postLogs: string[] = [];
      sequenceDates.forEach((s) => {
        postLogs.push(
          `[Day ${s.dayNumber}/${daysCount} - ${s.formatted}] Auto-Posting Room Charge from Tariff ($${expectedRoomRevenue.toFixed(2)}) to Split ${targetSplit} across ${occupiedRooms.length} occupied rooms.`
        );
      });
      setAuditLog((prev) => [...prev, ...postLogs]);

      setTimeout(() => {
        setCurrentStep(3);
        setAuditLog((prev) => [
          ...prev,
          `Balancing guest folios, cashier shifts, and tax ledgers ($${totalMultiDayTax.toFixed(2)} total tax)...`,
          `Synchronizing ${settings?.hotelName || 'property'} daily closing archives for ${closedDate}...`,
        ]);

        setTimeout(() => {
          setCurrentStep(4);
          setAuditLog((prev) => [
            ...prev,
            `Advancing PMS Business Date: ${closedDate} ➔ ${customNextDate} (${daysCount} day rollover).`,
            `Direct Folio Posting complete! All guest bills updated and ready for inspection.`,
          ]);

          // Execute actual multi-day date rollover & direct folio posting in App.tsx
          onRunAuditAndRollDate(customNextDate, daysCount, autoPostCharges, targetSplit);

          setIsRunning(false);
          setIsCompleted(true);
          playChime();
        }, 800);
      }, 700);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#f0f4f8] text-[#1c2d42] rounded-xl shadow-2xl border border-[#7fa8cf] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#1e3a8a] via-[#1d4ed8] to-[#2563eb] text-white px-4 py-2.5 flex items-center justify-between shadow-md select-none shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-900/70 border border-blue-400/40">
              <Moon className="w-4 h-4 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wide block">
                  {settings?.hotelName ? `${settings.hotelName} — Night Audit & Day-by-Day Folio Posting` : 'Night Audit & Day-by-Day Folio Posting'}
                </span>
                <span className="bg-amber-400 text-neutral-950 font-extrabold text-[9px] px-1.5 py-0.2 rounded-xs uppercase tracking-wider">
                  Role Controlled
                </span>
              </div>
              <span className="text-[10px] text-blue-200 font-mono">
                Automatic Room Charge Posting from Tariff Direct to Guest Bill Details
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/20 hover:bg-red-500 hover:text-white text-white text-sm font-bold transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5 text-xs overflow-y-auto flex-1">
          {/* Operator & Security Role Banner */}
          <div className="bg-white p-2.5 rounded-xl border border-[#cbd5e1] shadow-2xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-1.5 rounded-lg border ${
                  isUserAuthorized
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-red-50 border-red-300 text-red-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900 text-xs">
                    {currentUser?.fullName || 'System Administrator'}
                  </span>
                  <span className="font-mono text-[10px] bg-blue-50 text-blue-800 font-bold px-1.5 py-0.5 rounded border border-blue-200">
                    Role: {activeUserRole}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isUserAuthorized
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}
                  >
                    {isUserAuthorized ? '✓ Role Authorized' : '✗ Role Restricted'}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                  <span>Folio Auto-Post:</span>
                  <strong className="text-blue-700">
                    {autoPostCharges ? `Enabled (Direct to Split ${targetSplit})` : 'Disabled'}
                  </strong>
                  <span>• Allowed: {allowedRoles.join(', ')}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setTempAllowedRoles(allowedRoles);
                setTempAutoPost(autoPostCharges);
                setTempTargetSplit(targetSplit);
                setTempRequireCheckInAllRooms(requireCheckInAllRooms);
                setIsRoleConfigModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#ece9d8] hover:bg-neutral-200 text-neutral-800 border border-neutral-400 rounded-lg font-bold text-[11px] shadow-2xs cursor-pointer transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-blue-700" />
              <span>Set Role Access</span>
            </button>
          </div>

          {/* PRE-NIGHT AUDIT ROOM ROLE MANDATE: All rooms must be checked in from chart before run night audit */}
          {hasPendingCheckIns && requireCheckInAllRooms && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-3.5 text-amber-950 space-y-2.5 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-800 shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-xs text-amber-950">
                        Pre-Audit Room Role Mandate: All Rooms Must Be Checked In First
                      </h4>
                      <span className="bg-amber-200/90 text-amber-900 border border-amber-400 font-mono text-[10px] font-black px-1.5 py-0.2 rounded-full">
                        {pendingCheckInRooms.length} Due Arrival{pendingCheckInRooms.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                      Hotel system policy requires all reservations due on or before business date (<strong>{closedDate}</strong>) to be checked in from the chart before executing the Night Audit. The audit process is locked until arrivals are resolved.
                    </p>
                  </div>
                </div>

                {onOpenTapeChart && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTapeChart();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-neutral-100 border border-amber-300 rounded text-[11px] font-bold text-amber-950 shadow-2xs cursor-pointer shrink-0 transition-colors"
                  >
                    <span>View Chart</span>
                    <ArrowRight className="w-3 h-3 text-amber-700" />
                  </button>
                )}
              </div>

              {/* List of pending arrival rooms */}
              <div className="bg-white/90 border border-amber-300 rounded-lg p-2 max-h-24 overflow-y-auto">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-1 flex items-center justify-between">
                  <span>Pending Room Arrivals from Chart:</span>
                  <span className="font-mono text-[9px] text-amber-700">Must be checked in</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pendingCheckInRooms.map((r) => {
                    const dueRes = r.futureReservations?.find((fr) => businessDate ? fr.checkInDate <= businessDate : true);
                    const gName = dueRes?.guestName || r.guestName || 'Pending Guest';
                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-1.5 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded text-[11px] font-mono text-amber-950 font-semibold"
                      >
                        <span className="font-bold text-amber-900">Room #{r.roomNumber}:</span>
                        <span className="font-sans text-neutral-800 truncate max-w-[130px]">{gName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action row to Check In All Rooms right now */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-300/70">
                <span className="text-[10.5px] text-amber-800 italic">
                  Click below to execute bulk check-in and immediately unlock Night Audit:
                </span>
                {onCheckInAllDueRooms && (
                  <button
                    type="button"
                    onClick={() => {
                      onCheckInAllDueRooms();
                      if (settings.soundEffects) playChime();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Check In All Rooms from Chart Now</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Warning if role not authorized */}
          {!isUserAuthorized && (
            <div className="p-2.5 bg-red-50 border border-red-300 rounded-xl text-red-900 flex items-center gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <div>
                <strong>Role Authorization Restricted:</strong> Your active role ({activeUserRole}) is not permitted to execute the Night Audit and post accommodation charges. Click <strong>Set Role Access</strong> above to authorize your role.
              </div>
            </div>
          )}

          {/* Date Rollover & Count Day by Day Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Closing Business Date */}
            <div className="bg-gradient-to-b from-amber-50 to-amber-100/60 border border-amber-300/80 p-3 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-700" />
                <span>Current Business Date (To Close)</span>
              </span>
              <div className="font-mono text-base font-black text-amber-950">{closedDate}</div>
              <p className="text-[10px] text-amber-700 leading-tight">
                Operational date closing today. Balances and shifts will be archived.
              </p>
            </div>

            {/* Target Next Date & Day Count Selector */}
            <div className="bg-gradient-to-b from-emerald-50 to-emerald-100/60 border border-emerald-300/80 p-3 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-700" />
                  <span>Rollover Target & Count Days</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded">
                  Count: {daysCount} Day{daysCount > 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customNextDate}
                  disabled={isRunning || isCompleted}
                  onChange={(e) => e.target.value && handleDateChange(e.target.value)}
                  className="bg-white border border-emerald-400 rounded px-2 py-0.5 font-mono text-sm font-bold text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer disabled:opacity-75"
                />
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 5].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      disabled={isRunning || isCompleted}
                      onClick={() => handleQuickDaysSelect(cnt)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        daysCount === cnt
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-emerald-200/70 hover:bg-emerald-300 text-emerald-900'
                      }`}
                    >
                      +{cnt}D
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-emerald-700 leading-tight">
                Rolls system forward to <strong>{customNextDate}</strong> day by day.
              </p>
            </div>
          </div>

          {/* Day-by-Day Folio Posting Preview */}
          <div className="bg-white p-3.5 rounded-xl border border-[#cbd5e1] space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-neutral-800 text-xs">
                  Direct Room Charge Posting Plan from Tariff (Day by Day)
                </h4>
              </div>
              <span className="font-mono text-[11px] text-neutral-600">
                {occupiedRooms.length} Occupied Room{occupiedRooms.length !== 1 ? 's' : ''} • Split {targetSplit}
              </span>
            </div>

            {/* Sequence of audited days banner */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-2 text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-blue-900">
                <span>Sequential Audit Posting Schedule:</span>
                <span className="font-mono text-[10px] text-blue-700">
                  {daysCount} Day{daysCount > 1 ? 's' : ''} sequentially posted
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {sequenceDates.map((s) => (
                  <div
                    key={s.dayNumber}
                    className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-blue-300 text-[11px] font-mono text-blue-950 font-bold shadow-2xs"
                  >
                    <span className="text-[10px] text-blue-600 font-semibold">Day {s.dayNumber}:</span>
                    <span>{s.formatted}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-neutral-400" />
                    <span className="text-emerald-700">${expectedRoomRevenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Occupied Rooms Detailed Ledger Breakdown Table */}
            <div className="border border-neutral-200 rounded-lg overflow-hidden max-h-36 overflow-y-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-neutral-100 text-neutral-700 border-b border-neutral-200 text-[10px] uppercase font-bold sticky top-0">
                  <tr>
                    <th className="px-2 py-1">Room #</th>
                    <th className="px-2 py-1">Guest Name</th>
                    <th className="px-2 py-1 text-right">Night Rate</th>
                    <th className="px-2 py-1 text-center">Days Count</th>
                    <th className="px-2 py-1 text-right">Total To Post</th>
                    <th className="px-2 py-1 text-center">Direct Bill Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {occupiedRooms.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-3 text-neutral-500 italic">
                        No occupied rooms currently in house.
                      </td>
                    </tr>
                  ) : (
                    occupiedRooms.map((r) => {
                      const roomMultiTotal = r.pricePerNight * daysCount;
                      return (
                        <tr key={r.id} className="hover:bg-blue-50/40 font-mono">
                          <td className="px-2 py-1 font-bold text-neutral-900">{r.roomNumber}</td>
                          <td className="px-2 py-1 font-sans text-neutral-800 truncate max-w-[140px]">
                            {r.guestName || 'In-House Guest'}
                          </td>
                          <td className="px-2 py-1 text-right text-neutral-700">
                            ${r.pricePerNight.toFixed(2)}
                          </td>
                          <td className="px-2 py-1 text-center font-bold text-blue-700">
                            {daysCount} {daysCount === 1 ? 'Night' : 'Nights'}
                          </td>
                          <td className="px-2 py-1 text-right font-black text-emerald-800">
                            ${roomMultiTotal.toFixed(2)}
                          </td>
                          <td className="px-2 py-1 text-center">
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] px-1.5 py-0.2 rounded font-sans font-bold">
                              ✓ Direct Split {targetSplit}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
              <div className="bg-neutral-50 p-2 rounded border border-neutral-200">
                <span className="text-neutral-500 block text-[10px]">Total Accommodation:</span>
                <strong className="text-neutral-900 font-mono text-xs font-bold">
                  ${totalMultiDayAccommodation.toFixed(2)}
                </strong>
                <span className="text-[9px] text-neutral-400 block font-mono">
                  (${expectedRoomRevenue.toFixed(2)}/day × {daysCount}d)
                </span>
              </div>
              <div className="bg-neutral-50 p-2 rounded border border-neutral-200">
                <span className="text-neutral-500 block text-[10px]">
                  Estimated VAT/Tax ({settings.taxRatePercent}%):
                </span>
                <strong className="text-neutral-900 font-mono text-xs font-bold">
                  ${totalMultiDayTax.toFixed(2)}
                </strong>
                <span className="text-[9px] text-neutral-400 block font-mono">
                  (${expectedTax.toFixed(2)}/day × {daysCount}d)
                </span>
              </div>
              <div className="bg-blue-50 p-2 rounded border border-blue-200">
                <span className="text-blue-700 block text-[10px] font-bold">Total Folio Charges:</span>
                <strong className="text-blue-900 font-mono text-xs font-black">
                  ${totalMultiDayGrand.toFixed(2)}
                </strong>
                <span className="text-[9px] text-blue-600 block font-mono">
                  Auto-posted to Split {targetSplit}
                </span>
              </div>
            </div>
          </div>

          {/* Progress or Completion Banner */}
          {isCompleted ? (
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-emerald-100/70 to-emerald-50 border border-emerald-400 rounded-xl text-emerald-950 space-y-2.5 shadow-sm animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-black text-xs text-emerald-900">
                    Night Audit Successfully Completed & Folios Posted Day by Day!
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    Business date advanced from <strong className="font-mono">{closedDate}</strong> to{' '}
                    <strong className="font-mono bg-emerald-200/80 px-1.5 py-0.2 rounded">
                      {customNextDate}
                    </strong>{' '}
                    ({daysCount} day{daysCount > 1 ? 's' : ''} rollover).
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-emerald-800 bg-white/90 p-2 rounded-lg border border-emerald-200 font-mono space-y-1">
                <div>✓ Audited Days: {sequenceDates.map((s) => s.formatted).join(', ')}</div>
                <div>
                  ✓ Auto-Posted {occupiedRooms.length * daysCount} total Room Charges from Tariff ($
                  {totalMultiDayAccommodation.toFixed(2)}) directly to guest folios (Split {targetSplit})
                </div>
                <div>✓ Financial transaction journal & manager flash closing statistics updated</div>
              </div>

              {/* Direct Inspect Folio Buttons */}
              {occupiedRooms.length > 0 && onOpenBillDetails && (
                <div className="pt-1">
                  <div className="text-[11px] font-bold text-emerald-900 mb-1 flex items-center gap-1">
                    <span>Direct Bill Detail Verification:</span>
                    <span className="font-normal text-[10px] text-emerald-700">
                      (Click below to inspect newly posted charges in Bill Detail)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {occupiedRooms.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onOpenBillDetails(r, r.guestName)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-emerald-200" />
                        <span>Room {r.roomNumber} Bill Detail</span>
                        <span className="font-mono bg-emerald-900/50 px-1 rounded text-[9px]">
                          +${(r.pricePerNight * daysCount).toFixed(0)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : isRunning ? (
            <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl space-y-2 text-blue-950">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Executing Night Audit Step {currentStep} of 4...</span>
                <span className="animate-spin font-mono">⏳</span>
              </div>
              <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                ></div>
              </div>
              <div className="text-[10px] font-mono text-blue-800 bg-white/90 p-1.5 rounded border border-blue-200 max-h-24 overflow-y-auto space-y-0.5">
                {auditLog.map((log, i) => (
                  <div key={i}>• {log}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-neutral-600 text-[11px] bg-neutral-100/90 p-2.5 rounded-lg border border-neutral-300 leading-relaxed">
              💡 <strong>How Day-by-Day Folio Posting Works:</strong> When executed by an authorized role, {settings?.hotelName || 'the PMS system'} iterates through each day from <strong>{closedDate}</strong> to <strong>{customNextDate}</strong>, calculates the daily accommodation charge for every in-house guest, and writes it directly to their Bill Detail (Split {targetSplit}).
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-[#cbd5e1] flex items-center justify-between gap-2 shrink-0">
            <div className="text-[10px] text-neutral-500 font-mono">
              {!isCompleted &&
                `Schedule: ${closedDate} ➔ ${customNextDate} (${daysCount} Day${daysCount > 1 ? 's' : ''})`}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 rounded-lg font-semibold text-neutral-800 text-xs shadow-2xs cursor-pointer transition-colors"
              >
                {isCompleted ? 'Close' : 'Cancel'}
              </button>

              {isCompleted && onOpenReport && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenReport();
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-all hover:scale-102"
                >
                  <span>📑 View Closing Report</span>
                </button>
              )}

              {!isCompleted && (
                <button
                  type="button"
                  onClick={handleRunAudit}
                  disabled={isRunning || !isUserAuthorized || isAuditBlockedByCheckInRule}
                  title={
                    isAuditBlockedByCheckInRule
                      ? `Night Audit blocked: ${pendingCheckInRooms.length} room arrival(s) must be checked in from Tape Chart first`
                      : !isUserAuthorized
                      ? 'Unauthorized role'
                      : 'Execute Night Audit'
                  }
                  className={`flex items-center gap-1.5 px-5 py-1.5 font-bold text-xs rounded-lg shadow-md transition-all ${
                    isAuditBlockedByCheckInRule || !isUserAuthorized
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed border border-neutral-400 opacity-80'
                      : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95 hover:bg-blue-500'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {isRunning
                      ? 'Posting Folio Balances...'
                      : isAuditBlockedByCheckInRule
                      ? `Check In All Rooms First (${pendingCheckInRooms.length} Pending)`
                      : `Run Night Audit & Post Folios (${daysCount}D)`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Configuration Modal Dialog */}
      {isRoleConfigModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setIsRoleConfigModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#ece9d8] border-2 border-[#0055ea] shadow-2xl rounded-xs overflow-hidden text-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Titlebar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-[#0055ea] via-[#2a77f4] to-[#0055ea] text-white select-none">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-300" />
                <span className="font-bold text-xs tracking-wide">
                  {settings?.hotelName ? `${settings.hotelName} Security & Role Setup` : 'Security & Role Setup'} — Night Audit & Folio Direct Posting
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

            <div className="p-4 space-y-3 text-xs">
              {/* Active Operator Status */}
              <div className="bg-white border border-[#7f9db9] p-2.5 rounded-xs space-y-1 shadow-2xs">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
                  <span className="text-neutral-600 font-semibold">Active Staff Operator:</span>
                  <span className="font-bold text-neutral-900">
                    {currentUser?.fullName || 'System Administrator'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-neutral-600 font-semibold">Logged Role:</span>
                  <span className="font-mono font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 border border-blue-200 rounded-2xs">
                    {activeUserRole}
                  </span>
                </div>
              </div>

              {/* Roles Checklist */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-800 flex items-center justify-between">
                  <span>Roles Permitted to Run Night Audit & Post Folio:</span>
                  <span className="text-neutral-500 font-normal">(Select all that apply)</span>
                </label>
                <div className="bg-white border border-[#7f9db9] p-2 rounded-xs space-y-1.5 max-h-44 overflow-y-auto">
                  {[
                    { role: 'Super Admin', desc: 'Highest authority (Full ledger balancing & audit)' },
                    { role: 'General Manager', desc: 'Hotel executive (Authorizes audit & financials)' },
                    { role: 'Chief Accountant', desc: 'Finance controller (Audit & ledger sign-off)' },
                    { role: 'Night Auditor', desc: 'Designated night shift audit controller' },
                    { role: 'Front Desk Manager', desc: 'Front office supervisor (Shift balancing)' },
                    { role: 'Front Desk Operator', desc: 'Standard staff (Check-in, checkout, cashiering)' },
                    { role: 'Receptionist', desc: 'Frontline reception and guest assistance' },
                    { role: 'All Staff Roles', desc: 'Allow any logged-in staff member without restriction' },
                  ].map((item) => {
                    const isChecked = tempAllowedRoles.includes(item.role);
                    return (
                      <label
                        key={item.role}
                        className={`flex items-start gap-2 p-1.5 rounded-xs border cursor-pointer transition-colors ${
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
                          <p className="text-[10px] text-neutral-600 leading-tight">{item.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Direct Posting Policy Options */}
              <div className="bg-white border border-[#7f9db9] p-2.5 rounded-xs space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempAutoPost}
                    onChange={(e) => setTempAutoPost(e.target.checked)}
                    className="rounded border-neutral-400 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-neutral-900 block">
                      Auto-Post Room Charge from Tariff to Bill Detail
                    </span>
                    <span className="text-[10px] text-neutral-600 block">
                      Automatically appends daily room charge based on room tariff to guest folio during audit.
                    </span>
                  </div>
                </label>

                <div className="pt-1.5 border-t border-neutral-200 flex items-center justify-between">
                  <span className="font-bold text-neutral-800">Target Folio Split:</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="targetSplit"
                        checked={tempTargetSplit === 1}
                        onChange={() => setTempTargetSplit(1)}
                        className="text-blue-600"
                      />
                      <span>Split 1 (Tariff)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="targetSplit"
                        checked={tempTargetSplit === 2}
                        onChange={() => setTempTargetSplit(2)}
                        className="text-blue-600"
                      />
                      <span>Split 2 (Company)</span>
                    </label>
                  </div>
                </div>

                {/* Pre-Night Audit Mandate: All Rooms Must Be Checked In */}
                <div className="pt-2 border-t border-neutral-200">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempRequireCheckInAllRooms}
                      onChange={(e) => setTempRequireCheckInAllRooms(e.target.checked)}
                      className="mt-0.5 rounded border-neutral-400 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-neutral-900">
                          Pre-Audit Mandate: All Rooms Must Be Checked In
                        </span>
                        <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1 rounded-2xs uppercase">
                          Policy
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-600 block leading-tight mt-0.5">
                        Requires all rooms scheduled for arrival from the tape chart to be checked in before running Night Audit. Locks the audit button while pending arrivals exist.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#b5b5b5]">
                <button
                  type="button"
                  onClick={() => setIsRoleConfigModalOpen(false)}
                  className="px-3 py-1 bg-[#ece9d8] hover:bg-neutral-200 border border-neutral-500 rounded-xs text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRoleConfig}
                  className="px-4 py-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xs text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Role Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 5. USER LOGIN & AUTHENTICATION MODAL
// ----------------------------------------------------
export interface UserLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onLogin: (username: string, password: string) => boolean;
  onLogout: () => void;
}

export const UserLoginModal: React.FC<UserLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [username, setUsername] = useState('Administrator');
  const [password, setPassword] = useState('Admin1234');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const success = onLogin(username, password);
    if (success) {
      playChime();
      setSuccessMsg(`Welcome back, ${username}! Authenticated successfully.`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1000);
    } else {
      setErrorMsg('Invalid username or password. Please use Administrator / Admin1234');
    }
  };

  const handleQuickLoginAdmin = () => {
    setUsername('Administrator');
    setPassword('Admin1234');
    const success = onLogin('Administrator', 'Admin1234');
    if (success) {
      playChime();
      setSuccessMsg('Logged in as Administrator (Admin1234)');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#f0f4f8] text-[#1c2d42] rounded-lg shadow-2xl border border-[#94a3b8] overflow-hidden flex flex-col">
        {/* Title bar */}
        <div className="bg-gradient-to-r from-[#d9ebfb] via-[#bddcf7] to-[#99c4eb] border-b border-[#7fa8cf] px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px] font-black">
              ✓
            </div>
            <span className="text-xs font-bold text-[#1e3a5f] tracking-wide">
              PMS User Authentication & Security Access
            </span>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center rounded bg-white/70 hover:bg-red-500 hover:text-white text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5 text-xs">
          {/* Current Status Card */}
          <div className="bg-white p-3 rounded border border-[#cbd5e1] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-neutral-900">{currentUser.fullName}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    currentUser.isLoggedIn 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {currentUser.isLoggedIn ? 'Online / Active' : 'Logged Out'}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 font-mono">
                  Role: <span className="text-blue-900 font-bold">{currentUser.role}</span>
                </div>
              </div>
            </div>

            {currentUser.isLoggedIn && (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  playChime();
                }}
                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 font-bold rounded text-[11px] transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            )}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="bg-white p-3.5 rounded border border-[#cbd5e1] space-y-3">
            <h4 className="font-bold text-neutral-800 text-xs uppercase tracking-wider flex items-center justify-between">
              <span>{currentUser.isLoggedIn ? 'Switch User / Re-authenticate' : 'Operator Login'}</span>
              <span className="text-[10px] text-blue-700 normal-case font-mono font-normal">Terminal #01</span>
            </h4>

            {errorMsg && (
              <div className="p-2 bg-red-50 border border-red-300 rounded text-red-800 text-[11px] font-semibold">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-[11px] font-semibold">
                {successMsg}
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                Username / Operator ID
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Administrator"
                className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-300 rounded text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-neutral-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-blue-600 hover:underline"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-300 rounded text-xs font-mono font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Quick credentials helper banner */}
            <div className="p-2 bg-blue-50/80 border border-blue-200 rounded text-[11px] text-blue-900 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold">Administrator Credentials:</span>
                <button
                  type="button"
                  onClick={handleQuickLoginAdmin}
                  className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[10px] cursor-pointer shadow-2xs"
                >
                  Quick Login
                </button>
              </div>
              <div className="font-mono text-[10.5px]">
                Username: <strong className="text-blue-950">Administrator</strong> &nbsp;|&nbsp; Password: <strong className="text-blue-950">Admin1234</strong>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 rounded font-semibold text-neutral-800 text-xs shadow-2xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-xs rounded shadow-xs cursor-pointer"
              >
                Sign In / Authenticate
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
