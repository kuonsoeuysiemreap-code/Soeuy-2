import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  X, 
  Check, 
  ArrowRightLeft, 
  TrendingUp, 
  Building2, 
  Calculator, 
  Sparkles, 
  DollarSign 
} from 'lucide-react';
import { UserSettings } from '../types';
import { playChime } from '../utils/helpers';

interface ExchangeRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateExchangeRate: (rate: number) => void;
}

export const ExchangeRateModal: React.FC<ExchangeRateModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateExchangeRate,
}) => {
  const currentRate = settings.exchangeRateUSDToKHR || settings.exchangeRateKHR || 4100;
  const [rate, setRate] = useState<number>(currentRate);
  const [calcUSD, setCalcUSD] = useState<string>('50');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const active = settings.exchangeRateUSDToKHR || settings.exchangeRateKHR || 4100;
      setRate(active);
      setIsSavedNotice(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const presets = [
    { label: '4,000 ៛', value: 4000, desc: 'Flat Rounded' },
    { label: '4,015 ៛', value: 4015, desc: 'Commercial Peg' },
    { label: '4,050 ៛', value: 4050, desc: 'NBC Reference' },
    { label: '4,080 ៛', value: 4080, desc: 'Hotel Counter' },
    { label: '4,100 ៛', value: 4100, desc: 'Hospitality Standard' },
    { label: '4,120 ៛', value: 4120, desc: 'POS / Credit Card' },
    { label: '4,150 ៛', value: 4150, desc: 'High Season Rate' },
  ];

  const handleSave = (newRateToSave?: number) => {
    const targetRate = newRateToSave !== undefined ? newRateToSave : rate;
    if (targetRate <= 0 || isNaN(targetRate)) return;
    
    if (settings.soundEffects) playChime();
    onUpdateExchangeRate(targetRate);
    setIsSavedNotice(true);
    setTimeout(() => {
      onClose();
    }, 450);
  };

  const numericCalcUSD = parseFloat(calcUSD) || 0;
  const calcKHR = Math.round(numericCalcUSD * rate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[#90b2d6] bg-gradient-to-b from-[#f8fafc] via-[#edf3fa] to-[#e2ebf6] shadow-2xl">
        
        {/* Header (Classic PMS Blue) */}
        <div className="bg-gradient-to-r from-[#173a62] via-[#224b7a] to-[#1e446f] px-4 py-3 text-white flex items-center justify-between border-b border-[#0f2947] shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <span>KHR / USD Exchange Rate Manager</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Live System-Wide
                </span>
              </h3>
              <p className="text-[11px] text-blue-200">
                Configure dual-currency conversion rate for Invoices, Night Audit & Folios
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-blue-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          
          {/* Main Exchange Rate Input Card */}
          <div className="bg-white rounded-xl p-4 border border-[#b8cee4] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1a365d] uppercase tracking-wide flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Base Official Rate (1 USD = ? KHR)</span>
              </label>
              <span className="text-[11px] text-neutral-500 font-mono">
                Cambodian Riel (៛)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center bg-emerald-50 border border-emerald-300 rounded-lg px-3 py-2 text-emerald-800 font-mono font-black text-sm">
                $1.00 USD =
              </div>
              
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1000"
                  max="10000"
                  step="5"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full text-center font-mono text-xl font-black text-[#1e3a8a] bg-amber-50/60 border-2 border-amber-400 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-amber-800">
                  ៛ KHR
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleSave()}
                className="flex items-center gap-1.5 bg-gradient-to-b from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer border border-[#1e40af]"
              >
                {isSavedNotice ? <Check className="w-4 h-4 text-amber-300" /> : <Check className="w-4 h-4" />}
                <span>{isSavedNotice ? 'Saved!' : 'Apply Rate'}</span>
              </button>
            </div>

            {/* Presets Row */}
            <div>
              <span className="text-[11px] font-semibold text-neutral-600 block mb-1.5">
                Hospitality & Bank Presets:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => {
                      setRate(p.value);
                      handleSave(p.value);
                    }}
                    className={`px-2 py-1.5 rounded-lg text-xs font-mono transition-all border text-left cursor-pointer ${
                      rate === p.value
                        ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-xs'
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{p.label}</span>
                      {rate === p.value && <Check className="w-3 h-3 text-amber-600" />}
                    </div>
                    <span className="text-[9px] text-neutral-500 font-sans block">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Dual-Currency Conversion Reference */}
          <div className="bg-[#f0f6fc] rounded-xl p-3.5 border border-[#bfd7ed] space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#1e3a5f]">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-blue-600" />
                <span>Front Desk Quick Conversion Reference</span>
              </span>
              <span className="font-mono text-[11px] text-blue-700 font-normal">
                @ {rate.toLocaleString()} ៛
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
              {[1, 5, 10, 20, 50, 100].map((usd) => (
                <div key={usd} className="bg-white p-1.5 rounded-lg border border-[#cbd5e1] shadow-2xs">
                  <div className="font-bold text-neutral-800">${usd}</div>
                  <div className="text-[10px] font-black text-blue-700 mt-0.5">
                    {(usd * rate).toLocaleString()} ៛
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Test Calculator */}
            <div className="pt-2 border-t border-[#bfd7ed] flex items-center gap-2 text-xs">
              <span className="font-semibold text-neutral-600 whitespace-nowrap">Test Amount:</span>
              <div className="flex items-center bg-white border border-[#cbd5e1] rounded px-2 py-1 gap-1">
                <span className="text-neutral-500 font-mono">$</span>
                <input
                  type="number"
                  value={calcUSD}
                  onChange={(e) => setCalcUSD(e.target.value)}
                  className="w-16 font-mono font-bold text-neutral-900 bg-transparent outline-none text-xs"
                />
              </div>
              <ArrowRightLeft className="w-3 h-3 text-neutral-400" />
              <div className="font-mono font-bold text-blue-900 bg-blue-100/80 px-2 py-1 rounded border border-blue-300">
                {calcKHR.toLocaleString()} ៛ KHR
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#e4edf7] px-5 py-3 border-t border-[#cbd5e1] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Applies across Invoices, Night Audit, POS, and Receipts</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-200 border border-neutral-300 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-sm transition-all cursor-pointer"
            >
              Save Rate
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
