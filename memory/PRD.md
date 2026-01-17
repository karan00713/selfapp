# DeepByte Verxe GST Billing Software

## Product Requirements Document (PRD)

### Original Problem Statement
Build a GST billing software for DeepByte Verxe LLP, an IT software service company in India. The application should be a Windows desktop application (portable .exe) with local storage, supporting Windows 10 and 11.

### Company Details
- **Company Name**: DeepByte Verxe LLP
- **LLPIN**: ACO-5615
- **Address**: 35B, First floor, Chairman Nallamuthupillai Road, New Mahalipatti, Madurai - 625001
- **GSTIN**: 33AYFD2259G1Z7
- **Email**: team@deepbyteverxe.com
- **Phone**: +91-9087942470
- **State**: Tamil Nadu

---

## Core Requirements

### 1. Client Management ✅
- [x] Two types of clients: Individual and Organization
- [x] Individual fields: Name, Address, Aadhar, PAN, Phone, Email
- [x] Organization fields: Name, Address, CIN, PAN, GST number, Phone, Email
- [x] State selection for GST calculation
- [x] Client search and filter

### 2. Invoice Generation ✅
- [x] Sequential invoice numbering starting from 0001
- [x] **Invoice number resets on April 1st** (new financial year)
- [x] HSN/SAC code column with lookup feature (21,611 codes)
- [x] Automatic GST calculation:
  - CGST + SGST (9% each) for intra-state (Tamil Nadu)
  - IGST (18%) for inter-state transactions
- [x] **PDF download functionality** - Professional formatting
- [x] **Company name only** on invoice (no logo)
- [x] **Bank details** included on all invoices
- [x] **Signature section**: "For DeepByte Verxe LLP" with "Authorized Signatory"
- [x] **No payment status** displayed on invoices
- [x] Invoice history with search

### 3. Products & Services ✅
- [x] Pre-store products/services with ID, name, HSN/SAC code, and price
- [x] Select from products list when creating invoices
- [x] Option to type manually or choose from saved products
- [x] Full CRUD operations (Create, Read, Update, Delete)

### 4. Bank Details ✅ (NEW)
- [x] Dedicated menu to configure bank details
- [x] Fields: Account Name, Bank Name, Account Number, Branch, IFSC Code
- [x] Bank details automatically displayed on all invoices

### 5. Reports ✅
- [x] GST summary reports by date range
- [x] Quick date range selections (This Month, Last Quarter, Financial Year)
- [x] CSV export for reports

### 6. Automatic Backup ✅
- [x] Daily automatic backup at 11:59 PM
- [x] Backup filename format: `DD_MM_YYYY_HHMMSS.json`
- [x] Stored in local storage (AppData/backups folder)
- [x] Auto-cleanup of backups older than 30 days
- [x] Backup on app startup if not done today

### 7. User Interface ✅
- [x] Clean professional business theme
- [x] Sidebar navigation with all menus
- [x] No authentication (single-user local app)

---

## Menu Structure

1. **Dashboard** - Overview statistics
2. **Clients** - Client management
3. **Invoices** - Invoice listing and creation
4. **Products & Services** - Pre-defined services/products
5. **HSN/SAC Codes** - Code reference lookup
6. **Bank Details** - Bank account configuration
7. **Reports** - GST reports

---

## Technical Architecture

### Web Preview (Current - for testing)
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **PDF Generation**: jsPDF with autoTable plugin

### Desktop Application (Target)
- **Runtime**: Electron
- **Frontend**: React (same codebase)
- **Database**: SQLite (local storage)
- **Packaging**: electron-builder (portable .exe)

---

## API Endpoints

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `GET /api/clients/{id}` - Get client
- `PUT /api/clients/{id}` - Update client
- `DELETE /api/clients/{id}` - Delete client

### Products/Services
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `GET /api/products/{id}` - Get product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Invoices
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/{id}` - Get invoice
- `PUT /api/invoices/{id}` - Update invoice

### Bank Details
- `GET /api/bank-details` - Get bank details
- `POST /api/bank-details` - Save/update bank details

### Other
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/reports/gst` - GST report
- `POST /api/backup/create` - Create backup
- `POST /api/backup/restore` - Restore backup
- `GET /api/health` - Health check

---

## Files Reference

### Backend
- `/app/backend/server.py` - FastAPI application

### Frontend Pages
- `/app/frontend/src/pages/DashboardPage.js`
- `/app/frontend/src/pages/ClientsPage.js`
- `/app/frontend/src/pages/ProductsPage.js`
- `/app/frontend/src/pages/InvoicesPage.js`
- `/app/frontend/src/pages/CreateInvoicePage.js`
- `/app/frontend/src/pages/InvoiceDetailPage.js`
- `/app/frontend/src/pages/HSNCodesPage.js`
- `/app/frontend/src/pages/BankDetailsPage.js`
- `/app/frontend/src/pages/ReportsPage.js`

### Electron
- `/app/frontend/electron/main.js` - Main process with SQLite and backup
- `/app/frontend/electron/preload.js` - IPC bridge

---

## Build Instructions

### Desktop Build (Windows)
```bash
cd /app/frontend
npm install
npm run build
npm run electron:build
# Output: dist/DeepByte-GST-Billing-1.0.0.exe
```

### Data Storage (Desktop)
- Database: `%APPDATA%/deepbyte-gst-billing/gst_billing.db`
- Backups: `%APPDATA%/deepbyte-gst-billing/backups/`

---

*Last Updated: January 17, 2026*
