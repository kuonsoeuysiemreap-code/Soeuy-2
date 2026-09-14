import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Plus,
  Check, 
  Ban, 
  ShieldAlert,
  Building,
  Trash2
} from 'lucide-react';
import { Room, RoomType, RoomStatus, UserSettings } from '../types';
import { getAccentClasses, playChime } from '../utils/helpers';

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  settings: UserSettings;
  isNewRoom?: boolean;
  onSaveRoom: (updatedRoom: Room, originalRoomNumber: string) => void;
  onDeleteRoom?: (roomId: string, roomNumber: string) => void;
  onCloseOutOfService?: (roomId: string, reason: string) => void;
}

export const EditRoomModal: React.FC<EditRoomModalProps> = ({
  isOpen,
  onClose,
  room,
  settings,
  isNewRoom = false,
  onSaveRoom,
  onDeleteRoom,
}) => {
  const accent = getAccentClasses(settings.accentColor);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roomNumber, setRoomNumber] = useState(room?.roomNumber || '');
  const [name, setName] = useState(room?.name || '');
  const [type, setType] = useState<RoomType>(room?.type || 'Deluxe Suite');
  const [floor, setFloor] = useState<number>(room?.floor || 1);
  const [pricePerNight, setPricePerNight] = useState<number>(room?.pricePerNight || 200);
  const [maxGuests, setMaxGuests] = useState<number>(room?.maxGuests || 2);
  const [bedType, setBedType] = useState<string>(room?.bedType || '1 King Bed');
  const [sizeSqM, setSizeSqM] = useState<number>(room?.sizeSqM || 45);
  const [view, setView] = useState<string>(room?.view || 'Ocean View');
  const [status, setStatus] = useState<RoomStatus>(room?.status || 'available');
  const [notes, setNotes] = useState<string>(room?.notes || '');
  const [outOfServiceReason, setOutOfServiceReason] = useState<string>(room?.outOfServiceReason || '');
  const [assignedHousekeeper, setAssignedHousekeeper] = useState<string>(room?.assignedHousekeeper || '');

  useEffect(() => {
    if (room && isOpen) {
      setRoomNumber(room.roomNumber);
      setName(room.name || '');
      setType(room.type);
      setFloor(room.floor);
      setPricePerNight(room.pricePerNight);
      setMaxGuests(room.maxGuests);
      setBedType(room.bedType);
      setSizeSqM(room.sizeSqM);
      setView(room.view);
      setStatus(room.status);
      setNotes(room.notes || '');
      setOutOfServiceReason(room.outOfServiceReason || '');
      setAssignedHousekeeper(room.assignedHousekeeper || '');
    }
  }, [room, isOpen]);

  if (!isOpen || !room) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) return;

    const updatedRoom: Room = {
      ...room,
      roomNumber: roomNumber.trim(),
      name: name.trim() || undefined,
      type,
      floor: Number(floor),
      pricePerNight: Number(pricePerNight),
      maxGuests: Number(maxGuests),
      bedType: bedType.trim(),
      sizeSqM: Number(sizeSqM),
      view: view.trim(),
      status,
      notes: notes.trim() || undefined,
      outOfServiceReason: status === 'out_of_service' ? (outOfServiceReason.trim() || 'Closed for renovation / maintenance') : undefined,
      assignedHousekeeper: assignedHousekeeper.trim() || undefined,
    };

    if (settings.soundEffects) playChime();
    onSaveRoom(updatedRoom, room.roomNumber);
    onClose();
  };

  const handleQuickOutOfService = () => {
    setStatus('out_of_service');
    if (!outOfServiceReason) {
      setOutOfServiceReason('Closed out of service for maintenance and inspection.');
    }
  };

  const handleQuickReopen = () => {
    setStatus('available');
    setOutOfServiceReason('');
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
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border font-mono text-sm font-bold text-white ${
              isNewRoom 
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' 
                : 'bg-neutral-800 border-neutral-700'
            }`}>
              {isNewRoom ? (
                <Plus className="h-5 w-5 text-emerald-400 stroke-[2.5]" />
              ) : (
                <Edit3 className={`h-5 w-5 ${accent.text}`} />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {isNewRoom ? (
                  <>
                    <span>+ Add New Room Property</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                      New Suite #{roomNumber}
                    </span>
                  </>
                ) : (
                  <>
                    <span>Edit Room Information #{room.roomNumber}</span>
                    {room.name && <span className="text-xs font-normal text-neutral-400">({room.name})</span>}
                  </>
                )}
              </h3>
              <p className="text-xs text-neutral-400">
                {isNewRoom 
                  ? 'Register a new room unit into hotel inventory (Specify room number, category, floor, amenities, and tariff)'
                  : 'Modify room number, custom name, category, pricing, and service status'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Out of Service Banner / Quick Switch */}
          <div className={`rounded-xl border p-4 transition-all ${
            status === 'out_of_service' 
              ? 'border-red-500/40 bg-red-950/20 text-red-200' 
              : 'border-neutral-800 bg-neutral-950/60'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className={`h-5 w-5 shrink-0 ${status === 'out_of_service' ? 'text-red-400' : 'text-neutral-400'}`} />
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    Service Status: 
                    <span className={status === 'out_of_service' ? 'text-red-400' : 'text-emerald-400'}>
                      {status === 'out_of_service' ? 'CLOSED OUT OF SERVICE' : status.toUpperCase()}
                    </span>
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    {status === 'out_of_service' 
                      ? 'This room is currently blocked from all guest reservations and check-ins.' 
                      : 'Close this room out of service to block bookings for repairs, renovations, or inspections.'}
                  </p>
                </div>
              </div>

              {status === 'out_of_service' ? (
                <button
                  type="button"
                  onClick={handleQuickReopen}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all whitespace-nowrap"
                >
                  Restore to Service (Open)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleQuickOutOfService}
                  className="rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-all whitespace-nowrap"
                >
                  <Ban className="inline h-3.5 w-3.5 mr-1" />
                  Close Out of Service
                </button>
              )}
            </div>

            {status === 'out_of_service' && (
              <div className="mt-3 pt-3 border-t border-red-500/20">
                <label className="block text-[11px] font-semibold text-red-300 mb-1">
                  Reason for Out of Service Closure *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep bathroom plumbing overhaul, repaint, VIP block"
                  value={outOfServiceReason}
                  onChange={(e) => setOutOfServiceReason(e.target.value)}
                  className="w-full rounded-xl border border-red-500/30 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-red-400 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Primary Identity: Room Number & Custom Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Room Number / Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 101, 204, PH-401"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Room Name / Custom Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Sunset Royal Suite, Horizon Standard"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Room Category & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Room Category (3 Types) *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as RoomType)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="Standard Room">Standard Room</option>
                <option value="Deluxe Suite">Deluxe Suite</option>
                <option value="Presidential Suite">Presidential Suite</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Nightly Rate ({settings.currency.symbol}) *
              </label>
              <input
                type="number"
                min={10}
                required
                value={pricePerNight}
                onChange={(e) => setPricePerNight(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Floor Level *
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              >
                <option value={1}>Floor 1</option>
                <option value={2}>Floor 2</option>
                <option value={3}>Floor 3</option>
                <option value={4}>Floor 4 (Penthouse)</option>
                <option value={5}>Floor 5</option>
                <option value={6}>Floor 6</option>
              </select>
            </div>
          </div>

          {/* Operational Status & Max Guests */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Operational Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RoomStatus)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="available">Available (Ready)</option>
                <option value="occupied">Occupied (In-House)</option>
                <option value="reserved">Reserved (Hold)</option>
                <option value="cleaning">Housekeeping (Turnover)</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_service">Out of Service (Closed)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Max Guests Capacity
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={maxGuests}
                onChange={(e) => setMaxGuests(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Assigned Housekeeper
              </label>
              <input
                type="text"
                placeholder="e.g. Elena Rostova"
                value={assignedHousekeeper}
                onChange={(e) => setAssignedHousekeeper(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Bedding, Size, View */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Bed Setup
              </label>
              <input
                type="text"
                placeholder="e.g. 1 King Bed, 2 Queens"
                value={bedType}
                onChange={(e) => setBedType(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Room Size (m²)
              </label>
              <input
                type="number"
                min={10}
                value={sizeSqM}
                onChange={(e) => setSizeSqM(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Scenic View
              </label>
              <input
                type="text"
                placeholder="e.g. Ocean View, City Skyline"
                value={view}
                onChange={(e) => setView(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Internal Room Notes & Maintenance Logs
            </label>
            <textarea
              rows={2}
              placeholder="Add specific notes, key code info, or special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Footer Save & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-800">
            {/* Delete Room Option (Only for existing rooms) */}
            {!isNewRoom && onDeleteRoom ? (
              <div>
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-900/60 border border-rose-800/40 transition-all cursor-pointer"
                    title="Permanently remove this room property from hotel inventory"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Room</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-rose-950/90 border border-rose-600/60 px-3 py-1.5 rounded-xl text-xs">
                    <span className="text-rose-200 font-bold">Delete Room #{room.roomNumber}?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteRoom(room.id, room.roomNumber);
                        setShowDeleteConfirm(false);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-sm transition-colors"
                    >
                      Yes, Delete
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
              </div>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-neutral-800 px-4 py-2.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer ${
                  isNewRoom 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/50 shadow-emerald-950/50' 
                    : accent.primary
                }`}
              >
                {isNewRoom ? <Plus className="h-4 w-4 stroke-[3]" /> : <Check className="h-4 w-4" />}
                <span>{isNewRoom ? '+ Create & Add Room Property' : 'Save Room Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
