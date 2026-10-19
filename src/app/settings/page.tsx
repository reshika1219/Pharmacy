'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Settings, Save, CheckCircle, Store, Receipt } from 'lucide-react';

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
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">
      <Navigation />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full pb-24 lg:pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-[var(--accent)]" />
              Store Settings & Localization
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Configure business info, currency, tax rates, and receipt footers.
            </p>
          </div>
        </div>

        {success && (
          <div className="mb-4 p-2.5 rounded-lg bg-[var(--success-bg)] border border-[var(--border)] text-[var(--success-text)] text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[var(--success-text)]" />
            Settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Business Profile */}
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[var(--text)] flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
              <Store className="w-4 h-4 text-[var(--accent)]" />
              Business Profile
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Business Name</label>
                <input
                  type="text"
                  value={config.businessName || ''}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Store Address</label>
                  <input
                    type="text"
                    value={config.businessAddress || ''}
                    onChange={(e) => handleChange('businessAddress', e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={config.businessPhone || ''}
                    onChange={(e) => handleChange('businessPhone', e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Currency & Tax */}
          <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[var(--text)] flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
              <Receipt className="w-4 h-4 text-[var(--accent)]" />
              Financial & Tax
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={config.currency || '$'}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] font-bold focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Currency Code</label>
                <input
                  type="text"
                  value={config.currencyCode || 'USD'}
                  onChange={(e) => handleChange('currencyCode', e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] font-mono focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Default Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.taxRate || '5.0'}
                  onChange={(e) => handleChange('taxRate', e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] font-bold focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">Receipt Footer Message</label>
              <textarea
                rows={2}
                value={config.receiptFooter || ''}
                onChange={(e) => handleChange('receiptFooter', e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-semibold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
