import React from 'react';
import { 
  X, 
  DoorOpen, 
  User, 
  Calendar, 
  Mail, 
  Phone, 
  CheckCircle, 
  Wrench, 
  Brush, 
  Receipt,
  LogOut, 
  Edit3, 
  Ban, 
  ShieldAlert, 
  Crown, 
  Trash2,
  History 
} from 'lucide-react';
import { Room, RoomStatus, CleaningStatus, UserSettings } from '../types';
import { formatCurrency, getAccentClasses, getRoomStatusBadge, getCleaningStatusBadge, playChime } from '../utils/helpers';
import { ReservationEditData } from './EditReservationModal';

interface RoomDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  settings: UserSettings;
  onUpdateRoomStatus: (roomId: string, status: RoomStatus, cleaningStatus?: CleaningStatus) => void;
  onCheckOut: (room: Room) => void;
  onOpenBookingForRoom: (room: Room, defaultCheckIn?: string) => void;
  onViewInvoiceForRoom: (room: Room, guestNameOverride?: string) => void;
  onOpenEditRoom: (room: Room) => void;
  onDeleteRoom?: (roomId: string, roomNumber: string) => void;
  onEditReservation?: (reservation: ReservationEditData) => void;
  onCancelReservation?: (reservationId?: string, roomId?: string) => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  isOpen,
  onClose,
  room,
  settings,
  onUpdateRoomStatus,
  onCheckOut,
  onOpenBookingForRoom,
  onViewInvoiceForRoom,
  onOpenEditRoom,
  onDeleteRoom,
  onEditReservation,
  onCancelReservation,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'details' | 'history'>('details');

  React.useEffect(() => {
    setActiveTab('details');
  }, [room?.id, isOpen]);

  if (!isOpen || !room) return null;

  const accent = getAccentClasses(settings.accentColor);
  const statusInfo = getRoomStatusBadge(room.status);
  const cleaningInfo = getCleaningStatusBadge(room.cleaningStatus);

  const handleStatusChange = (newStatus: RoomStatus) => {
    if (settings.soundEffects) playChime();
    onUpdateRoomStatus(room.id, newStatus);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-950/85 p-4 backdrop-blur-md animate-in fade-in">
      <div 
        className="relative w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-800/80 border border-neutral-700 font-mono text-base font-bold text-white">
              {room.roomNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{room.type}</h3>
                {room.name && (
                  <span className="text-xs text-neutral-400 font-medium">"{room.name}"</span>
                )}
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusInfo.badgeClass}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`}></span>
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Floor {room.floor} • {room.bedType} • {room.sizeSqM} m² • {room.view}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!showDeleteConfirm ? (
              <>
                <button
                  onClick={() => onOpenEditRoom(room)}
                  className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-bold text-neutral-200 hover:bg-neutral-700 hover:text-white transition-all shadow-sm cursor-pointer"
                  title="Modify room details (number, category, price, floor)"
                >
                  <Edit3 className="h-3.5 w-3.5 text-amber-400" />
                  <span>Modify Room</span>
                </button>
                {onDeleteRoom && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-800/60 bg-rose-950/40 px-2.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900/60 hover:text-white transition-all shadow-sm cursor-pointer"
                    title="Delete Room from Inventory"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                    <span>Delete</span>
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 bg-rose-950/90 border border-rose-600 px-3 py-1 rounded-xl text-xs">
                <span className="text-rose-200 font-bold">Delete Room #{room.roomNumber}?</span>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteRoom) {
                      onDeleteRoom(room.id, room.roomNumber);
                    }
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-sm"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 text-neutral-300 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sub Navigation: Details vs History of Previous Stays */}
        <div className="flex items-center border-b border-neutral-800 bg-neutral-950/40 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Room Overview & Current State
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <History className="h-3.5 w-3.5 text-purple-400" />
            <span>History of Previous ({room.history?.length || 0})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {activeTab === 'history' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <History className="h-4 w-4 text-purple-400" />
                    Previous Stay History for Room #{room.roomNumber}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Past guest stays, settlements, duration, and archived folio records.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30">
                  {room.history?.length || 0} Recorded Stays
                </span>
              </div>

              {(!room.history || room.history.length === 0) ? (
                <div className="p-8 text-center bg-neutral-950/40 rounded-xl border border-neutral-800 space-y-2">
                  <History className="h-8 w-8 text-neutral-600 mx-auto" />
                  <p className="text-xs text-neutral-400 font-semibold">No previous stay records on file for Room #{room.roomNumber}.</p>
                  <p className="text-[11px] text-neutral-500">When departing guests check out or settle, their historical records will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {room.history.map((entry) => {
                    const inDate = new Date(entry.checkInDate);
                    const outDate = new Date(entry.checkOutDate);
                    const nights = Math.max(1, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));
                    return (
                      <div
                        key={entry.id}
                        className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/90 hover:border-neutral-700 transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs">
                              {entry.guestName.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{entry.guestName}</span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                                  {entry.status === 'checked_out' ? 'Checked Out' : 'Completed'}
                                </span>
                                {entry.folioNumber && (
                                  <span className="font-mono text-[10px] text-neutral-500">
                                    {entry.folioNumber}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5">
                                {entry.guestEmail && <span>{entry.guestEmail}</span>}
                                {entry.guestPhone && <span>{entry.guestPhone}</span>}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onViewInvoiceForRoom(room, entry.guestName)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-amber-500/40 bg-amber-950/30 hover:bg-amber-950/70 text-amber-300 text-xs font-semibold cursor-pointer transition-all"
                          >
                            <Receipt className="h-3.5 w-3.5 text-amber-400" />
                            <span>View Guest Folio</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-800/60 text-xs">
                          <div>
                            <span className="text-[10.5px] text-neutral-500 block">Stay Period</span>
                            <span className="font-mono text-neutral-200 font-medium">
                              {entry.checkInDate} → {entry.checkOutDate}
                            </span>
                            <span className="text-[10px] text-neutral-400 block font-mono">({nights} {nights === 1 ? 'Night' : 'Nights'})</span>
                          </div>
                          <div>
                            <span className="text-[10.5px] text-neutral-500 block">Rate / Night</span>
                            <span className="font-mono text-neutral-200 font-medium">
                              {formatCurrency(entry.rate || room.pricePerNight, settings.currency.symbol)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10.5px] text-neutral-500 block">Total Settlement</span>
                            <span className="font-mono text-emerald-400 font-bold">
                              {formatCurrency(entry.totalAmount || (nights * (entry.rate || room.pricePerNight)), settings.currency.symbol)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10.5px] text-neutral-500 block">Payment Mode</span>
                            <span className="text-neutral-300 font-medium">
                              {entry.paymentMethod || 'Credit Card'}
                            </span>
                          </div>
                        </div>

                        {entry.notes && (
                          <p className="text-[11px] text-neutral-400 italic bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/50">
                            &ldquo;{entry.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Quick History Banner on Overview Tab */}
              {room.history && room.history.length > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-purple-400" />
                    <span className="text-neutral-300">
                      Room #{room.roomNumber} has <strong className="text-white font-mono">{room.history.length}</strong> previous stay record{room.history.length > 1 ? 's' : ''} on file.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="px-2.5 py-1 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold text-[11px] cursor-pointer"
                  >
                    View Previous History →
                  </button>
                </div>
              )}

              {/* Out of Service Banner Alert */}
          {room.status === 'out_of_service' && (
            <div className="rounded-2xl border border-red-500/40 bg-red-950/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Room is Closed Out of Service</span>
                </div>
                <button
                  onClick={() => handleStatusChange('available')}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-all"
                >
                  Restore to Service (Open)
                </button>
              </div>
              <p className="text-xs text-neutral-300">
                {room.outOfServiceReason || room.notes || 'This suite is currently closed for repairs and blocked from booking.'}
              </p>
            </div>
          )}

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-3">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">Nightly Rate</span>
              <span className={`text-sm font-bold font-mono ${accent.text}`}>
                {formatCurrency(room.pricePerNight, settings.currency.symbol)}
              </span>
            </div>
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-3">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">Occupancy Cap</span>
              <span className="text-sm font-bold text-neutral-200">
                Up to {room.maxGuests} Guests
              </span>
            </div>
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-3">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">Housekeeper</span>
              <span className="text-xs font-medium text-neutral-300 truncate block">
                {room.assignedHousekeeper || 'Unassigned'}
              </span>
            </div>
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-3">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">Cleaning Status</span>
              <span className="text-xs font-semibold text-emerald-400 truncate block">
                {cleaningInfo.label}
              </span>
            </div>
          </div>

          {/* Current Occupant info */}
          {room.status === 'occupied' && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Active In-House Guest Profile
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewInvoiceForRoom(room, room.guestName)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-4"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    Guest Folio & Invoices
                  </button>
                  {onEditReservation && (
                    <button
                      onClick={() => {
                        onClose();
                        onEditReservation({
                          id: `stay-${room.id}`,
                          roomId: room.id,
                          roomNumber: room.roomNumber,
                          guestName: room.guestName || 'In-House Guest',
                          guestEmail: room.guestEmail,
                          guestPhone: room.guestPhone,
                          checkInDate: room.checkInDate || '2026-08-26',
                          checkOutDate: room.checkOutDate || '2026-08-28',
                          rate: room.pricePerNight,
                          guestsCount: room.maxGuests,
                          paymentMethod: 'Credit Card',
                          notes: room.notes,
                          isCurrentStay: true,
                        });
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 text-xs font-bold transition-all"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit Stay / Profile
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-neutral-400 block text-[11px]">Guest Name:</span>
                  <span className="font-semibold text-white text-sm">{room.guestName}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Stay Duration:</span>
                  <span className="font-semibold text-neutral-200 font-mono">
                    {room.checkInDate} → {room.checkOutDate}
                  </span>
                </div>
                {room.guestEmail && (
                  <div>
                    <span className="text-neutral-400 block text-[11px]">Email:</span>
                    <span className="text-neutral-300">{room.guestEmail}</span>
                  </div>
                )}
                {room.guestPhone && (
                  <div>
                    <span className="text-neutral-400 block text-[11px]">Phone:</span>
                    <span className="text-neutral-300">{room.guestPhone}</span>
                  </div>
                )}
              </div>
              {room.notes && (
                <div className="rounded-lg bg-neutral-950/60 p-2.5 text-xs text-neutral-300 border border-neutral-800/80">
                  <span className="text-amber-400 font-semibold">Special Instructions: </span>
                  {room.notes}
                </div>
              )}
            </div>
          )}

          {/* Reserved Status info */}
          {room.status === 'reserved' && (
            <div className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Upcoming Reserved Arrival (GstBlk)
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewInvoiceForRoom(room, room.guestName)}
                    className="flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-4"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    Folio
                  </button>
                  {onEditReservation && (
                    <button
                      onClick={() => {
                        onClose();
                        onEditReservation({
                          id: `res-${room.id}`,
                          roomId: room.id,
                          roomNumber: room.roomNumber,
                          guestName: room.guestName || 'Reserved Guest',
                          guestEmail: room.guestEmail,
                          guestPhone: room.guestPhone,
                          checkInDate: room.checkInDate || '2026-08-26',
                          checkOutDate: room.checkOutDate || '2026-08-28',
                          rate: room.pricePerNight,
                          guestsCount: room.maxGuests,
                          paymentMethod: 'Credit Card',
                          notes: room.notes,
                        });
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-purple-500/40 bg-purple-900/40 hover:bg-purple-900/70 text-purple-200 text-xs font-bold transition-all"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit Booking
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-neutral-400 block text-[11px]">Guest Name:</span>
                  <span className="font-semibold text-white">{room.guestName}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Dates:</span>
                  <span className="font-semibold text-amber-300 font-mono">{room.checkInDate} → {room.checkOutDate}</span>
                </div>
                {room.guestEmail && (
                  <div>
                    <span className="text-neutral-400 block text-[11px]">Email:</span>
                    <span className="text-neutral-300">{room.guestEmail}</span>
                  </div>
                )}
                {room.guestPhone && (
                  <div>
                    <span className="text-neutral-400 block text-[11px]">Phone:</span>
                    <span className="text-neutral-300">{room.guestPhone}</span>
                  </div>
                )}
              </div>
              {room.notes && <p className="text-xs text-neutral-400 italic bg-neutral-950/60 p-2 rounded-lg">&ldquo;{room.notes}&rdquo;</p>}
              <div className="pt-2 flex items-center gap-2 border-t border-purple-900/40">
                <button
                  onClick={() => {
                    onClose();
                    onOpenBookingForRoom(room, room.checkInDate);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${accent.primary}`}
                >
                  <DoorOpen className="h-4 w-4" />
                  Check In Guest Now
                </button>
              </div>
            </div>
          )}

          {/* Future Reservations & Guest Blocks */}
          {room.futureReservations && room.futureReservations.length > 0 && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Future Reservations & Guest Blocks ({room.futureReservations.length})
                </h4>
              </div>
              <div className="space-y-2">
                {room.futureReservations.map((fut) => (
                  <div 
                    key={fut.id} 
                    className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{fut.guestName}</span>
                        {fut.vipStatus && (
                          <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                            <Crown className="h-2.5 w-2.5 text-amber-400" /> VIP
                          </span>
                        )}
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                          {fut.label || 'GstBlk'}
                        </span>
                      </div>
                      <span className="font-mono text-amber-300 font-bold text-xs">
                        {fut.checkInDate} → {fut.checkOutDate}
                      </span>
                    </div>
                    {(fut.guestEmail || fut.guestPhone) && (
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
                        {fut.guestEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-neutral-500" /> {fut.guestEmail}
                          </span>
                        )}
                        {fut.guestPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-neutral-500" /> {fut.guestPhone}
                          </span>
                        )}
                      </div>
                    )}
                    {fut.notes && (
                      <p className="text-[11px] text-neutral-400 italic bg-neutral-950 p-2 rounded">
                        &ldquo;{fut.notes}&rdquo;
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80 text-xs">
                      <span className="font-mono text-neutral-300 text-[11px]">
                        Rate: {formatCurrency(fut.rate || room.pricePerNight, settings.currency.symbol)}/nt
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewInvoiceForRoom(room, fut.guestName)}
                          className="px-2 py-1 rounded-lg border border-amber-500/40 bg-amber-950/30 hover:bg-amber-950/70 text-amber-300 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <Receipt className="h-3 w-3" /> Folio
                        </button>
                        {onEditReservation && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEditReservation({
                                id: fut.id,
                                roomId: room.id,
                                roomNumber: room.roomNumber,
                                guestName: fut.guestName,
                                guestEmail: fut.guestEmail,
                                guestPhone: fut.guestPhone,
                                checkInDate: fut.checkInDate,
                                checkOutDate: fut.checkOutDate,
                                rate: fut.rate || room.pricePerNight,
                                guestsCount: fut.guestsCount || 2,
                                paymentMethod: fut.paymentMethod || 'Credit Card',
                                notes: fut.notes,
                                extraBed: fut.extraBed,
                                extraBedCount: fut.extraBedCount,
                                vipStatus: fut.vipStatus,
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 text-[11px] font-bold flex items-center gap-1"
                          >
                            <Edit3 className="h-3 w-3" /> Edit Reservation
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenBookingForRoom(room, fut.checkInDate);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm ${accent.primary}`}
                        >
                          <DoorOpen className="h-3 w-3" /> Check In
                        </button>
                        {onCancelReservation && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Cancel reservation for ${fut.guestName}?`)) {
                                onCancelReservation(fut.id, room.id);
                              }
                            }}
                            className="p-1 rounded-lg border border-red-500/30 bg-red-950/30 hover:bg-red-900/60 text-red-300 text-[11px]"
                            title="Cancel reservation"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities Badges */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              Room Amenities & Features
            </span>
            <div className="flex flex-wrap gap-1.5">
              {room.amenities.map((item, idx) => (
                <span
                  key={idx}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs text-neutral-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Status Control Matrix */}
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Operational Room Status
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                onClick={() => handleStatusChange('available')}
                className={`rounded-xl border p-2.5 text-left text-xs transition-all ${
                  room.status === 'available'
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 font-bold'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Available</span>
                </div>
                <span className="text-[10px] text-neutral-500 block">Ready to book</span>
              </button>
              <button
                onClick={() => handleStatusChange('cleaning')}
                className={`rounded-xl border p-2.5 text-left text-xs transition-all ${
                  room.status === 'cleaning'
                    ? 'border-purple-500/50 bg-purple-500/15 text-purple-300 font-bold'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Brush className="h-3.5 w-3.5 text-purple-400" />
                  <span>Housekeeping</span>
                </div>
                <span className="text-[10px] text-neutral-500 block">In turnover</span>
              </button>
              <button
                onClick={() => handleStatusChange('maintenance')}
                className={`rounded-xl border p-2.5 text-left text-xs transition-all ${
                  room.status === 'maintenance'
                    ? 'border-rose-500/50 bg-rose-500/15 text-rose-300 font-bold'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Wrench className="h-3.5 w-3.5 text-rose-400" />
                  <span>Maintenance</span>
                </div>
                <span className="text-[10px] text-neutral-500 block">Repair</span>
              </button>
              <button
                onClick={() => handleStatusChange('out_of_service')}
                className={`rounded-xl border p-2.5 text-left text-xs transition-all ${
                  room.status === 'out_of_service'
                    ? 'border-red-500/50 bg-red-500/20 text-red-300 font-bold'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-red-300 hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Ban className="h-3.5 w-3.5 text-red-400" />
                  <span>Out of Service</span>
                </div>
                <span className="text-[10px] text-neutral-500 block">Close room</span>
              </button>
              <button
                onClick={() => handleStatusChange('reserved')}
                className={`rounded-xl border p-2.5 text-left text-xs transition-all ${
                  room.status === 'reserved'
                    ? 'border-blue-500/50 bg-blue-500/15 text-blue-300 font-bold'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="h-3.5 w-3.5 text-blue-400" />
                  <span>Reserved</span>
                </div>
                <span className="text-[10px] text-neutral-500 block">Hold</span>
              </button>
            </div>
          </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-neutral-800 px-6 py-4 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            {room.status === 'occupied' ? (
              <button
                id="btn-checkout-room"
                onClick={() => {
                  onCheckOut(room);
                  onClose();
                }}
                className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Process Guest Check-Out
              </button>
            ) : room.status === 'out_of_service' ? (
              <button
                onClick={() => {
                  handleStatusChange('available');
                }}
                className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-all"
              >
                <CheckCircle className="h-4 w-4" />
                Restore to Service (Make Available)
              </button>
            ) : (
              <>
                <button
                  id="btn-book-room-now"
                  onClick={() => {
                    onClose();
                    onOpenBookingForRoom(room);
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md ${accent.primary}`}
                >
                  <DoorOpen className="h-4 w-4" />
                  Check-In Guest Now
                </button>
                <button
                  onClick={() => {
                    handleStatusChange('out_of_service');
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-all"
                >
                  <Ban className="h-3.5 w-3.5" />
                  Close Out of Service
                </button>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
