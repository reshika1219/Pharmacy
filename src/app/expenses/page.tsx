'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Wallet, Plus, Trash2 } from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState('Utilities');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const loadExpenses = () => {
    fetch('/api/expenses')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setExpenses(d));
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, description, amount }),
    });
    if (res.ok) {
      setShowModal(false);
      setDescription('');
      setAmount('');
      loadExpenses();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this expense entry?')) return;
    await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
    loadExpenses();
  };

  const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">
      <Navigation />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[var(--accent)]" />
              Operational Expenses
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Record daily utilities, store maintenance, supply purchases, and payroll.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">Total</span>
              <span className="text-base font-bold text-[var(--error-text)]">${totalExpense.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-3.5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-semibold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Expense
            </button>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-[var(--text-secondary)] font-semibold">
              <tr>
                <th className="py-3 px-4 font-semibold text-[var(--text)]">Date</th>
                <th className="py-3 px-4 font-semibold text-[var(--text)]">Category</th>
                <th className="py-3 px-4 font-semibold text-[var(--text)]">Description</th>
                <th className="py-3 px-4 font-semibold text-[var(--text)]">Logged By</th>
                <th className="py-3 px-4 text-right font-semibold text-[var(--text)]">Amount</th>
                <th className="py-3 px-4 text-right font-semibold text-[var(--text)]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="py-2.5 px-4 text-[var(--text-secondary)] font-mono">{e.date}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-[var(--surface-hover)] text-[var(--text-secondary)] font-medium border border-[var(--border)]">
                      {e.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-medium text-[var(--text)]">{e.description || 'General'}</td>
                  <td className="py-2.5 px-4 text-[var(--text-secondary)]">{e.createdBy || 'Staff'}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-[var(--error-text)] text-sm">
                    ${e.amount.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--error-text)] p-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal: Log Expense */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 w-full max-w-md shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <h3 className="font-bold text-[var(--text)] text-sm">Record Expense</h3>
                <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Expense Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="Utilities">Utilities (Electricity, Water, Internet)</option>
                    <option value="Supplies">Store Supplies & Packaging</option>
                    <option value="Rent">Rent & Facilities</option>
                    <option value="Salaries">Staff Salaries & Advances</option>
                    <option value="Maintenance">Equipment Maintenance</option>
                    <option value="Other">Other Expenses</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] text-sm font-bold text-[var(--error-text)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Description / Memo</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Storage electricity payment"
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
                    Record Expense
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
