import React, { useState } from 'react';
import { 
  X, 
  History, 
  UserCheck, 
  Search, 
  PlusCircle, 
  Printer, 
  Check, 
  ShieldCheck, 
  Clock, 
  User, 
  FileText,
  Calendar,
  AlertCircle
} from 'lucide-react';

export interface ReservationAuditRecord {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  actionType: 'Created' | 'Amended' | 'Rate / Tariff' | 'Room Assignment' | 'Deposit / Payment' | 'Status Change' | 'Supervisor Note';
  details: string;
  terminal: string;
}

interface ReservationAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  rsrNo: string;
  guestName: string;
  roomNumbers: string[];
  currentStatus: string;
  currentRate: number;
  currentPlan: string;
  auditLogs: ReservationAuditRecord[];
  onAddAuditLog: (record: ReservationAuditRecord) => void;
  staffList?: { name: string; role: string }[];
}

export const ReservationAuditModal: React.FC<ReservationAuditModalProps> = ({
  isOpen,
  onClose,
  rsrNo,
  guestName,
  roomNumbers,
  currentStatus,
  currentRate,
  currentPlan,
  auditLogs,
  onAddAuditLog,
  staffList = [
    { name: 'Julian Vance', role: 'Front Desk Manager' },
    { name: 'Alexandre Laurent', role: 'General Manager' },
    { name: 'Carlos Gomez', role: 'Receptionist' },
    { name: 'Nathalie Dupont', role: 'Chief Accountant' },
    { name: 'Elena Rostova', role: 'Housekeeping Lead' },
    { name: 'Devon Reed', role: 'Night Auditor' }
  ]
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  
  // New Audit Entry form state
  const [newOperator, setNewOperator] = useState<string>(staffList[0]?.name || 'Julian Vance');
  const [newActionType, setNewActionType] = useState<ReservationAuditRecord['actionType']>('Supervisor Note');
  const [newNote, setNewNote] = useState('');
  const [printSuccessNotice, setPrintSuccessNotice] = useState(false);

  if (!isOpen) return null;

  const currentStaff = staffList.find(s => s.name === newOperator) || staffList[0];

  const handleAddNewRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)}`;
    const timeFormatted = now.toTimeString().split(' ')[0];

    const newRecord: ReservationAuditRecord = {
      id: `audit-${Date.now()}`,
      timestamp: `${dateFormatted} ${timeFormatted}`,
      userName: newOperator,
      userRole: currentStaff?.role || 'Front Office',
      actionType: newActionType,
      details: newNote.trim(),
      terminal: 'WS-FRONTDESK-01 (Current Operator)'
    };

    onAddAuditLog(newRecord);
    setNewNote('');
  };

  const handlePrintAuditTrail = () => {
    setPrintSuccessNotice(true);
    setTimeout(() => setPrintSuccessNotice(false), 3500);
    try {
      window.print();
    } catch {
      // safe fallback in iframe
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.terminal.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedFilter === 'ALL') return true;
    return log.actionType.toLowerCase().includes(selectedFilter.toLowerCase());
  });

  const createdLog = auditLogs.slice().reverse().find(l => l.actionType === 'Created') || auditLogs[auditLogs.length - 1];
  const lastAmendLog = auditLogs.find(l => l.actionType !== 'Created') || auditLogs[0];

  const getActionBadgeClass = (actionType: ReservationAuditRecord['actionType']) => {
    switch (actionType) {
      case 'Created':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Amended':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Rate / Tariff':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Room Assignment':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'Deposit / Payment':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Status Change':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'Supervisor Note':
      default:
        return 'bg-slate-100 text-slate-900 border-slate-300';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 backdrop-blur-[1.5px] p-2 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl bg-[#f0f4f9] rounded shadow-[0_25px_70px_rgba(0,0,0,0.9)] border-[3px] border-[#9bc2e6] text-[#111827] overflow-hidden text-[11px] font-sans flex flex-col max-h-[92vh] animate-in zoom-in-95"
        style={{ fontFamily: "'Tahoma', 'Segoe UI', Arial, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#d9ebfb] via-[#bddcf7] to-[#99c4eb] border-b border-[#7fa8cf] px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-800" />
            <span className="font-bold text-[#1e3a5f] text-xs sm:text-sm tracking-wide">
              Reservation Audit Trail & User Modification History — Rsr #{rsrNo || '15'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrintAuditTrail}
              className="flex items-center gap-1 px-2 h-5.5 rounded border border-[#89a7c4] bg-[#eef5fc] hover:bg-[#d8e8f8] text-[10px] font-semibold text-neutral-800 shadow-2xs cursor-pointer"
              title="Print Audit Trail"
            >
              <Printer className="w-3 h-3 text-neutral-600" />
              <span className="hidden sm:inline">Print Log</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-5.5 h-5.5 rounded border border-[#89a7c4] bg-[#eef5fc] hover:bg-rose-100 hover:border-rose-400 hover:text-rose-800 flex items-center justify-center text-neutral-700 font-bold transition-colors cursor-pointer"
              title="Close Audit Window"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Print Toast Alert */}
        {printSuccessNotice && (
          <div className="bg-emerald-100 border-b border-emerald-300 px-3 py-1 flex items-center gap-2 text-emerald-900 text-[10.5px] font-semibold">
            <Check className="w-3.5 h-3.5 text-emerald-700" />
            <span>Audit trail printed / generated successfully for front desk compliance ledger.</span>
          </div>
        )}

        {/* Top Summary Info Banner */}
        <div className="bg-white border-b border-neutral-300 p-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[10.5px]">
          <div className="bg-[#f8fafc] border border-neutral-200 p-2 rounded-xs">
            <div className="text-neutral-500 text-[9.5px] font-semibold uppercase">Guest & Room Info</div>
            <div className="font-bold text-neutral-900 truncate">{guestName || 'Ms. LEAKENA'}</div>
            <div className="text-blue-800 font-medium">Room {roomNumbers.join(', ')} ({currentPlan || 'Room with ABF'})</div>
          </div>

          <div className="bg-[#f8fafc] border border-neutral-200 p-2 rounded-xs">
            <div className="text-neutral-500 text-[9.5px] font-semibold uppercase">Created Record</div>
            <div className="font-bold text-emerald-900 truncate">
              {createdLog?.userName || 'Julian Vance'}
            </div>
            <div className="text-neutral-600 text-[9.5px] font-mono">
              {createdLog?.timestamp || '22/08/26 11:08'} ({createdLog?.userRole || 'Front Desk'})
            </div>
          </div>

          <div className="bg-[#f8fafc] border border-neutral-200 p-2 rounded-xs">
            <div className="text-neutral-500 text-[9.5px] font-semibold uppercase">Last Amended By</div>
            <div className="font-bold text-purple-900 truncate">
              {lastAmendLog?.userName || 'Carlos Gomez'}
            </div>
            <div className="text-neutral-600 text-[9.5px] font-mono">
              {lastAmendLog?.timestamp || '22/08/26 11:42'} ({lastAmendLog?.userRole || 'Receptionist'})
            </div>
          </div>

          <div className="bg-[#f8fafc] border border-neutral-200 p-2 rounded-xs">
            <div className="text-neutral-500 text-[9.5px] font-semibold uppercase">Audit Activity Count</div>
            <div className="font-bold text-blue-900 text-xs">
              {auditLogs.length} Logged Events
            </div>
            <div className="text-neutral-600 text-[9.5px]">
              Status: <span className="font-semibold text-emerald-800">{currentStatus || 'Confirmed'}</span> • Rate: ${currentRate.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-[#edf3fa] border-b border-neutral-300 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1 flex-wrap text-[10px]">
            <span className="text-neutral-500 font-semibold mr-1">Filter:</span>
            {[
              { label: `All (${auditLogs.length})`, val: 'ALL' },
              { label: 'Created', val: 'Created' },
              { label: 'Amended', val: 'Amended' },
              { label: 'Rate & Plan', val: 'Rate' },
              { label: 'Deposit / Pay', val: 'Deposit' },
              { label: 'Notes', val: 'Note' }
            ].map(tab => (
              <button
                key={tab.val}
                type="button"
                onClick={() => setSelectedFilter(tab.val)}
                className={`px-2 py-0.5 rounded-xs font-semibold border transition-all cursor-pointer ${
                  selectedFilter === tab.val
                    ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                    : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user, action, field, terminal..."
              className="w-full h-6 pl-7 pr-2 bg-white border border-neutral-400 rounded-xs text-[10.5px] focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Main Audit Records Table */}
        <div className="flex-1 overflow-y-auto bg-white min-h-[220px] max-h-[360px]">
          <table className="w-full text-left border-collapse text-[10.5px]">
            <thead className="bg-[#f0f4f9] text-[#1e3a5f] font-bold border-b border-neutral-300 sticky top-0 z-10 text-[9.5px] uppercase tracking-wider">
              <tr>
                <th className="py-1.5 px-2 w-8 text-center">#</th>
                <th className="py-1.5 px-2.5 w-32">Date & Time</th>
                <th className="py-1.5 px-2.5 w-44">User / Staff Operator</th>
                <th className="py-1.5 px-2 w-28 text-center">Action Type</th>
                <th className="py-1.5 px-3">Modification Details & Changes</th>
                <th className="py-1.5 px-2 w-36 text-neutral-500">Terminal / Station</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => (
                  <tr 
                    key={log.id || index}
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="py-1.5 px-2 text-center text-neutral-400 font-mono text-[9.5px]">
                      {index + 1}
                    </td>
                    <td className="py-1.5 px-2.5 whitespace-nowrap font-mono text-neutral-800 text-[10px]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-400 inline" />
                        <span>{log.timestamp}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-900 font-bold text-[9px] shrink-0">
                          {log.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-neutral-900 leading-tight">{log.userName}</div>
                          <div className="text-[9px] text-neutral-500 font-medium">{log.userRole}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-center whitespace-nowrap">
                      <span className={`inline-block px-1.5 py-0.5 rounded-xs border text-[9px] font-bold ${getActionBadgeClass(log.actionType)}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-neutral-800 font-medium leading-relaxed">
                      {log.details}
                    </td>
                    <td className="py-1.5 px-2 text-neutral-500 font-mono text-[9px] whitespace-nowrap">
                      {log.terminal}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-400 italic">
                    No audit records match your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Manual Audit Remark / Supervisor Note Section */}
        <form 
          onSubmit={handleAddNewRecord} 
          className="bg-[#edf3fa] border-t border-[#cbd5e1] p-2.5 space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 font-bold text-[#1e3a5f] text-[10.5px]">
              <PlusCircle className="w-3.5 h-3.5 text-blue-700" />
              <span>Record Supervisor / Front Desk Audit Note:</span>
            </div>
            <span className="text-[9.5px] text-neutral-500">
              Entries are timestamped and preserved in the reservation audit ledger.
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Operator Selection */}
            <div className="flex items-center gap-1">
              <label className="text-[10px] text-neutral-600 font-semibold">User:</label>
              <select
                value={newOperator}
                onChange={(e) => setNewOperator(e.target.value)}
                className="h-6 px-1.5 bg-white border border-neutral-400 rounded-xs text-[10px] font-medium"
              >
                {staffList.map(staff => (
                  <option key={staff.name} value={staff.name}>
                    {staff.name} ({staff.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Action Type */}
            <div className="flex items-center gap-1">
              <label className="text-[10px] text-neutral-600 font-semibold">Action:</label>
              <select
                value={newActionType}
                onChange={(e) => setNewActionType(e.target.value as ReservationAuditRecord['actionType'])}
                className="h-6 px-1.5 bg-white border border-neutral-400 rounded-xs text-[10px] font-medium"
              >
                <option value="Supervisor Note">Supervisor Note</option>
                <option value="Amended">Amended</option>
                <option value="Rate / Tariff">Rate / Tariff Change</option>
                <option value="Room Assignment">Room Assignment</option>
                <option value="Deposit / Payment">Deposit / Payment</option>
                <option value="Status Change">Status Change</option>
              </select>
            </div>

            {/* Note text input */}
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="e.g. Guest requested ABF breakfast plan added; authorized by Front Desk Manager..."
              className="flex-1 min-w-[200px] h-6 px-2 bg-white border border-neutral-400 rounded-xs text-[10.5px] focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={!newNote.trim()}
              className="px-3 h-6 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white border border-[#0369a1] rounded-xs font-bold text-[10px] shadow-2xs cursor-pointer active:scale-95 transition-colors whitespace-nowrap"
            >
              + Log Entry
            </button>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="bg-[#e9eff6] px-3 py-2 border-t border-[#cbd5e1] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-neutral-600">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Compliance Verified: All reservation amendments are strictly logged with staff ID & station IP.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-6 bg-white hover:bg-neutral-100 border border-neutral-400 rounded-xs font-semibold text-neutral-800 text-[10.5px] shadow-2xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
