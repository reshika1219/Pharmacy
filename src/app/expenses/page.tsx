'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Wallet, Plus, Trash2, Calendar, DollarSign, Tag } from 'lucide-react';

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
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
      <Navigation />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-400" />
              Operational Expenses
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Record daily utilities, store maintenance, supply purchases, and payroll.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Logged</span>
              <span className="text-lg font-black text-rose-400">${totalExpense.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Log Expense
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0f172a] border border-white/10 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Logged By</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 text-slate-400 font-mono">{e.date}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/15 text-rose-300 font-semibold border border-rose-500/20">
                      {e.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-white">{e.description || 'General'}</td>
                  <td className="py-3 px-4 text-slate-400">{e.createdBy || 'Staff'}</td>
                  <td className="py-3 px-4 text-right font-black text-rose-400 text-sm">
                    ${e.amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
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
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-bold text-white text-base">Record Operational Expense</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Expense Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white"
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
                  <label className="block font-semibold text-slate-300 mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white text-base font-bold text-rose-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Description / Memo</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Cold storage electricity payment"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
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
