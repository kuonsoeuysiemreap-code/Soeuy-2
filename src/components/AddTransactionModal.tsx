import React, { useState } from 'react';
import { 
  X, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw 
} from 'lucide-react';
import { Transaction, TransactionType, TransactionCategory, PaymentMethod, PaymentStatus, Room, UserSettings } from '../types';
import { getAccentClasses, playChime } from '../utils/helpers';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  settings: UserSettings;
  onAddTransaction: (transaction: Transaction) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  rooms,
  settings,
  onAddTransaction,
}) => {
  const accent = getAccentClasses(settings.accentColor);
  const [type, setType] = useState<TransactionType>('income');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('Room Booking');
  const [amount, setAmount] = useState<number | ''>(350);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [status, setStatus] = useState<PaymentStatus>('paid');
  const [guestOrVendor, setGuestOrVendor] = useState('');
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const categoriesByType: Record<TransactionType, TransactionCategory[]> = {
    income: ['Room Booking', 'Food & Beverage', 'Spa & Wellness', 'Airport Shuttle', 'Taxes & Fees'],
    expense: ['Housekeeping & Supplies', 'Maintenance & Utilities', 'Staff Payroll', 'Marketing', 'Taxes & Fees'],
    refund: ['Room Booking', 'Spa & Wellness', 'Food & Beverage'],
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(categoriesByType[newType][0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0) return;

    if (settings.soundEffects) playChime();

    const prefix = type === 'income' ? 'INV' : type === 'expense' ? 'EXP' : 'REF';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `${prefix}-2026-${randomNum}`;
    const numAmount = Number(amount);
    const taxAmount = (numAmount * settings.taxRatePercent) / 100;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      invoiceNumber,
      date,
      description,
      type,
      category,
      amount: numAmount,
      paymentMethod,
      status,
      guestOrVendor: guestOrVendor || (type === 'expense' ? 'Authorized Supplier' : 'In-House Guest'),
      roomNumber: roomNumber ? roomNumber : undefined,
      taxAmount: type === 'income' ? taxAmount : undefined,
      notes: notes || undefined,
    };

    onAddTransaction(newTx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-950/80 p-4 backdrop-blur-md animate-in fade-in">
      <div 
        className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-950 border border-neutral-700/60 ${accent.glow}`}>
              <DollarSign className={`h-5 w-5 ${accent.text}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record Financial Entry</h3>
              <p className="text-xs text-neutral-400">Post transaction to accounting ledger</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Type Selector (Income, Expense, Refund) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
              <span>Revenue (+)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5 text-rose-400" />
              <span>Expense (-)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('refund')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                type === 'refund'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5 text-purple-400" />
              <span>Refund (±)</span>
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1 font-semibold">
              Transaction Title / Description *
            </label>
            <input
              type="text"
              required
              placeholder={
                type === 'income'
                  ? 'e.g. Wine Tasting Dinner & Sommelier'
                  : type === 'expense'
                  ? 'e.g. Monthly High-Speed Fiber Internet & TV Licensing'
                  : 'e.g. Weather cancellation refund'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Category & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-400 mb-1 font-semibold">
                Ledger Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              >
                {categoriesByType[type].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1 font-semibold">
                Amount ({settings.currency.symbol}) *
              </label>
              <input
                type="number"
                required
                min={1}
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono font-bold text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Guest / Vendor & Room */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-400 mb-1 font-semibold">
                {type === 'expense' ? 'Payee / Vendor Name' : 'Guest / Customer Name'}
              </label>
              <input
                type="text"
                placeholder={type === 'expense' ? 'e.g. EcoClean Supplies Co.' : 'e.g. Lord Pemberton'}
                value={guestOrVendor}
                onChange={(e) => setGuestOrVendor(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1 font-semibold">
                Link to Room (Optional)
              </label>
              <select
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="">None / General Hotel</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.roomNumber}>
                    Room {r.roomNumber} ({r.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method & Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-neutral-400 mb-1 font-semibold">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Stripe">Stripe</option>
                <option value="Apple Pay">Apple Pay</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1 font-semibold">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="paid">Paid (Settled)</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1 font-semibold">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1">
              Internal Reference Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Approved by Chief Accountant"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-800 px-4 py-2 text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`rounded-xl px-5 py-2 text-xs font-bold transition-all shadow-md ${accent.primary}`}
            >
              Record to Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
