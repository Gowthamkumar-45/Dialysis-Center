import React from 'react';
import { Receipt, Download, TrendingUp } from 'lucide-react';

const Billing = () => (
  <div className="animate-fade-in">
    <header className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Billing & Invoices</h1>
        <p className="text-slate-500">Manage patient billing, insurance claims, and payments.</p>
      </div>
      <button className="bg-sky-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
        <Download size={18} /> Export Report
      </button>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <span className="text-xs font-bold text-slate-500 block mb-1">UNPAID REVENUE</span>
        <h3 className="text-xl font-bold text-rose-500">$12,450.00</h3>
      </div>
    </div>
    <div className="mt-8 bg-white p-20 rounded-xl border border-slate-200 border-dashed text-center">
      <Receipt size={48} className="mx-auto text-slate-300 mb-4" />
      <h2 className="text-xl font-bold text-slate-800">Billing history is being compiled...</h2>
    </div>
  </div>
);

export default Billing;
