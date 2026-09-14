import React, { useState, useRef } from 'react';
import { 
  Building2, 
  DollarSign, 
  Palette, 
  Bell, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  MapPin, 
  Phone, 
  Mail, 
  Receipt,
  FileText,
  LayoutGrid,
  List,
  Columns3,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { UserSettings, Currency } from '../types';
import { getAccentClasses, playChime } from '../utils/helpers';
import { currencies } from '../data/mockData';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onResetData: () => void;
  onSelectRoomView?: (view: 'tape_chart' | 'grid' | 'list') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetData,
  onSelectRoomView,
}) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const accent = getAccentClasses(formData.accentColor);

  const handleChange = (field: keyof UserSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelected = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, SVG, WebP, GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image file is too large (maximum 5MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        handleChange('hotelLogoUrl', result);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to process image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleCurrencyChange = (currCode: string) => {
    const selected = currencies.find((c) => c.code === currCode);
    if (selected) {
      setFormData((prev) => ({ ...prev, currency: selected }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.soundEffects) playChime();
    onUpdateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hotel-settings-backup-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-12">
      
      {/* Header & Save Confirmation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-900/80 border border-neutral-800 p-4 rounded-2xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-400" />
            <span>Hotel Identity, Invoicing & System Configuration</span>
          </h3>
          <p className="text-xs text-neutral-400">
            Configure hotel metadata, legal address, tax rates, currencies, and invoice templates
          </p>
        </div>

        <button
          onClick={handleSave}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-md active:scale-95 ${accent.primary}`}
        >
          {saveSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{saveSuccess ? 'Changes Saved!' : 'Save System Settings'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>System configuration successfully updated. Changes applied to PMS views, invoices, and ledgers.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* SECTION 1: HOTEL IDENTITY & ADDRESS (INVOICE SYNC) */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Building2 className="h-4 w-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Hotel Branding & Legal Entity</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-neutral-400 mb-1 font-semibold">Hotel / Property Name *</label>
              <input
                type="text"
                required
                value={formData.hotelName}
                onChange={(e) => handleChange('hotelName', e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-neutral-400 font-semibold">Hotel Logo (File Upload / URL)</label>
                {formData.hotelLogoUrl && (
                  <button
                    type="button"
                    onClick={() => handleChange('hotelLogoUrl', '')}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                    title="Clear current logo"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Remove Logo</span>
                  </button>
                )}
              </div>

              {/* Upload Drop Zone & Preview */}
              <div className="space-y-2">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                    isDragging
                      ? 'border-amber-400 bg-amber-950/30'
                      : 'border-neutral-700 hover:border-neutral-500 bg-neutral-950/70 hover:bg-neutral-950'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelected(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {formData.hotelLogoUrl ? (
                    <div className="flex items-center gap-3 w-full">
                      <div className="h-12 w-12 rounded-lg bg-white p-1 border border-neutral-700 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                        <img
                          src={formData.hotelLogoUrl}
                          alt="Hotel Logo Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {formData.hotelLogoUrl.startsWith('data:') ? 'Custom Uploaded Image' : 'Linked Logo Image'}
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          Click or drag a new image here to replace
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 shrink-0 cursor-pointer flex items-center gap-1.5 border border-neutral-700"
                      >
                        <Upload className="h-3 w-3 text-amber-400" />
                        <span>Change</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 w-full py-1">
                      <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 text-neutral-400 group-hover:text-amber-400 group-hover:border-neutral-700 transition-colors">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                          Click to upload or drag & drop logo
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          Supports PNG, JPG, SVG, WebP, GIF (max 5MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <p className="text-[11px] text-rose-400 font-medium">{uploadError}</p>
                )}

                {/* Direct URL input fallback */}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[10px] text-neutral-500 font-mono shrink-0">Or URL:</span>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.hotelLogoUrl && formData.hotelLogoUrl.startsWith('data:') ? 'Custom uploaded image (stored locally in settings)' : (formData.hotelLogoUrl || '')}
                    disabled={Boolean(formData.hotelLogoUrl && formData.hotelLogoUrl.startsWith('data:'))}
                    onChange={(e) => handleChange('hotelLogoUrl', e.target.value)}
                    className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-300 placeholder-neutral-600 focus:border-amber-400 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {formData.hotelLogoUrl && formData.hotelLogoUrl.startsWith('data:') && (
                    <button
                      type="button"
                      onClick={() => handleChange('hotelLogoUrl', '')}
                      className="text-[10px] text-neutral-400 hover:text-amber-300 shrink-0 cursor-pointer underline"
                      title="Switch back to entering a web URL"
                    >
                      Use URL instead
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Invoice Address Fields */}
          <div className="pt-2 space-y-3">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              Official Tax & Invoice Header Address
            </span>

            <div className="grid grid-cols-12 gap-3 text-xs">
              <div className="col-span-12 sm:col-span-3">
                <label className="block text-neutral-400 mb-1">House / Building #</label>
                <input
                  type="text"
                  value={formData.houseNumber || '#168'}
                  onChange={(e) => handleChange('houseNumber', e.target.value)}
                  placeholder="#168"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>
              <div className="col-span-12 sm:col-span-5">
                <label className="block text-neutral-400 mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.streetAddress || 'Preah Norodom Blvd'}
                  onChange={(e) => handleChange('streetAddress', e.target.value)}
                  placeholder="Preah Norodom Blvd"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div className="col-span-12 sm:col-span-4">
                <label className="block text-neutral-400 mb-1">Commune / Sangkat</label>
                <input
                  type="text"
                  value={formData.communeSangkat || 'Tonle Bassac'}
                  onChange={(e) => handleChange('communeSangkat', e.target.value)}
                  placeholder="Tonle Bassac"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Town / District / Khan</label>
                <input
                  type="text"
                  value={formData.townKhan || 'Daun Penh'}
                  onChange={(e) => handleChange('townKhan', e.target.value)}
                  placeholder="Daun Penh"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Province / City & Country</label>
                <input
                  type="text"
                  value={formData.provinceCity || 'Phnom Penh, Cambodia'}
                  onChange={(e) => handleChange('provinceCity', e.target.value)}
                  placeholder="Phnom Penh"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Direct Telephone Hotline</label>
                <input
                  type="text"
                  value={formData.phone || '(+855) 23 888 999'}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(+855) 23 888 999"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Reservations & Manager Email</label>
                <input
                  type="email"
                  value={formData.managerEmail || 'reservations@royalpalacehotel.com'}
                  onChange={(e) => handleChange('managerEmail', e.target.value)}
                  placeholder="reservations@royalpalacehotel.com"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-neutral-300 font-semibold">VAT ID / Tax Number (TIN)</label>
                  <span className="text-[10px] text-amber-400 font-medium">Invoice Sync</span>
                </div>
                <input
                  type="text"
                  value={formData.vatNumber ?? ''}
                  onChange={(e) => handleChange('vatNumber', e.target.value)}
                  placeholder="e.g. K008-902401874"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none font-mono font-bold placeholder-neutral-600"
                  title="Official Tax Identification Number (TIN) / VAT number printed on guest folios, invoices, and exports"
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  Transfers directly to invoice header &amp; printable folios
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: FINANCIAL, CURRENCY & TAX CONFIGURATION */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Financial Currencies, Tax & Multi-Currency Rates</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-neutral-400 mb-1 font-semibold">Primary Currency</label>
              <select
                value={formData.currency.code}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1 font-semibold">Sales Tax Rate (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={formData.taxRatePercent}
                onChange={(e) => handleChange('taxRatePercent', Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono font-bold text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-neutral-300 font-semibold">Official VAT ID / TIN</label>
              </div>
              <input
                type="text"
                value={formData.vatNumber ?? ''}
                onChange={(e) => handleChange('vatNumber', e.target.value)}
                placeholder="K008-902401874"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs font-mono font-bold text-amber-400 focus:border-amber-400 focus:outline-none placeholder-neutral-600"
                title="Company VAT / Tax Identification Number"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1 font-semibold">KHR Exchange Rate (1 USD = ? ៛)</label>
              <input
                type="number"
                min={1000}
                max={10000}
                value={formData.exchangeRateKHR || formData.exchangeRateUSDToKHR || 4100}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    exchangeRateKHR: val,
                    exchangeRateUSDToKHR: val,
                  }));
                }}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: INTERFACE ACCENT COLOR & PREFERENCES */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Palette className="h-4 w-4 text-purple-400" />
            <h4 className="text-sm font-bold text-white">Theme Accent & UI Feedback</h4>
          </div>

          <div className="space-y-3">
            <label className="block text-xs text-neutral-400 font-semibold">
              Accent Color Palette
            </label>
            <div className="grid grid-cols-5 gap-3">
              {[
                { id: 'amber', name: 'Royal Amber', bg: 'bg-amber-500', ring: 'ring-amber-400' },
                { id: 'emerald', name: 'Emerald Forest', bg: 'bg-emerald-500', ring: 'ring-emerald-400' },
                { id: 'blue', name: 'Ocean Blue', bg: 'bg-blue-500', ring: 'ring-blue-400' },
                { id: 'purple', name: 'Imperial Violet', bg: 'bg-purple-500', ring: 'ring-purple-400' },
                { id: 'rose', name: 'Crimson Rose', bg: 'bg-rose-500', ring: 'ring-rose-400' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleChange('accentColor', c.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    formData.accentColor === c.id
                      ? `border-white/40 bg-neutral-800/90 ring-2 ${c.ring}`
                      : 'border-neutral-800 bg-neutral-950 hover:bg-neutral-800/50'
                  }`}
                >
                  <span className={`h-6 w-6 rounded-full ${c.bg} shadow-md`}></span>
                  <span className="text-[11px] font-bold text-neutral-300">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <Bell className="h-4 w-4 text-neutral-400" />
              <div>
                <span className="font-bold text-white block">Acoustic Audio Feedback</span>
                <span className="text-neutral-500 text-[11px]">Play subtle sound chimes on checkout and booking saves</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.soundEffects}
                onChange={(e) => handleChange('soundEffects', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>

        {/* SECTION 4: ROOM DISPLAY & VIEW MODES (MOVED FROM MAIN ROOMS BAR) */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between border-b border-neutral-800 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white">Room View Modes & Layout Preferences</h4>
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60">
              Moved from Front Office Bar
            </span>
          </div>

          <p className="text-xs text-neutral-400">
            Select your preferred display format for Front Office Room Management. You can also switch directly via the <strong className="text-amber-400">Tools</strong> menu above.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* 1. Tape Chart */}
            <div
              onClick={() => handleChange('defaultRoomView', 'tape_chart')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                (formData.defaultRoomView || 'tape_chart') === 'tape_chart'
                  ? 'border-amber-400/80 bg-amber-950/20 ring-1 ring-amber-400/50'
                  : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <Columns3 className="h-4 w-4 text-amber-400" />
                    <span>Tape Chart Rack</span>
                  </div>
                  {(formData.defaultRoomView || 'tape_chart') === 'tape_chart' && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">Active</span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400">
                  Full 21-day timeline grid with colored guest blocks and room reservation tape.
                </p>
              </div>
              {onSelectRoomView && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChange('defaultRoomView', 'tape_chart');
                    onSelectRoomView('tape_chart');
                  }}
                  className="mt-3 w-full py-1.5 text-[11px] font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                >
                  Open Tape Chart →
                </button>
              )}
            </div>

            {/* 2. Room Cards */}
            <div
              onClick={() => handleChange('defaultRoomView', 'grid')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                formData.defaultRoomView === 'grid'
                  ? 'border-amber-400/80 bg-amber-950/20 ring-1 ring-amber-400/50'
                  : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <LayoutGrid className="h-4 w-4 text-blue-400" />
                    <span>Room Cards</span>
                  </div>
                  {formData.defaultRoomView === 'grid' && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">Active</span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400">
                  Visual card tiles showing room status, guest names, daily rates, and quick action buttons.
                </p>
              </div>
              {onSelectRoomView && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChange('defaultRoomView', 'grid');
                    onSelectRoomView('grid');
                  }}
                  className="mt-3 w-full py-1.5 text-[11px] font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                >
                  Open Room Cards →
                </button>
              )}
            </div>

            {/* 3. Room Table */}
            <div
              onClick={() => handleChange('defaultRoomView', 'list')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                formData.defaultRoomView === 'list'
                  ? 'border-amber-400/80 bg-amber-950/20 ring-1 ring-amber-400/50'
                  : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <List className="h-4 w-4 text-emerald-400" />
                    <span>Room Table</span>
                  </div>
                  {formData.defaultRoomView === 'list' && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">Active</span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400">
                  Comprehensive tabular listing with sortable columns, floor groupings, and status filtering.
                </p>
              </div>
              {onSelectRoomView && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChange('defaultRoomView', 'list');
                    onSelectRoomView('list');
                  }}
                  className="mt-3 w-full py-1.5 text-[11px] font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                >
                  Open Room Table →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 5: DATA MANAGEMENT & BACKUP */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Download className="h-4 w-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white">System Data Backup & Storage</h4>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-white block">Export System JSON Snapshot</span>
              <span className="text-neutral-500 text-[11px]">Download your hotel profile and preferences for backup</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 px-3.5 py-2 text-xs font-semibold text-neutral-200 transition-colors shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Snapshot</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset entire system demo state to initial defaults?')) {
                    onResetData();
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-900/40 px-3.5 py-2 text-xs font-semibold text-red-300 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5 text-red-400" />
                <span>Reset to Factory Defaults</span>
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold transition-all shadow-xl active:scale-95 ${accent.primary}`}
          >
            <Save className="h-4 w-4" />
            <span>Save All System Configurations</span>
          </button>
        </div>
      </form>
    </div>
  );
};
