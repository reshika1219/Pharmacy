'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Users, Plus, Phone, Award } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const loadCustomers = () => {
    fetch('/api/customers')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setCustomers(d));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, address }),
    });
    if (res.ok) {
      setShowModal(false);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      loadCustomers();
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">
      <Navigation />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--accent)]" />
              Customer Relationship Management (CRM)
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Track customer profiles, cumulative purchase spend, and loyalty points.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowModal(true)}
              className="px-3.5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-semibold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Customer Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {customers.map((c) => (
            <div key={c.id} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-[var(--text)] text-sm">{c.name}</h3>
                  <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-[var(--text-muted)]" />
                    {c.phone || 'No phone'}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--warning-bg)] text-[var(--warning-text)] border border-[var(--border)] flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  {c.loyaltyPoints} pts
                </span>
              </div>

              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Total Spent:</span>
                <span className="font-bold text-[var(--success-text)]">${(c.totalSpent || 0).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Add Customer */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 w-full max-w-md shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <h3 className="font-bold text-[var(--text)] text-sm">New Customer</h3>
                <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Johnathan Walker"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, City"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-semibold text-xs shadow-xs cursor-pointer"
                  >
                    Save Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
