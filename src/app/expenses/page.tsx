'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import ThemeToggle from '@/components/ThemeToggle';
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
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navigation />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Operational Expenses
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Record daily utilities, store maintenance, supply purchases, and payroll.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="hidden sm:block">
              <ThemeToggle showLabel />
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block">Total</span>
              <span className="text-base font-bold text-red-600 dark:text-red-400">${totalExpense.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Expense
            </button>
          </div>
        </div>

        {/* Expenses Table (30% Surface) */}
        <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Logged By</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                  <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 font-mono">{e.date}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-medium border border-red-200 dark:border-red-900">
                      {e.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-slate-100">{e.description || 'General'}</td>
                  <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">{e.createdBy || 'Staff'}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-red-600 dark:text-red-400 text-sm">
                    ${e.amount.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="text-slate-400 hover:text-red-600 p-1 transition-colors"
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
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 w-full max-w-md shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Record Expense</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
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
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-sm font-bold text-red-600 dark:text-red-400 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description / Memo</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Storage electricity payment"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs"
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
