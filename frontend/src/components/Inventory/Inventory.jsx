import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  Download,
  Boxes,
  PackageX,
  Clock,
  X,
  Edit2,
  Trash2,
  Filter,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { inventoryService } from '../../services/api';
import './Inventory.css';

const CATEGORIES = ['All', 'Dialyzers', 'Tubing', 'Medication', 'PPE', 'Consumables', 'Others'];
const UNITS = ['pcs', 'sets', 'vials', 'boxes', 'bags'];

const DEFAULT_ITEM = {
  item_code: '',
  name: '',
  category: 'Dialyzers',
  stock: '',
  threshold: '',
  unit: 'pcs',
  expiry: '',
  other_category: '',
};

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentItem, setCurrentItem] = useState(DEFAULT_ITEM);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getAll();
      setItems(response.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const nextItemCode = () => {
    const numbers = items
      .map((i) => parseInt((i.item_code || '').replace(/[^0-9]/g, ''), 10))
      .filter((n) => !isNaN(n));
    const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
    return `INV-${String(next).padStart(3, '0')}`;
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setCurrentItem({ ...DEFAULT_ITEM, item_code: nextItemCode() });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setCurrentItem({
      ...DEFAULT_ITEM,
      ...item,
      expiry: item.expiry || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this item from inventory?')) return;
    try {
      await inventoryService.delete(id);
      fetchItems();
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      alert('Failed to delete item.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        item_code: currentItem.item_code || nextItemCode(),
        name: currentItem.name,
        category: currentItem.category,
        stock: parseInt(currentItem.stock, 10) || 0,
        threshold: parseInt(currentItem.threshold, 10) || 0,
        unit: currentItem.unit,
        expiry: currentItem.expiry || null,
        other_category: currentItem.other_category || '',
      };
      if (modalMode === 'add') {
        await inventoryService.create(payload);
      } else {
        await inventoryService.update(currentItem.id, payload);
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      console.error('Error saving inventory item:', err);
      const data = err.response?.data;
      const msg = data
        ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n')
        : 'Failed to save item.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    { label: 'Total Items', value: items.length, icon: <Boxes size={20} />, color: 'sky' },
    {
      label: 'Low Stock',
      value: items.filter((i) => i.stock > 0 && i.stock < i.threshold).length,
      icon: <AlertTriangle size={20} />,
      color: 'amber',
    },
    {
      label: 'Out of Stock',
      value: items.filter((i) => i.stock <= 0).length,
      icon: <PackageX size={20} />,
      color: 'rose',
    },
    {
      label: 'Total Qty',
      value: items.reduce((acc, curr) => acc + (parseInt(curr.stock, 10) || 0), 0),
      icon: <Clock size={20} />,
      color: 'violet',
    },
  ];

  const filtered = items.filter(
    (i) =>
      (activeCategory === 'All' || i.category === activeCategory) &&
      (i.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const doc = new jsPDF();
    
    // Header Section
    doc.setFontSize(24);
    doc.setTextColor(14, 165, 233); // sky-500
    doc.text('TANKER Foundation', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text('DialyCare Management Portal - Inventory Status Report', 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);
    
    // Summary Block
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.5);
    doc.line(14, 42, 196, 42);

    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('Inventory Executive Summary', 14, 52);
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    const lowStock = items.filter(i => i.stock < i.threshold && i.stock > 0).length;
    const outOfStock = items.filter(i => i.stock <= 0).length;
    
    doc.text(`Total SKU Items tracked: ${items.length}`, 14, 62);
    doc.text(`Items with Low Stock Warning: ${lowStock}`, 14, 68);
    doc.text(`Out of Stock (Action Required): ${outOfStock}`, 14, 74);
    doc.text(`Total Units in Inventory: ${items.reduce((acc, i) => acc + (parseInt(i.stock) || 0), 0)}`, 14, 80);

    // Separator before Table
    doc.setDrawColor(241, 245, 249);
    doc.line(14, 86, 196, 86);

    const tableData = filtered.map(item => [
      item.item_code,
      item.name,
      item.category === 'Others' ? item.other_category : item.category,
      `${item.stock} ${item.unit}`,
      item.threshold,
      item.expiry || 'N/A',
      item.status.toUpperCase()
    ]);

    autoTable(doc, {
      startY: 92,
      head: [['Code', 'Item Name', 'Category', 'Stock', 'Min', 'Expiry', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      const syntaxNum = `TC-INV-REP-${Math.floor(1000 + Math.random() * 9000)}`;
      doc.text(`Syntax: ${syntaxNum} | Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    }

    doc.save(`inventory_report_${new Date().getTime()}.pdf`);
  };

  const getStatusClass = (status) =>
    `status-badge status-${(status || '').toLowerCase().replace(/ /g, '-')}`;

  return (
    <div className="inventory-container animate-fade-in">
      <header className="inventory-header">
        <div className="header-actions">
          <button className="export-btn" onClick={handleExport}>
            <Download size={18} /> Export
          </button>
          <button
            className="add-item-btn shadow-lg shadow-sky-100 hover:scale-105 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenAdd();
            }}
          >
            <Plus size={18} /> Add Item
          </button>
        </div>
      </header>

      <div className="inventory-stats">
        {stats.map((s) => (
          <div key={s.label} className="stat-card card">
            <div>
              <p className="stat-label">{s.label}</p>
              <h3 className="stat-value">{s.value}</h3>
            </div>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="inventory-filters">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items by name..."
          />
        </div>
        <div className="category-select-wrapper">
          <Filter size={16} className="filter-icon" />
          <select 
            value={activeCategory} 
            onChange={(e) => setActiveCategory(e.target.value)}
            className="category-dropdown"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="inventory-table-container card">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Item Name</th>
              <th>Category</th>
              <th>Stock Level</th>
              <th>Expiry</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading inventory...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state-container">
                    <Package size={48} className="empty-icon" />
                    <p>No items found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td className="item-id">{item.item_code}</td>
                  <td className="item-name">{item.name}</td>
                  <td className="text-slate-600">
                    {item.category === 'Others' ? (item.other_category || 'Others') : item.category}
                  </td>
                  <td>
                    <span className="stock-count">
                      {item.stock} {item.unit}
                    </span>
                    <span className="stock-min">min {item.threshold}</span>
                  </td>
                  <td className="text-slate-600">{item.expiry || '—'}</td>
                  <td>
                    <span className={getStatusClass(item.status)}>{item.status}</span>
                  </td>
                  <td className="text-right">
                    <div className="action-buttons">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Item"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(item.id)}
                        title="Delete Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content card animate-pop" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Add New Item' : 'Edit Item Details'}</h2>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="inventory-form">
              <div className="form-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Item Code</label>
                  <input
                    type="text"
                    value={currentItem.item_code}
                    onChange={(e) => setCurrentItem({ ...currentItem, item_code: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Item Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Saline Solution"
                    value={currentItem.name}
                    onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={currentItem.category}
                    onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })}
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select
                    value={currentItem.unit}
                    onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {currentItem.category === 'Others' && (
                <div className="form-row animate-slide-down" style={{ marginBottom: '0.25rem' }}>
                  <div className="form-group">
                    <label>Specify Custom Category</label>
                    <input
                      required
                      type="text"
                      placeholder="Enter custom category name..."
                      value={currentItem.other_category || ''}
                      onChange={(e) => setCurrentItem({ ...currentItem, other_category: e.target.value })}
                      className="focus:border-sky-500 transition-colors"
                    />
                  </div>
                  <div />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Current Stock</label>
                  <input
                    required
                    type="number"
                    placeholder="0"
                    value={currentItem.stock}
                    onChange={(e) => setCurrentItem({ ...currentItem, stock: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Min. Threshold</label>
                  <input
                    required
                    type="number"
                    placeholder="10"
                    value={currentItem.threshold}
                    onChange={(e) => setCurrentItem({ ...currentItem, threshold: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={currentItem.expiry || ''}
                    onChange={(e) => setCurrentItem({ ...currentItem, expiry: e.target.value })}
                  />
                </div>
                <div />
              </div>
            </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={saving}>
                  {saving ? 'Saving...' : modalMode === 'add' ? 'Add to Inventory' : 'Update Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
