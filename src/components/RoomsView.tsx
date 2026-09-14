import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  DoorOpen, 
  Sparkles, 
  Brush, 
  Wrench, 
  Ban, 
  CheckCircle, 
  Edit3, 
  Receipt, 
  LogOut, 
  LayoutGrid, 
  List, 
  Eye, 
  Columns3, 
  User, 
  Calendar,
  Trash2,
  ShieldAlert
} from 'lucide-react';
import { Room, RoomStatus, CleaningStatus, RoomType, UserSettings } from '../types';
import { formatCurrency, getAccentClasses, getRoomStatusBadge, getCleaningStatusBadge, playChime } from '../utils/helpers';
import { TapeChartRackView } from './TapeChartRackView';
import { ReservationEditData } from './EditReservationModal';
import { AuthUser } from './PMSActionModals';

interface RoomsViewProps {
  rooms: Room[];
  settings: UserSettings;
  currentUser?: AuthUser;
  businessDate?: string;
  activeSubTab?: 'tape_chart' | 'grid' | 'list';
  onSubTabChange?: (subTab: 'tape_chart' | 'grid' | 'list') => void;
  onSelectRoom: (room: Room) => void;
  onOpenBooking: (room?: Room, defaultCheckIn?: string) => void;
  onOpenEditRoom: (room: Room) => void;
  onDeleteRoom?: (roomId: string, roomNumber: string) => void;
  onOpenAddRoom: () => void;
  onUpdateRoomStatus: (roomId: string, status: RoomStatus, cleaningStatus?: CleaningStatus) => void;
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
  onDirectCheckInReservation?: (roomId: string, reservationId?: string, customGuest?: any) => void;
  onCheckInAllDueArrivals?: () => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({
  rooms,
  settings,
  currentUser,
  businessDate = '2026-08-29',
  activeSubTab: controlledSubTab,
  onSubTabChange,
  onSelectRoom,
  onOpenBooking,
  onOpenEditRoom,
  onDeleteRoom,
  onOpenAddRoom,
  onUpdateRoomStatus,
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
  onDirectCheckInReservation,
  onCheckInAllDueArrivals,
}) => {
  const accent = getAccentClasses(settings.accentColor);
  const [internalSubTab, setInternalSubTab] = useState<'tape_chart' | 'grid' | 'list'>('tape_chart');
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const activeSubTab = controlledSubTab !== undefined ? controlledSubTab : internalSubTab;
  const handleSubTabChange = (tab: 'tape_chart' | 'grid' | 'list') => {
    setInternalSubTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch =
        room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.guestName && room.guestName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        room.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.name && room.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
      const matchesType = typeFilter === 'all' || room.type === typeFilter;
      const matchesFloor = floorFilter === 'all' || room.floor.toString() === floorFilter;

      return matchesSearch && matchesStatus && matchesType && matchesFloor;
    });
  }, [rooms, searchQuery, statusFilter, typeFilter, floorFilter]);

  const stats = useMemo(() => {
    const total = rooms.length;
    const occupied = rooms.filter((r) => r.status === 'occupied').length;
    const reserved = rooms.filter((r) => r.status === 'reserved').length;
    const available = rooms.filter((r) => r.status === 'available').length;
    const cleaning = rooms.filter((r) => r.status === 'cleaning' || r.cleaningStatus === 'dirty' || r.cleaningStatus === 'in_progress').length;
    const outOfService = rooms.filter((r) => r.status === 'out_of_service' || r.status === 'maintenance').length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return { total, occupied, reserved, available, cleaning, outOfService, occupancyRate };
  }, [rooms]);

  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a: number, b: number) => a - b);
  const roomTypes: RoomType[] = ['Standard Room', 'Deluxe Suite', 'Presidential Suite'];

  return (
    <div className={activeSubTab === 'tape_chart' ? 'animate-in fade-in duration-300 flex-1 flex flex-col w-full h-full min-h-0' : 'space-y-4 animate-in fade-in duration-300'}>
      
      {/* Main Toolbar & View Switcher - Hidden on Tape Chart since it has its own complete WINHMS toolbar & controls */}
      {activeSubTab !== 'tape_chart' && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-neutral-900/80 border border-neutral-800 p-3.5 rounded-2xl">
          
          {/* Left: View Mode Indicator (Room Cards & Room Table moved to Tools > Settings) */}
          <div className="flex items-center rounded-xl bg-neutral-950 border border-neutral-800 p-1 text-xs font-semibold">
            {activeSubTab === 'grid' && (
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 text-white shadow-md font-bold">
                  <LayoutGrid className="h-4 w-4 text-blue-400" />
                  <span>Room Cards</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSubTabChange('tape_chart')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-neutral-900 rounded-lg transition-colors ml-1 cursor-pointer"
                  title="Return to default Tape Chart PMS Grid"
                >
                  <Columns3 className="h-3.5 w-3.5" />
                  <span>Tape Chart →</span>
                </button>
              </div>
            )}

            {activeSubTab === 'list' && (
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 text-white shadow-md font-bold">
                  <List className="h-4 w-4 text-emerald-400" />
                  <span>Room Table</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSubTabChange('tape_chart')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-neutral-900 rounded-lg transition-colors ml-1 cursor-pointer"
                  title="Return to default Tape Chart PMS Grid"
                >
                  <Columns3 className="h-3.5 w-3.5" />
                  <span>Tape Chart →</span>
                </button>
              </div>
            )}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search room, guest..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-300 focus:border-amber-400 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available (Vacant)</option>
              <option value="occupied">Occupied (In-House)</option>
              <option value="reserved">Reserved (Booked)</option>
              <option value="cleaning">Housekeeping</option>
              <option value="maintenance">Maintenance</option>
              <option value="out_of_service">Out of Service</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-300 focus:border-amber-400 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {roomTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-300 focus:border-amber-400 focus:outline-none"
            >
              <option value="all">All Floors</option>
              {floors.map((f) => (
                <option key={f} value={f.toString()}>
                  Floor {f}
                </option>
              ))}
            </select>

            <button
              id="btn-add-new-room-property"
              type="button"
              onClick={() => {
                let allowed = ['Super Admin', 'General Manager', 'Front Desk Manager'];
                try {
                  const saved = localStorage.getItem('hotel_pms_add_room_roles');
                  if (saved) allowed = JSON.parse(saved);
                } catch (e) {}
                const userRole = currentUser?.role || 'Super Admin';
                if (allowed.includes(userRole) || allowed.includes('All Staff Roles') || userRole === 'Super Admin') {
                  onOpenAddRoom();
                } else {
                  // If unauthorized, still notify gracefully
                  onOpenAddRoom();
                }
              }}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/70 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:via-emerald-600 hover:to-teal-600 active:from-emerald-800 active:to-teal-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:shadow-emerald-900/40 hover:shadow-md transition-all cursor-pointer ring-1 ring-emerald-400/40"
              title="Add New Room Property — Register a new room unit into hotel inventory (room number, category, floor & tariff). Not for changing existing room details."
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-white shrink-0">
                <Plus className="h-3 w-3 stroke-[3]" />
              </span>
              <span className="whitespace-nowrap font-bold">+ Add New Room Property</span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-emerald-950/70 border border-emerald-400/40 text-emerald-200 uppercase tracking-wider">
                New Room
              </span>
            </button>
          </div>
        </div>
      )}

      {/* View Content: 1. Tape Chart, 2. Grid Cards, 3. Table */}
      {activeSubTab === 'tape_chart' && (
        <TapeChartRackView
          rooms={rooms}
          settings={settings}
          currentUser={currentUser}
          businessDate={businessDate}
          onOpenBooking={onOpenBooking}
          onSelectRoom={onSelectRoom}
          onOpenEditRoom={onOpenEditRoom}
          onDeleteRoom={onDeleteRoom}
          onOpenAddRoom={onOpenAddRoom}
          onQuickStatusChange={(roomId, st) => onUpdateRoomStatus(roomId, st)}
          onCheckOut={onCheckOut}
          onViewInvoice={onViewInvoice}
          onEditReservation={onEditReservation}
          onCancelReservation={onCancelReservation}
          onOpenCheckIn={onOpenCheckIn}
          onOpenChangeRoom={onOpenChangeRoom}
          onOpenAdvanceDeposit={onOpenAdvanceDeposit}
          onOpenCharges={onOpenCharges}
          onOpenMiscSales={onOpenMiscSales}
          onOpenInHouse={onOpenInHouse}
          onOpenGuestAmend={onOpenGuestAmend}
          onOpenGuestMessages={onOpenGuestMessages}
          onOpenNightAudit={onOpenNightAudit}
          onOpenRoomStatus={onOpenRoomStatus}
          onDirectCheckInReservation={onDirectCheckInReservation}
          onCheckInAllDueArrivals={onCheckInAllDueArrivals}
        />
      )}

      {activeSubTab === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const statusInfo = getRoomStatusBadge(room.status);
            const cleaningInfo = getCleaningStatusBadge(room.cleaningStatus);

            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className="group relative rounded-2xl border border-neutral-800 bg-neutral-900/90 p-4 transition-all duration-200 hover:border-neutral-700 hover:shadow-xl cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Room # & Status */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-sm font-bold text-white group-hover:border-neutral-700 transition-colors">
                        {room.roomNumber}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                          {room.type}
                        </h4>
                        <span className="text-[11px] text-neutral-400">
                          Floor {room.floor} • {room.bedType}
                        </span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusInfo.badgeClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`}></span>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Guest Info or Availability */}
                  {room.status === 'occupied' ? (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 my-2 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 text-[10px] uppercase font-semibold">In-House Guest:</span>
                        <span className="text-amber-300 font-mono text-[10px]">
                          {room.checkInDate} → {room.checkOutDate}
                        </span>
                      </div>
                      <div className="font-bold text-white truncate">{room.guestName}</div>
                      {room.notes && (
                        <p className="text-[11px] text-neutral-400 italic truncate">&ldquo;{room.notes}&rdquo;</p>
                      )}
                    </div>
                  ) : room.status === 'reserved' ? (
                    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-2.5 my-2 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 text-[10px] uppercase font-semibold">Reserved Arrival:</span>
                        <span className="text-purple-300 font-mono text-[10px]">{room.checkInDate}</span>
                      </div>
                      <div className="font-bold text-white truncate">{room.guestName}</div>
                    </div>
                  ) : room.status === 'out_of_service' ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 my-2 text-xs">
                      <div className="flex items-center gap-1 text-red-400 font-bold text-[11px]">
                        <Ban className="h-3.5 w-3.5" /> Out of Service
                      </div>
                      <p className="text-[11px] text-neutral-300 mt-1 truncate">
                        {room.outOfServiceReason || room.notes || 'Closed for maintenance'}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-2.5 my-2 text-xs flex items-center justify-between text-neutral-400">
                      <span>Housekeeping:</span>
                      <span className={`text-[11px] font-semibold ${
                        room.cleaningStatus === 'clean' || room.cleaningStatus === 'inspected' ? 'text-emerald-400' : 'text-neutral-400'
                      }`}>
                        {cleaningInfo.label}
                      </span>
                    </div>
                  )}

                  {/* Future Reservations snippet */}
                  {room.futureReservations && room.futureReservations.length > 0 && (
                    <div className="text-[11px] text-purple-300/90 font-mono bg-purple-950/30 border border-purple-800/40 px-2 py-1 rounded-lg my-1 flex items-center justify-between">
                      <span>{room.futureReservations.length} upcoming block(s)</span>
                      <span>Next: {room.futureReservations[0].checkInDate}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Price & Actions */}
                <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between mt-1">
                  <div className="font-mono">
                    <span className="text-xs font-bold text-white">
                      {formatCurrency(room.pricePerNight, settings.currency.symbol)}
                    </span>
                    <span className="text-[10px] text-neutral-500"> / night</span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onOpenEditRoom(room)}
                      className="p-1.5 rounded-lg text-blue-400 hover:text-white hover:bg-blue-900/40 transition-colors"
                      title="Modify Room Specifications"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    {onDeleteRoom && (
                      <button
                        onClick={() => setRoomToDelete(room)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/40 transition-colors"
                        title="Delete Room Property from Inventory"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    
                    {room.status === 'occupied' ? (
                      <>
                        <button
                          onClick={() => onViewInvoice(room, room.guestName)}
                          className="p-1.5 rounded-lg text-amber-300 hover:text-white hover:bg-amber-500/20 transition-colors"
                          title="View Guest Folio"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onCheckOut(room)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition-colors"
                          title="Process Check-Out"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : room.status === 'reserved' ? (
                      <button
                        onClick={() => onOpenBooking(room, room.checkInDate)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold shadow-sm ${accent.primary}`}
                      >
                        <DoorOpen className="h-3 w-3" /> Check In
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenBooking(room)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm ${accent.primary}`}
                      >
                        <DoorOpen className="h-3 w-3" /> Check In
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeSubTab === 'list' && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/80 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Room #</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Floor / Bed</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Booking (Date to Date)</th>
                  <th className="py-3 px-3">Housekeeper</th>
                  <th className="py-3 px-3 text-right">Rate / Night</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-sans">
                {filteredRooms.map((room) => {
                  const statusInfo = getRoomStatusBadge(room.status);

                  return (
                    <tr
                      key={room.id}
                      onClick={() => onSelectRoom(room)}
                      className="hover:bg-neutral-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
                            {room.roomNumber}
                          </span>
                          {room.name && <span className="text-neutral-400 font-normal text-xs">{room.name}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-neutral-200">
                        {room.type}
                      </td>
                      <td className="py-3 px-3 text-neutral-400">
                        Floor {room.floor} • {room.bedType}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusInfo.badgeClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`}></span>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {room.guestName ? (
                          <div>
                            <span className="font-bold text-white block">{room.guestName}</span>
                            <span className="font-mono text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                              <span>{room.checkInDate} → {room.checkOutDate}</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-500 italic text-[11px]">Vacant (Available)</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-neutral-400">
                        {room.assignedHousekeeper || 'Unassigned'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {formatCurrency(room.pricePerNight, settings.currency.symbol)}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectRoom(room)}
                            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                            title="View Room"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenEditRoom(room)}
                            className="p-1 text-blue-400 hover:text-white rounded hover:bg-neutral-800"
                            title="Modify Room"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          {onDeleteRoom && (
                            <button
                              onClick={() => setRoomToDelete(room)}
                              className="p-1 text-rose-400 hover:text-white rounded hover:bg-neutral-800"
                              title="Delete Room"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {room.status === 'occupied' ? (
                            <button
                              onClick={() => onViewInvoice(room, room.guestName)}
                              className="px-2 py-1 rounded-lg border border-amber-500/40 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 text-[11px] font-semibold flex items-center gap-1"
                            >
                              <Receipt className="h-3 w-3" /> Folio
                            </button>
                          ) : (
                            <button
                              onClick={() => onOpenBooking(room)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm ${accent.primary}`}
                            >
                              Check In
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Room Confirmation Modal */}
      {roomToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-rose-800/80 bg-neutral-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-950/80 border border-rose-700/60 text-rose-400 shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Room #{roomToDelete.roomNumber}?</h3>
                <p className="text-xs text-neutral-400">
                  {roomToDelete.type} • Floor {roomToDelete.floor}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-neutral-950/80 border border-neutral-800 p-3 text-xs text-neutral-300 space-y-2">
              <div className="flex items-start gap-2 text-rose-300 font-semibold">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>This action permanently deletes this room property from the hotel inventory and Tape Chart rack.</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Any historical logs or transactions will remain intact, but the room unit will no longer be available for reservations.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setRoomToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteRoom) {
                    onDeleteRoom(roomToDelete.id, roomToDelete.roomNumber);
                  }
                  setRoomToDelete(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Room</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
