import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Receipt, 
  Printer, 
  Trash2, 
  CreditCard, 
  Banknote, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  DollarSign, 
  FileText 
} from 'lucide-react';
import { Transaction, TransactionType, TransactionCategory, Room, UserSettings } from '../types';
import { formatCurrency, getAccentClasses, getTransactionStatusBadge, playChime } from '../utils/helpers';

interface AccountingViewProps {
  transactions: Transaction[];
  rooms: Room[];
  settings: UserSettings;
  onOpenAddTransaction: () => void;
  onViewInvoice: (transaction: Transaction, room?: Room) => void;
  onDeleteTransaction: (id: string) => void;
}

export const AccountingView: React.FC<AccountingViewProps> = ({
  transactions,
  rooms,
  settings,
  onOpenAddTransaction,
  onViewInvoice,
  onDeleteTransaction,
}) => {
  const accent = getAccentClasses(settings.accentColor);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.guestOrVendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.roomNumber && tx.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;

      return matchesSearch && matchesType && matchesCategory && matchesStatus;
    });
  }, [transactions, searchQuery, typeFilter, categoryFilter, statusFilter]);

  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let totalRefund = 0;
    let pendingIncome = 0;
    let totalTaxCollected = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        if (tx.status === 'paid') totalIncome += tx.amount;
        else if (tx.status === 'pending') pendingIncome += tx.amount;
        if (tx.taxAmount) totalTaxCollected += tx.taxAmount;
      } else if (tx.type === 'expense') {
        if (tx.status === 'paid') totalExpense += tx.amount;
      } else if (tx.type === 'refund') {
        totalRefund += tx.amount;
      }
    });

    const netProfit = totalIncome - totalExpense - totalRefund;
    const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;

    return {
      totalIncome,
      totalExpense,
      totalRefund,
      netProfit,
      profitMargin,
      pendingIncome,
      totalTaxCollected,
    };
  }, [transactions]);

  const categories: TransactionCategory[] = [
    'Room Booking',
    'Food & Beverage',
    'Spa & Wellness',
    'Housekeeping & Supplies',
    'Maintenance & Utilities',
    'Staff Payroll',
    'Airport Shuttle',
    'Marketing',
    'Taxes & Fees',
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* Financial KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4.5 flex items-center justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span>Total Revenue</span>
            </div>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {formatCurrency(summary.totalIncome, settings.currency.symbol)}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-0.5">
              Settled room & amenity earnings
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4.5 flex items-center justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-400">
              <TrendingDown className="h-4 w-4" />
              <span>Operating Expenses</span>
            </div>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {formatCurrency(summary.totalExpense, settings.currency.symbol)}
            </div>
            <div className="text-[11px] text-rose-400/80 mt-0.5">
              Payroll, supplies & utilities
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <ArrowUpRight className="h-6 w-6" />
          </div>
        </div>

        {/* Net Profit & Margin */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4.5 flex items-center justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Scale className="h-4 w-4" />
              <span>Net Operating Profit</span>
            </div>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {formatCurrency(summary.netProfit, settings.currency.symbol)}
            </div>
            <div className="text-[11px] text-amber-300/90 font-mono mt-0.5 font-bold">
              {summary.profitMargin}% Net Margin
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Receipt className="h-6 w-6" />
          </div>
        </div>

        {/* Pending & Tax Metrics */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4.5 flex items-center justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-400">
              <FileText className="h-4 w-4" />
              <span>Pending Receivables</span>
            </div>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {formatCurrency(summary.pendingIncome, settings.currency.symbol)}
            </div>
            <div className="text-[11px] text-purple-300/80 mt-0.5">
              Tax Collected: {formatCurrency(summary.totalTaxCollected, settings.currency.symbol)}
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Banknote className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Accounting Toolbar & Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-neutral-900/80 border border-neutral-800 p-3.5 rounded-2xl">
        
        {/* Left: Search & Filter controls */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search invoice, guest, payee, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-300 focus:border-amber-400 focus:outline-none"
          >
            <option value="all">All Flow Types</option>
            <option value="income">Revenue (+)</option>
            <option value="expense">Expense (-)</option>
            <option value="refund">Refund (±)</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-300 focus:border-amber-400 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-300 focus:border-amber-400 focus:outline-none"
          >
            <option value="all">All Settlements</option>
            <option value="paid">Paid / Settled</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Right: Record Transaction Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-700 transition-all shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Ledger</span>
          </button>
          
          <button
            onClick={onOpenAddTransaction}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition-all shadow-md ${accent.primary}`}
          >
            <Plus className="h-4 w-4" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* General Ledger Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/90 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Invoice # / Date</th>
                <th className="py-3 px-3">Description & Category</th>
                <th className="py-3 px-3">Guest / Payee</th>
                <th className="py-3 px-3">Room</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filteredTransactions.map((tx) => {
                const statusInfo = getTransactionStatusBadge(tx.status);
                const matchingRoom = tx.roomNumber ? rooms.find((r) => r.roomNumber === tx.roomNumber) : undefined;

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-neutral-800/50 transition-colors group cursor-pointer"
                    onClick={() => onViewInvoice(tx, matchingRoom)}
                  >
                    {/* Invoice & Date */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-white text-xs">
                        {tx.invoiceNumber}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        {tx.date}
                      </div>
                    </td>

                    {/* Description & Category */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-white group-hover:text-amber-300 transition-colors">
                        {tx.description}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {tx.category}
                      </div>
                    </td>

                    {/* Guest / Vendor */}
                    <td className="py-3 px-3 font-medium text-neutral-200">
                      {tx.guestOrVendor}
                    </td>

                    {/* Room */}
                    <td className="py-3 px-3">
                      {tx.roomNumber ? (
                        <span className="font-mono font-bold text-amber-300 text-xs px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/40">
                          #{tx.roomNumber}
                        </span>
                      ) : (
                        <span className="text-neutral-500 italic">—</span>
                      )}
                    </td>

                    {/* Method */}
                    <td className="py-3 px-3 text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        {tx.paymentMethod === 'Cash' ? (
                          <Banknote className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <CreditCard className="h-3.5 w-3.5 text-amber-400" />
                        )}
                        <span>{tx.paymentMethod}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${statusInfo}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          tx.status === 'paid' ? 'bg-emerald-400' : tx.status === 'pending' ? 'bg-amber-400' : tx.status === 'refunded' ? 'bg-purple-400' : 'bg-rose-400'
                        }`}></span>
                        {tx.status}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-sm">
                      <span
                        className={
                          tx.type === 'income'
                            ? 'text-emerald-400'
                            : tx.type === 'expense'
                            ? 'text-rose-400'
                            : 'text-purple-400'
                        }
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '±'}
                        {formatCurrency(tx.amount, settings.currency.symbol)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewInvoice(tx, matchingRoom)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 text-[11px] font-semibold transition-all shadow-xs"
                          title="Generate printable invoice / guest folio"
                        >
                          <Receipt className="h-3 w-3" />
                          <span>Folio</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete transaction record ${tx.invoiceNumber}?`)) {
                              if (settings.soundEffects) playChime();
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className="p-1 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-t border-neutral-800 bg-neutral-950/80 text-xs font-mono text-neutral-400">
          <div>
            Showing <strong>{filteredTransactions.length}</strong> of <strong>{transactions.length}</strong> transactions
          </div>
          <div className="flex items-center gap-4 text-neutral-300">
            <span>
              Net: <strong className="text-emerald-400 font-bold">{formatCurrency(summary.netProfit, settings.currency.symbol)}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
