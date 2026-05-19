# Billing & Financials — Feature Report

**Module:** Billing
**Location:** `/billing` route in the DialyCare Admin Portal
**Backend:** `Invoice` model + `InvoiceViewSet` (Django REST Framework)
**Frontend:** `frontend/src/components/Billing/`

---

## 1. Overview

The Billing module is the financial backbone of the DialyCare portal. It allows clinic administrators to create, track, and manage patient invoices end-to-end — from issuance to collection — and to export auditable financial reports for the TANKER Foundation. Every invoice is linked to a registered patient so that financials roll up alongside the patient's clinical record.

---

## 2. Key Capabilities

### 2.1 Invoice Lifecycle Management
| Action | Description |
|--------|-------------|
| **Create** | Generate a new invoice via a guided modal form. |
| **Edit** | Update any field (amount, method, status, dates, notes). |
| **Delete** | Permanently remove an invoice (confirmation required). |
| **View Patient** | Jump directly from an invoice to the linked patient's profile. |

### 2.2 Auto-generated Invoice Numbers
Every new invoice receives a unique sequential identifier in the format **`INV-YYYY-####`** (e.g. `INV-2026-0042`). The system scans existing records, takes the highest number for the current year, and increments — preventing duplicates and keeping invoices searchable.

### 2.3 Patient Linking with Smart Search
- Searchable autocomplete pulls live data from the patient registry.
- Match by **full name** or **patient UID**.
- Selecting a patient auto-fills the Patient UID field — eliminating typos and orphaned records.

### 2.4 Status Tracking
Invoices flow through four canonical states, each with its own colored badge:

| Status | When Used | Visual |
|--------|-----------|--------|
| **Draft** | Invoice composed but not finalized | Slate badge with file icon |
| **Pending** | Issued, awaiting payment | Amber badge with clock icon |
| **Paid** | Settled | Green badge with check icon |
| **Overdue** | Past due date, unpaid | Rose badge with alert icon |

### 2.5 Multi-method Payment Support
- **Self-Pay** — Patient pays directly.
- **CMCHIS** — Chief Minister's Comprehensive Health Insurance Scheme (Tamil Nadu government scheme).
- **Insurance** — Private health insurance.

This mirrors the actual payment channels used at dialysis centers in the region.

### 2.6 Financial Dashboard (Live KPI Cards)
Four real-time stat cards at the top of the page give administrators an instant pulse of the clinic's finances:

| Card | Metric | Color |
|------|--------|-------|
| **Total Revenue** | Sum of all Paid invoices | Sky |
| **Pending** | Sum of all Pending invoice amounts | Amber |
| **Overdue** | Sum of all Overdue amounts | Rose |
| **Paid Count** | Number of paid invoices | Sky |

All values are formatted in Indian numbering (`₹1,23,456`).

### 2.7 Search & Filter
- **Free-text search** — Patient name or invoice number.
- **Status dropdown** — All / Paid / Pending / Overdue / Draft.
- Filters compose so users can drill down to (e.g.) all *Overdue* invoices for a specific patient.

### 2.8 PDF Export — Professional Financial Report
Single-click PDF generation creates an audit-ready report containing:
1. **Branded header** — *TANKER Foundation* in sky-blue, with subtitle *DialyCare Management Portal — Billing & Financial Report*, plus generation timestamp.
2. **Financial Executive Summary** — Total Revenue, Outstanding, Overdue, and total record count.
3. **Detailed invoice table** with: Invoice #, Patient, Treatment Info (diagnosis + vascular access), Issued Date, Due Date, Method, Amount, Status.
4. **Striped rows**, sky-blue header, alternating background for readability.
5. **Page footer** with a unique syntax/reference number (`TC-INV-REP-####`) and page numbering — useful for archival and traceability.

Library used: **jsPDF + jspdf-autotable** (already a project dependency).

---

## 3. Data Model

```python
class Invoice(models.Model):
    invoice_number   = CharField(max_length=30, unique=True)   # INV-YYYY-####
    patient          = ForeignKey(Patient, on_delete=SET_NULL)  # Linked patient
    patient_name     = CharField(max_length=100)                # Snapshot for history
    patient_uid      = CharField(max_length=20, null=True)      # Clinic-issued UID
    issued_date      = DateField()
    due_date         = DateField()
    amount           = DecimalField(max_digits=10, decimal_places=2)
    method           = CharField(choices=['Self-Pay', 'CMCHIS', 'Insurance'])
    status           = CharField(choices=['Draft', 'Pending', 'Paid', 'Overdue'])
    notes            = TextField(null=True, blank=True)
    created_at       = DateTimeField(auto_now_add=True)
    updated_at       = DateTimeField(auto_now=True)
```

**Design notes:**
- `patient_name` is stored alongside the FK so that, if a patient record is ever deleted, the historical invoice still reads cleanly.
- `unique=True` on `invoice_number` enforces the no-duplicates guarantee at the database level.
- Ordering defaults to **most recently issued first** (`-issued_date`).

---

## 4. API Endpoints

All endpoints are protected behind token authentication.

| Method | Path | Purpose |
|--------|------|---------|
| `GET`    | `/api/invoices/`         | List all invoices (newest first) |
| `POST`   | `/api/invoices/`         | Create a new invoice |
| `GET`    | `/api/invoices/{id}/`    | Retrieve a single invoice |
| `PATCH`  | `/api/invoices/{id}/`    | Update fields on an existing invoice |
| `DELETE` | `/api/invoices/{id}/`    | Permanently delete an invoice |

Every CRUD call is automatically picked up by the **Activity History** module (signals layer), so changes are auditable from the History page — *who* changed *what*, *when*, and *from where (IP)*.

---

## 5. User Experience Highlights

- **Theme consistency** — Sky/slate palette matches the rest of the portal (Patients, Staff, Attendance, etc.).
- **Card-based layout** with subtle shadows and hover lifts.
- **Inline icons** on every status badge for at-a-glance scanning.
- **Empty state** with a large Receipt icon and friendly copy when no invoices match the filter.
- **Modal forms** with rounded inputs, animated entry, and disabled-while-saving state.
- **Confirmation dialogs** on destructive actions (Delete).
- **Read-only fields** for system-generated values (Invoice #, Patient UID) so users can't accidentally corrupt them.

---

## 6. Audit & Compliance

Because of the [[ActivityLog]] auto-capture (see **History** module), every invoice action is logged with:
- The actor's name and user ID.
- IP address of the request.
- A field-level diff (e.g. `status: Pending → Paid`, `amount: 4500 → 5200`).
- An exact ISO timestamp.

This satisfies basic financial audit requirements for the foundation's records and makes disputes resolvable from the audit trail.

---

## 7. Integration Points

- **Patients module** — Bi-directional. Selecting a patient when creating an invoice populates UID; clicking the eye icon on an invoice navigates to that patient's profile.
- **Activity History** — All Invoice mutations stream into the timeline.
- **Treatment Sessions** — The PDF export pulls each linked patient's `primary_diagnosis` and `vascular_access` into the report's "Treatment Info" column, giving exported records clinical context.

---

## 8. Roadmap / Suggested Enhancements

These are *not* implemented but would be natural next steps:

| Enhancement | Why it matters |
|-------------|----------------|
| **Email invoices to patients** | Reduce manual chasing for outstanding payments. |
| **Bulk payment marking** | Mark multiple invoices Paid in one action after a settlement batch. |
| **Date-range filter on the table** | Currently the listing always shows all-time; adding a date filter would parallel the History page. |
| **Automatic Overdue transition** | A scheduled task that flips Pending → Overdue when `due_date < today` so admins don't have to manually update statuses. |
| **Per-session itemized billing** | Roll consumables + machine time + nurse hours into a structured line-item invoice, not just a single amount. |
| **Razorpay / UPI payment links** | Embed a "Pay now" link in the patient-facing invoice email. |
| **GST tax fields** | If billing scopes expand beyond charitable scheme work. |

---

## 9. Current Limitations

- **No partial payments** — An invoice is either Paid or it isn't; there's no concept of "₹2,000 of ₹5,000 received".
- **No refunds workflow** — Reversing a Paid invoice requires manual editing.
- **No currency switching** — Hardcoded to ₹ (INR), which is correct for this deployment but inflexible.
- **`Overdue` is manual** — The system doesn't yet auto-transition stale Pending invoices.

---

## 10. Files Reference

| File | Role |
|------|------|
| [backend/api/models.py](backend/api/models.py) | `Invoice` model definition |
| [backend/api/serializers.py](backend/api/serializers.py) | `InvoiceSerializer` |
| [backend/api/views.py](backend/api/views.py) | `InvoiceViewSet` |
| [backend/api/urls.py](backend/api/urls.py) | `/api/invoices/` route registration |
| [frontend/src/components/Billing/Billing.jsx](frontend/src/components/Billing/Billing.jsx) | Main React page |
| [frontend/src/components/Billing/Billing.css](frontend/src/components/Billing/Billing.css) | Page styling |
| [frontend/src/services/api.js](frontend/src/services/api.js) | `invoiceService` API client |

---

*Report generated for the DialyCare Management Portal — TANKER Foundation.*
