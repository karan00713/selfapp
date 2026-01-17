# DeepByte Verxe GST Billing Software

## Product Requirements Document (PRD)

### Original Problem Statement
Build a GST billing software for DeepByte Verxe LLP, an IT software service company in India. The application should be a Windows desktop application (portable .exe) with local storage, supporting Windows 10 and 11.

### Company Details
- **Company Name**: DeepByte Verxe LLP
- **CIN**: ACO-5615
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
- [x] **PDF download functionality** (fixed - using jsPDF with autoTable)
- [x] **Company name only** on invoice (no logo as requested)
- [x] Payment status tracking (Paid/Unpaid/Partial)
- [x] Invoice history with search

### 3. Products & Services ✅ (NEW)
- [x] Pre-store products/services with ID, name, HSN/SAC code, and price
- [x] Select from products list when creating invoices
- [x] Option to type manually or choose from saved products
- [x] Full CRUD operations (Create, Read, Update, Delete)

### 4. Reports ✅
- [x] GST summary reports by date range
- [x] Quick date range selections (This Month, Last Quarter, Financial Year)
- [x] CSV export for reports

### 5. Automatic Backup ✅ (NEW)
- [x] Daily automatic backup at 11:59 PM
- [x] Backup filename format: `DD_MM_YYYY_HHMMSS.json`
- [x] Stored in local storage (AppData/backups folder)
- [x] Auto-cleanup of backups older than 30 days
- [x] Manual backup/restore capability

### 6. User Interface ✅
- [x] Clean professional business theme
- [x] Sidebar navigation with all menus
- [x] No authentication (single-user local app)

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

## What's Been Implemented (January 2026)

### Bug Fixes
1. **PDF Download** - Fixed by using explicit `autoTable` import from jspdf-autotable
2. **Logo Removed** - Invoice now shows company name only (DeepByte Verxe LLP)
3. **Financial Year Reset** - Invoice counter uses key `invoice_{FY}` (e.g., `invoice_2025-2026`)

### New Features
1. **Products & Services Page** - Full CRUD for pre-storing services
2. **Product Selection in Invoice** - "Choose Product" button auto-fills line item
3. **Automatic Daily Backup** - Creates JSON backup at end of each day

### Test Results
- **Backend Tests**: 14/14 PASSED (100%)
- **Frontend Tests**: All features verified working

---

## Files Reference

### Backend
- `/app/backend/server.py` - FastAPI application with all endpoints

### Frontend Pages
- `/app/frontend/src/pages/DashboardPage.js` - Overview dashboard
- `/app/frontend/src/pages/ClientsPage.js` - Client management
- `/app/frontend/src/pages/ProductsPage.js` - Products/Services management (NEW)
- `/app/frontend/src/pages/InvoicesPage.js` - Invoice listing
- `/app/frontend/src/pages/CreateInvoicePage.js` - Invoice creation with product selection
- `/app/frontend/src/pages/InvoiceDetailPage.js` - Invoice view with PDF download (FIXED)
- `/app/frontend/src/pages/HSNCodesPage.js` - HSN/SAC code reference
- `/app/frontend/src/pages/ReportsPage.js` - GST reports

### Electron
- `/app/frontend/electron/main.js` - Main process with SQLite, backup, FY numbering
- `/app/frontend/electron/preload.js` - IPC bridge with all handlers

---

## API Endpoints

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `GET /api/clients/{id}` - Get client
- `PUT /api/clients/{id}` - Update client
- `DELETE /api/clients/{id}` - Delete client

### Products/Services (NEW)
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `GET /api/products/{id}` - Get product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Invoices
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/{id}` - Get invoice
- `PUT /api/invoices/{id}` - Update payment status

### Other
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/reports/gst` - GST report
- `POST /api/backup/create` - Create backup
- `POST /api/backup/restore` - Restore backup
- `GET /api/health` - Health check with financial year

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

### Data Storage
- Database: `%APPDATA%/deepbyte-gst-billing/gst_billing.db`
- Backups: `%APPDATA%/deepbyte-gst-billing/backups/`

---

## Remaining Tasks

### P2 - Nice to Have
- [ ] Backup/restore UI page in frontend
- [ ] Invoice deletion with confirmation
- [ ] Due date reminders
- [ ] Export invoices to Excel

---

*Last Updated: January 17, 2026*
