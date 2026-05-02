import React from 'react';
import { Package, Plus, AlertTriangle } from 'lucide-react';

const Inventory = () => (
  <div className="animate-fade-in">
    <header className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
        <p className="text-slate-500">Track dialysis kits, filters, and medical supplies.</p>
      </div>
      <button className="bg-sky-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
        <Plus size={18} /> Update Stock
      </button>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-amber-500">
          <AlertTriangle size={20} />
          <span className="font-bold">Low Stock Warning</span>
        </div>
        <p className="text-sm text-slate-600">3 items are below the threshold.</p>
      </div>
    </div>
    <div className="mt-8 bg-white p-20 rounded-xl border border-slate-200 border-dashed text-center">
      <Package size={48} className="mx-auto text-slate-300 mb-4" />
      <h2 className="text-xl font-bold text-slate-800">Inventory list is being loaded...</h2>
    </div>
  </div>
);

export default Inventory;
