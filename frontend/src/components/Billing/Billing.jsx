import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Download,
  Plus,
  Search,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  X,
  Edit2,
  Trash2,
  Filter,
  Eye,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { invoiceService, patientService } from '../../services/api';
import './Billing.css';

const STATUSES = ['All', 'Paid', 'Pending', 'Overdue', 'Draft'];
const METHODS = ['Self-Pay', 'CMCHIS', 'Insurance'];

const todayStr = () => new Date().toISOString().split('T')[0];
const inFortnightStr = () =>
  new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const DEFAULT_INVOICE = () => ({
  invoice_number: '',
  patient: '',
  patient_name: '',
  patient_uid: '',
  issued_date: todayStr(),
  due_date: inFortnightStr(),
  amount: '',
  method: 'Self-Pay',
  status: 'Pending',
  notes: '',
});

const Billing = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentInvoice, setCurrentInvoice] = useState(DEFAULT_INVOICE());
  const [saving, setSaving] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [invRes, patRes] = await Promise.all([
        invoiceService.getAll(),
        patientService.getAll(),
      ]);
      setInvoices(invRes.data);
      setPatients(patRes.data);
    } catch (err) {
      console.error('Error loading billing data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const nextInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const used = invoices
      .map((i) => parseInt((i.invoice_number || '').split('-').pop(), 10))
      .filter((n) => !isNaN(n));
    const next = (used.length ? Math.max(...used) : 0) + 1;
    return `INV-${year}-${String(next).padStart(4, '0')}`;
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setCurrentInvoice({ ...DEFAULT_INVOICE(), invoice_number: nextInvoiceNumber() });
    setPatientSearch('');
    setShowModal(true);
  };

  const handleOpenEdit = (inv) => {
    setModalMode('edit');
    setCurrentInvoice({
      ...DEFAULT_INVOICE(),
      ...inv,
      patient: inv.patient || '',
      amount: inv.amount?.toString() || '',
    });
    setPatientSearch(inv.patient_name || '');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice permanently?')) return;
    try {
      await invoiceService.delete(id);
      fetchAll();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      alert('Failed to delete invoice.');
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        invoice_number: currentInvoice.invoice_number || nextInvoiceNumber(),
        patient: currentInvoice.patient ? parseInt(currentInvoice.patient, 10) : null,
        patient_name: currentInvoice.patient_name,
        patient_uid: currentInvoice.patient_uid,
        issued_date: currentInvoice.issued_date,
        due_date: currentInvoice.due_date,
        amount: parseFloat(currentInvoice.amount) || 0,
        method: currentInvoice.method,
        status: currentInvoice.status,
        notes: currentInvoice.notes || '',
      };
      if (modalMode === 'add') {
        await invoiceService.create(payload);
      } else {
        await invoiceService.update(currentInvoice.id, payload);
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      console.error('Error saving invoice:', err);
      const data = err.response?.data;
      const msg = data
        ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n')
        : 'Failed to save invoice.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const sum = (list) => list.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const stats = [
    {
      label: 'Total Revenue',
      value: `₹${sum(invoices.filter((i) => i.status === 'Paid')).toLocaleString('en-IN')}`,
      icon: <DollarSign size={20} />,
      color: 'sky',
    },
    {
      label: 'Pending',
      value: `₹${sum(invoices.filter((i) => i.status === 'Pending')).toLocaleString('en-IN')}`,
      icon: <Clock size={20} />,
      color: 'amber',
    },
    {
      label: 'Overdue',
      value: `₹${sum(invoices.filter((i) => i.status === 'Overdue')).toLocaleString('en-IN')}`,
      icon: <AlertCircle size={20} />,
      color: 'rose',
    },
    {
      label: 'Paid Count',
      value: invoices.filter((i) => i.status === 'Paid').length,
      icon: <CheckCircle2 size={20} />,
      color: 'sky',
    },
  ];

  const filtered = invoices.filter(
    (i) =>
      (activeStatus === 'All' || i.status === activeStatus) &&
      ((i.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.invoice_number || '').toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusBadgeClass = (status) => `badge badge-${(status || '').toLowerCase()}`;
  const formatAmount = (n) => `₹${(parseFloat(n) || 0).toLocaleString('en-IN')}`;

  const handleExport = () => {
    const doc = new jsPDF();
    
    // Header Section
    doc.setFontSize(24);
    doc.setTextColor(14, 165, 233); // sky-500
    doc.text('TANKER Foundation', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text('DialyCare Management Portal - Billing & Financial Report', 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);
    
    // Financial Summary Block
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.5);
    doc.line(14, 42, 196, 42);

    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('Financial Executive Summary', 14, 52);
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    const totalPaid = sum(invoices.filter(i => i.status === 'Paid'));
    const totalPending = sum(invoices.filter(i => i.status === 'Pending'));
    const totalOverdue = sum(invoices.filter(i => i.status === 'Overdue'));
    
    doc.text(`Total Revenue (Collected): INR ${totalPaid.toLocaleString('en-IN')}`, 14, 62);
    doc.text(`Total Outstanding (Pending): INR ${totalPending.toLocaleString('en-IN')}`, 14, 68);
    doc.text(`Total Overdue Amount: INR ${totalOverdue.toLocaleString('en-IN')}`, 14, 74);
    doc.text(`Total Invoice Records in this Export: ${filtered.length}`, 14, 80);

    // Separator before Table
    doc.setDrawColor(241, 245, 249);
    doc.line(14, 86, 196, 86);

    const tableData = filtered.map(inv => {
      const p = patients.find(pat => pat.id === inv.patient);
      return [
        inv.invoice_number,
        inv.patient_name,
        p ? `${p.primary_diagnosis || 'N/A'} [${p.vascular_access || 'N/A'}]` : '—',
        inv.issued_date,
        inv.due_date,
        inv.method,
        `INR ${parseFloat(inv.amount).toLocaleString('en-IN')}`,
        inv.status.toUpperCase()
      ];
    });

    autoTable(doc, {
      startY: 92,
      head: [['Invoice #', 'Patient', 'Treatment Info', 'Issued', 'Due', 'Method', 'Amount', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      columnStyles: {
        2: { cellWidth: 40 }, // Treatment Info column width
      }
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

    doc.save(`billing_report_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="billing-container animate-fade-in">
      <header className="billing-header">
        <div className="header-actions">
          <button className="export-btn" onClick={handleExport}>
            <Download size={18} /> Export Report
          </button>
          <button
            className="add-item-btn shadow-lg shadow-sky-100 hover:scale-105 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenAdd();
            }}
          >
            <Plus size={18} /> New Invoice
          </button>
        </div>
      </header>

      <div className="billing-stats">
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

      <div className="billing-filters">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient or invoice #..."
          />
        </div>
        <div className="status-select-wrapper">
          <Filter size={16} className="filter-icon" />
          <select
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value)}
            className="status-dropdown"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Invoices' : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="billing-table-container card">
        <table className="billing-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Patient</th>
              <th>Issued</th>
              <th>Due Date</th>
              <th>Method</th>
              <th className="text-right">Amount</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading invoices...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state-container">
                    <Receipt size={48} className="empty-icon" />
                    <p>No invoices found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id}>
                  <td className="invoice-id">
                    <FileText size={14} />
                    {inv.invoice_number}
                  </td>
                  <td className="patient-info">
                    <div className="name">{inv.patient_name}</div>
                    <div className="pid">{inv.patient_uid || '—'}</div>
                  </td>
                  <td className="text-slate-600">{inv.issued_date}</td>
                  <td className="text-slate-600">{inv.due_date}</td>
                  <td className="text-slate-600 font-medium">{inv.method}</td>
                  <td className="amount-cell">{formatAmount(inv.amount)}</td>
                  <td>
                    <span className={getStatusBadgeClass(inv.status)}>
                      {inv.status === 'Paid' && <CheckCircle2 size={12} style={{ marginRight: '4px' }} />}
                      {inv.status === 'Pending' && <Clock size={12} style={{ marginRight: '4px' }} />}
                      {inv.status === 'Overdue' && <AlertCircle size={12} style={{ marginRight: '4px' }} />}
                      {inv.status === 'Draft' && <FileText size={12} style={{ marginRight: '4px' }} />}
                      {inv.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="action-buttons">
                      <button
                        className="action-btn view-btn"
                        onClick={() => navigate(`/patients/${inv.patient}`)}
                        title="View Patient Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleOpenEdit(inv)}
                        title="Edit Invoice"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(inv.id)}
                        title="Delete Invoice"
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
              <h2>{modalMode === 'add' ? 'Create New Invoice' : 'Edit Invoice Details'}</h2>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="billing-form">
              <div className="form-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Invoice #</label>
                  <input
                    type="text"
                    value={currentInvoice.invoice_number}
                    readOnly
                    className="read-only-input font-mono"
                  />
                </div>
                <div className="form-group relative">
                  <label>Patient</label>
                  <div className="searchable-select">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search patient..."
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        setShowPatientDropdown(true);
                        // Clear selection if they start typing something new
                        if (currentInvoice.patient) {
                          setCurrentInvoice({ ...currentInvoice, patient: '', patient_name: e.target.value });
                        } else {
                          setCurrentInvoice({ ...currentInvoice, patient_name: e.target.value });
                        }
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                    />
                    {showPatientDropdown && patientSearch && (
                      <div className="patient-autocomplete-dropdown card shadow-xl">
                        {patients
                          .filter((p) =>
                            p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                            p.patient_id.toLowerCase().includes(patientSearch.toLowerCase())
                          )
                          .slice(0, 5)
                          .map((p) => (
                            <div
                              key={p.id}
                              className="patient-option"
                              onClick={() => {
                                setCurrentInvoice({
                                  ...currentInvoice,
                                  patient: p.id,
                                  patient_name: p.full_name,
                                  patient_uid: p.patient_id,
                                });
                                setPatientSearch(p.full_name);
                                setShowPatientDropdown(false);
                              }}
                            >
                              <div className="name">{p.full_name}</div>
                              <div className="uid">{p.patient_id}</div>
                            </div>
                          ))}
                        {patients.filter((p) =>
                          p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                          p.patient_id.toLowerCase().includes(patientSearch.toLowerCase())
                        ).length === 0 && (
                          <div className="no-results">No patients found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Patient UID</label>
                  <input
                    type="text"
                    placeholder="Auto-filled from selection"
                    value={currentInvoice.patient_uid}
                    readOnly
                    className="read-only-input font-mono"
                  />
                </div>
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="4500"
                    value={currentInvoice.amount}
                    onChange={(e) =>
                      setCurrentInvoice({ ...currentInvoice, amount: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Issued Date</label>
                  <input
                    required
                    type="date"
                    value={currentInvoice.issued_date}
                    onChange={(e) =>
                      setCurrentInvoice({ ...currentInvoice, issued_date: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    required
                    type="date"
                    value={currentInvoice.due_date}
                    onChange={(e) =>
                      setCurrentInvoice({ ...currentInvoice, due_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={currentInvoice.method}
                    onChange={(e) =>
                      setCurrentInvoice({ ...currentInvoice, method: e.target.value })
                    }
                  >
                    {METHODS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={currentInvoice.status}
                    onChange={(e) =>
                      setCurrentInvoice({ ...currentInvoice, status: e.target.value })
                    }
                  >
                    <option>Pending</option>
                    <option>Paid</option>
                    <option>Draft</option>
                    <option>Overdue</option>
                  </select>
                </div>
              </div>
            </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={saving}>
                  {saving ? 'Saving...' : modalMode === 'add' ? 'Create Invoice' : 'Update Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
