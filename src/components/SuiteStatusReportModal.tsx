import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Building2, 
  DoorOpen, 
  User, 
  Calendar, 
  CheckCircle, 
  Brush, 
  Wrench, 
  Printer, 
  Download, 
  X, 
  Search, 
  Layers, 
  BedDouble, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Room, UserSettings, RoomType } from '../types';
import { formatCurrency, getRoomStatusBadge } from '../utils/helpers';
import { AuthUser } from './PMSActionModals';

export interface SuiteStatusReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  settings: UserSettings;
  businessDate?: string;
  currentUser?: AuthUser;
}

export const SuiteStatusReportModal: React.FC<SuiteStatusReportModalProps> = ({
  isOpen,
  onClose,
  rooms = [],
  settings,
  businessDate = '2026-08-29',
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [reportView, setReportView] = useState<'kpi_summary' | 'detailed_list' | 'floor_matrix'>('kpi_summary');
  const printRef = useRef<HTMLDivElement>(null);

  const currencySymbol = settings?.currency?.symbol || '$';

  const stats = useMemo(() => {
    const total = rooms.length;
    const occupied = rooms.filter((r) => r.status === 'occupied').length;
    const reserved = rooms.filter((r) => r.status === 'reserved').length;
    const available = rooms.filter((r) => r.status === 'available').length;
    const cleaning = rooms.filter((r) => r.status === 'cleaning' || r.cleaningStatus === 'dirty' || r.cleaningStatus === 'in_progress').length;
    const outOfService = rooms.filter((r) => r.status === 'out_of_service' || r.status === 'maintenance').length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    // By Room Type
    const typeBreakdown: Record<string, { total: number; occupied: number; available: number; reserved: number }> = {
      'Standard Room': { total: 0, occupied: 0, available: 0, reserved: 0 },
      'Deluxe Suite': { total: 0, occupied: 0, available: 0, reserved: 0 },
      'Presidential Suite': { total: 0, occupied: 0, available: 0, reserved: 0 }
    };

    rooms.forEach((r) => {
      const typeKey = r.type || 'Standard Room';
      if (!typeBreakdown[typeKey]) {
        typeBreakdown[typeKey] = { total: 0, occupied: 0, available: 0, reserved: 0 };
      }
      const item = typeBreakdown[typeKey];
      item.total += 1;
      if (r.status === 'occupied') item.occupied += 1;
      if (r.status === 'available') item.available += 1;
      if (r.status === 'reserved') item.reserved += 1;
    });

    // By Floor
    const floorBreakdown: Record<number, { total: number; occupied: number; available: number; dirty: number }> = {};
    rooms.forEach((r) => {
      const floorKey = typeof r.floor === 'number' ? r.floor : 1;
      if (!floorBreakdown[floorKey]) {
        floorBreakdown[floorKey] = { total: 0, occupied: 0, available: 0, dirty: 0 };
      }
      const item = floorBreakdown[floorKey];
      item.total += 1;
      if (r.status === 'occupied') item.occupied += 1;
      if (r.status === 'available') item.available += 1;
      if (r.cleaningStatus === 'dirty' || r.status === 'cleaning') item.dirty += 1;
    });

    return { 
      total, 
      occupied, 
      reserved, 
      available, 
      cleaning, 
      outOfService, 
      occupancyRate,
      typeBreakdown,
      floorBreakdown
    };
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const roomNo = (r.roomNumber || '').toLowerCase();
      const guest = (r.guestName || '').toLowerCase();
      const roomType = (r.type || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || roomNo.includes(q) || guest.includes(q) || roomType.includes(q);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesFloor = floorFilter === 'all' || String(r.floor) === floorFilter;
      const matchesType = typeFilter === 'all' || r.type === typeFilter;

      return matchesSearch && matchesStatus && matchesFloor && matchesType;
    });
  }, [rooms, searchQuery, statusFilter, floorFilter, typeFilter]);

  const floors = useMemo(() => {
    const list = Array.from(new Set(rooms.map((r) => (typeof r.floor === 'number' ? r.floor : 1))));
    return list.sort((a, b) => Number(a) - Number(b));
  }, [rooms]);

  const roomTypes: RoomType[] = ['Standard Room', 'Deluxe Suite', 'Presidential Suite'];

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['HOTEL SUITE & ROOM OPERATIONS STATUS REPORT', settings?.hotelName || 'Grand Phnom Penh Hotel'],
      ['Business Date', businessDate],
      ['Generated On', new Date().toLocaleString()],
      ['Operator', currentUser?.fullName || 'Administrator'],
      [],
      ['--- SUMMARY KPI METRICS ---'],
      ['Total Suites', stats.total],
      ['Occupied Suites', `${stats.occupied} (${stats.occupancyRate}%)`],
      ['Reserved Suites', stats.reserved],
      ['Available Ready', stats.available],
      ['Housekeeping / Cleaning', stats.cleaning],
      ['Out of Service / Maintenance', stats.outOfService],
      [],
      ['--- SUITE ROSTER DETAIL ---'],
      ['Room Number', 'Floor', 'Type', 'Status', 'Cleaning Status', 'Guest Name', 'Price / Night', 'Check-In', 'Check-Out']
    ];

    rooms.forEach((r) => {
      csvRows.push([
        r.roomNumber || '',
        r.floor || 1,
        r.type || 'Standard Room',
        (r.status || '').toUpperCase(),
        (r.cleaningStatus || 'clean').toUpperCase(),
        r.guestName || '-',
        `${currencySymbol}${(r.pricePerNight || 0).toFixed(2)}`,
        r.checkInDate || '-',
        r.checkOutDate || '-'
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Suite_Status_Report_${businessDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      id="modal-suite-status-report"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 md:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-5xl bg-[#f4f7fb] text-[#1c2d42] rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] border-2 border-[#5b8ec5] overflow-hidden flex flex-col max-h-[92vh] ring-1 ring-black/20"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* TOP TITLE BAR */}
        <div className="bg-gradient-to-r from-[#1e3a5f] via-[#244c7d] to-[#1e3a5f] text-white px-4 py-2.5 flex items-center justify-between shadow-md border-b border-[#0f243e] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-500/30 border border-blue-300/40 flex items-center justify-center shadow-inner">
              <Building2 className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-bold tracking-wide flex items-center gap-2">
                <span>SUITE & ROOM OPERATIONS STATUS REPORT</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-400/40 font-mono font-semibold">
                  REPORTS 2
                </span>
              </h3>
              <p className="text-[11px] text-blue-200">
                {settings?.hotelName || 'Grand Phnom Penh Hotel'} • Operational Business Date: <strong className="text-white font-mono">{businessDate}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-xs text-white font-medium transition-colors cursor-pointer active:scale-95"
              title="Export as CSV Spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-blue-200" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-xs text-white font-medium transition-colors cursor-pointer active:scale-95"
              title="Print Report"
            >
              <Printer className="w-3.5 h-3.5 text-blue-200" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer ml-1"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* REPORT SUB-NAV TABS & SEARCH BAR */}
        <div className="bg-[#e4edf7] border-b border-[#cbd9ea] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1.5 bg-[#d2e2f3] p-1 rounded-md border border-[#b4cbe5]">
            <button
              type="button"
              onClick={() => setReportView('kpi_summary')}
              className={`px-3 py-1 font-semibold rounded text-xs cursor-pointer transition-all ${
                reportView === 'kpi_summary'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              📊 KPI Summary & Yield
            </button>
            <button
              type="button"
              onClick={() => setReportView('detailed_list')}
              className={`px-3 py-1 font-semibold rounded text-xs cursor-pointer transition-all ${
                reportView === 'detailed_list'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              📋 Suite List & Roster ({filteredRooms.length})
            </button>
            <button
              type="button"
              onClick={() => setReportView('floor_matrix')}
              className={`px-3 py-1 font-semibold rounded text-xs cursor-pointer transition-all ${
                reportView === 'floor_matrix'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              🏢 Floor-by-Floor Matrix
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-2" />
              <input
                type="text"
                placeholder="Filter room or guest..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-2.5 py-1 bg-white border border-[#cbd5e1] rounded text-xs focus:outline-none focus:border-blue-500 w-44 shadow-2xs font-mono"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 bg-white border border-[#cbd5e1] rounded text-xs focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="occupied">Occupied</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="cleaning">Housekeeping</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2 py-1 bg-white border border-[#cbd5e1] rounded text-xs focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
            >
              <option value="all">All Types</option>
              {roomTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE & PRINTABLE) */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#f8fafc]">
          
          {/* 1. TOP 6 CORE KPI STAT CARDS (RELOCATED TO REPORT 2) */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>Operational Suite Summary</span>
                <span className="text-[10px] text-neutral-400 font-normal">({stats.total} Total Inventory Units)</span>
              </span>
              <span className="text-[10px] font-mono font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                Occupancy: {stats.occupancyRate}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Total Suites */}
              <div className="rounded-xl border border-[#cbd5e1] bg-white p-3.5 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[11px] font-bold uppercase text-neutral-500 block">Total Suites</span>
                  <span className="text-xl font-bold font-mono text-neutral-900">{stats.total}</span>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                  <DoorOpen className="h-4.5 w-4.5" />
                </div>
              </div>

              {/* Occupied */}
              <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-3.5 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[11px] font-bold uppercase text-amber-800 block">Occupied</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold font-mono text-amber-950">{stats.occupied}</span>
                    <span className="text-xs text-amber-700 font-mono font-bold">({stats.occupancyRate}%)</span>
                  </div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-200/80 text-amber-900">
                  <User className="h-4.5 w-4.5" />
                </div>
              </div>

              {/* Reserved */}
              <div className="rounded-xl border border-purple-300 bg-purple-50/70 p-3.5 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[11px] font-bold uppercase text-purple-800 block">Reserved</span>
                  <span className="text-xl font-bold font-mono text-purple-950">{stats.reserved}</span>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-200/80 text-purple-900">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
              </div>

              {/* Available */}
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3.5 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[11px] font-bold uppercase text-emerald-800 block">Available</span>
                  <span className="text-xl font-bold font-mono text-emerald-950">{stats.available}</span>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-200/80 text-emerald-900">
                  <CheckCircle className="h-4.5 w-4.5" />
                </div>
              </div>

              {/* Housekeeping */}
              <div className="rounded-xl border border-blue-300 bg-blue-50/70 p-3.5 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[11px] font-bold uppercase text-blue-800 block">Housekeeping</span>
                  <span className="text-xl font-bold font-mono text-blue-950">{stats.cleaning}</span>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-200/80 text-blue-900">
                  <Brush className="h-4.5 w-4.5" />
                </div>
              </div>

              {/* Out of Service */}
              <div className="rounded-xl border border-rose-300 bg-rose-50/70 p-3.5 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[11px] font-bold uppercase text-rose-800 block">Out of Service</span>
                  <span className="text-xl font-bold font-mono text-rose-950">{stats.outOfService}</span>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-200/80 text-rose-900">
                  <Wrench className="h-4.5 w-4.5" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. REPORT VIEW MODES */}
          {reportView === 'kpi_summary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Breakdown Table */}
              <div className="bg-white rounded-xl border border-[#cbd5e1] p-4 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center justify-between border-b border-neutral-200 pb-2">
                  <span className="flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-blue-700" />
                    <span>Inventory by Room Category</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal">Active Types</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-neutral-200 text-neutral-500 font-semibold">
                        <th className="pb-1.5">Category</th>
                        <th className="pb-1.5 text-center">Total</th>
                        <th className="pb-1.5 text-center">Occupied</th>
                        <th className="pb-1.5 text-center">Available</th>
                        <th className="pb-1.5 text-center">Occupancy %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-mono">
                      {(Object.entries(stats.typeBreakdown) as [string, { total: number; occupied: number; available: number; reserved: number }][]).map(([type, data]) => {
                        const occPct = data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0;
                        return (
                          <tr key={type} className="hover:bg-blue-50/40">
                            <td className="py-2 font-sans font-medium text-neutral-800">{type}</td>
                            <td className="py-2 text-center text-neutral-900 font-bold">{data.total}</td>
                            <td className="py-2 text-center text-amber-700 font-bold">{data.occupied}</td>
                            <td className="py-2 text-center text-emerald-700 font-bold">{data.available}</td>
                            <td className="py-2 text-center">
                              <span className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 rounded font-semibold text-neutral-800 text-[11px]">
                                {occPct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Floor Occupancy Distribution */}
              <div className="bg-white rounded-xl border border-[#cbd5e1] p-4 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center justify-between border-b border-neutral-200 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-700" />
                    <span>Floor Level Occupancy Distribution</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal">Physical Levels</span>
                </h4>

                <div className="space-y-3">
                  {(Object.entries(stats.floorBreakdown) as [string, { total: number; occupied: number; available: number; dirty: number }][]).map(([floor, data]) => {
                    const occPct = data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0;
                    return (
                      <div key={floor} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-neutral-800">Floor #{floor}</span>
                          <span className="font-mono text-neutral-600 text-[11px]">
                            {data.occupied} of {data.total} Occupied ({occPct}%)
                          </span>
                        </div>
                        <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden border border-neutral-200 flex">
                          <div
                            style={{ width: `${occPct}%` }}
                            className="bg-gradient-to-r from-amber-500 to-amber-600 h-full"
                          />
                          <div
                            style={{ width: `${data.total > 0 ? (data.available / data.total) * 100 : 0}%` }}
                            className="bg-emerald-500 h-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Suite Roster Table */}
          {(reportView === 'detailed_list' || reportView === 'kpi_summary') && (
            <div className="bg-white rounded-xl border border-[#cbd5e1] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                  <DoorOpen className="w-4 h-4 text-blue-700" />
                  <span>Suite Inventory & Current Status List</span>
                </h4>
                <span className="text-[11px] font-mono text-neutral-500">
                  Showing {filteredRooms.length} of {rooms.length} Suites
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-neutral-100/80 text-neutral-600 font-semibold border-b border-neutral-200">
                      <th className="py-2 px-3">Room #</th>
                      <th className="py-2 px-3">Floor</th>
                      <th className="py-2 px-3">Room Type</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3 text-center">Housekeeping</th>
                      <th className="py-2 px-3">In-House Guest</th>
                      <th className="py-2 px-3 text-right">Rate / Night</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-mono">
                    {filteredRooms.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-neutral-500 font-sans italic">
                          No suites matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredRooms.map((room) => {
                        return (
                          <tr key={room.id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="py-2 px-3 font-bold text-neutral-900">{room.roomNumber}</td>
                            <td className="py-2 px-3 text-neutral-600">Floor {room.floor}</td>
                            <td className="py-2 px-3 font-sans font-medium text-neutral-800">{room.type}</td>
                            <td className="py-2 px-3 text-center font-sans">
                              {(() => {
                                const statusInfo = getRoomStatusBadge(room.status);
                                return (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusInfo.badgeClass}`}>
                                    {statusInfo.shortLabel || room.status}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-2 px-3 text-center font-sans">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                room.cleaningStatus === 'clean'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : room.cleaningStatus === 'dirty'
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : 'bg-blue-50 text-blue-700 border-blue-300'
                              }`}>
                                {room.cleaningStatus || 'clean'}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-sans text-neutral-700">
                              {room.guestName ? (
                                <span className="font-semibold text-neutral-900">{room.guestName}</span>
                              ) : (
                                <span className="text-neutral-400 italic">Vacant</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-neutral-900">
                              {formatCurrency(room.pricePerNight || 0, currencySymbol)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Floor Matrix Grid View */}
          {reportView === 'floor_matrix' && (
            <div className="space-y-4">
              {floors.map((floor) => {
                const floorRooms = rooms.filter((r) => r.floor === floor);
                return (
                  <div key={floor} className="bg-white rounded-xl border border-[#cbd5e1] p-4 shadow-2xs space-y-3">
                    <h5 className="font-bold text-xs text-neutral-800 border-b border-neutral-200 pb-1.5 flex items-center justify-between">
                      <span>Floor #{floor} Suites Matrix</span>
                      <span className="font-mono text-[11px] text-neutral-500 font-normal">
                        {floorRooms.filter((r) => r.status === 'occupied').length} Occupied / {floorRooms.length} Total
                      </span>
                    </h5>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {floorRooms.map((r) => (
                        <div
                          key={r.id}
                          className={`p-2.5 rounded-lg border text-center font-mono ${
                            r.status === 'occupied'
                              ? 'bg-amber-50 border-amber-300 text-amber-950'
                              : r.status === 'available'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                              : r.status === 'reserved'
                              ? 'bg-purple-50 border-purple-300 text-purple-950'
                              : 'bg-neutral-100 border-neutral-300 text-neutral-800'
                          }`}
                        >
                          <div className="text-xs font-black">{r.roomNumber}</div>
                          <div className="text-[10px] uppercase font-sans font-bold mt-0.5">{r.status}</div>
                          <div className="text-[9.5px] text-neutral-600 truncate mt-0.5">
                            {r.guestName || (r.type ? String(r.type).replace('Suite', 'St.') : 'Standard')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* BOTTOM FOOTER */}
        <div className="bg-[#e4edf7] border-t border-[#cbd9ea] px-4 py-2 flex items-center justify-between text-xs text-neutral-600 shrink-0">
          <div className="font-mono text-[11px]">
            Generated for Business Date: <strong>{businessDate}</strong> • Operator: <strong>{currentUser?.fullName || 'Administrator'}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 rounded font-semibold text-neutral-800 text-xs shadow-2xs cursor-pointer active:scale-95"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
};

