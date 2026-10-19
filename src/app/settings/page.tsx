'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Settings, Save, CheckCircle, Shield, Store, Receipt } from 'lucide-react';

export default function SettingsPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((d) => setConfig(d));
  }, []);

  const handleChange = (key: string, val: string) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
      <Navigation />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full pb-24 lg:pb-12">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            Store Settings & Localization
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Configure business information, receipt headers, currency, and tax parameters.
          </p>
        </div>

        {success && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Store Info */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/10 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Store className="w-4 h-4 text-indigo-400" />
              Business Profile
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Business Name</label>
                <input
                  type="text"
                  value={config.businessName || ''}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Store Address</label>
                  <input
                    type="text"
                    value={config.businessAddress || ''}
                    onChange={(e) => handleChange('businessAddress', e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={config.businessPhone || ''}
                    onChange={(e) => handleChange('businessPhone', e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Currency & Tax */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/10 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Receipt className="w-4 h-4 text-emerald-400" />
              Financial & Tax Rates
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={config.currency || '$'}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Currency Code</label>
                <input
                  type="text"
                  value={config.currencyCode || 'USD'}
                  onChange={(e) => handleChange('currencyCode', e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Default Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.taxRate || '5.0'}
                  onChange={(e) => handleChange('taxRate', e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white font-bold"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-slate-300 mb-1">Thermal Receipt Footer Note</label>
              <textarea
                rows={2}
                value={config.receiptFooter || ''}
                onChange={(e) => handleChange('receiptFooter', e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-indigo-600/30 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
