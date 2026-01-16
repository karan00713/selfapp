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

### 1. Client Management
- [x] Two types of clients: Individual and Organization
- [x] Individual fields: Name, Address, Aadhar, PAN, Phone, Email
- [x] Organization fields: Name, Address, CIN, PAN, GST number, Phone, Email
- [x] State selection for GST calculation
- [x] Client search and filter

### 2. Invoice Generation
- [x] Sequential invoice numbering starting from 0001
- [x] HSN/SAC code column with lookup feature
- [x] Automatic GST calculation:
  - CGST + SGST (9% each) for intra-state (Tamil Nadu)
  - IGST (18%) for inter-state transactions
- [x] PDF download functionality with company logo
- [x] Payment status tracking (Paid/Unpaid/Partial)
- [x] Invoice history with search

### 3. Reports
- [x] GST summary reports by date range
- [x] Quick date range selections (This Month, Last Quarter, Financial Year)
- [x] CSV export for reports

### 4. User Interface
- [x] Clean professional business theme
- [x] Sidebar navigation
- [x] Company logo integration
- [x] No authentication (single-user local app)

---

## Technical Architecture

### Web Preview (Current)
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **PDF Generation**: jsPDF (client-side)

### Desktop Application (Target)
- **Runtime**: Electron
- **Frontend**: React (same codebase)
- **Database**: SQLite (local storage)
- **Packaging**: electron-builder (portable .exe)

---

## What's Been Implemented (January 2026)

### Backend API (`/app/backend/server.py`)
- Client CRUD operations
- Invoice CRUD with sequential numbering
- GST calculation logic
- Dashboard statistics
- GST reports generation

### Frontend Pages
- `DashboardPage.js` - Overview with stats cards
- `ClientsPage.js` - Client management with modal forms
- `InvoicesPage.js` - Invoice listing with search/filter
- `CreateInvoicePage.js` - Invoice creation with HSN lookup
- `InvoiceDetailPage.js` - Invoice view with PDF download
- `HSNCodesPage.js` - HSN/SAC code reference
- `ReportsPage.js` - GST reports generation

### Electron Setup (`/app/frontend/electron/`)
- `main.js` - Electron main process with SQLite
- `preload.js` - IPC bridge for renderer process
- Build configuration for portable Windows .exe

---

## Features Verified (Test Results)

| Feature | Status |
|---------|--------|
| Dashboard loads correctly | ✅ PASSED |
| Create Organization client | ✅ PASSED |
| Create Individual client | ✅ PASSED |
| Invoice numbering #0001 | ✅ PASSED |
| Sequential invoice numbers | ✅ PASSED |
| CGST+SGST calculation | ✅ PASSED |
| IGST calculation | ✅ PASSED |
| PDF download | ✅ PASSED |
| Payment status update | ✅ PASSED |
| HSN/SAC code search | ✅ PASSED |
| GST reports | ✅ PASSED |

---

## Files Reference

### Backend
- `/app/backend/server.py` - FastAPI application
- `/app/backend/requirements.txt` - Python dependencies

### Frontend
- `/app/frontend/src/App.js` - Main router
- `/app/frontend/src/lib/electronAPI.js` - Unified API layer
- `/app/frontend/src/lib/constants.js` - Company info
- `/app/frontend/src/components/Sidebar.js` - Navigation
- `/app/frontend/src/pages/*` - All page components
- `/app/frontend/public/hsn_sac_codes.json` - 21,611 HSN/SAC codes
- `/app/frontend/public/company_logo.jpg` - Company logo

### Electron
- `/app/frontend/electron/main.js` - Main process
- `/app/frontend/electron/preload.js` - Preload script
- `/app/frontend/package.json` - Build configuration

---

## Remaining Tasks

### P0 - Critical
- [ ] Test Electron desktop build on Windows
- [ ] Verify SQLite integration in Electron
- [ ] Package as portable .exe

### P1 - Important
- [ ] Add invoice deletion with confirmation
- [ ] Due date reminders/highlighting
- [ ] Export invoices to Excel

### P2 - Nice to Have
- [ ] Invoice templates customization
- [ ] Backup/restore database
- [ ] Multi-currency support

---

## Build Instructions

### Web Preview (Development)
```bash
# Backend
cd /app/backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001

# Frontend  
cd /app/frontend
yarn install
yarn start
```

### Desktop Build (Windows)
```bash
cd /app/frontend
yarn install
yarn build
yarn electron:build
# Output: /app/frontend/dist/DeepByte-GST-Billing-1.0.0.exe
```

---

## Known Issues
1. Company logo placeholder may not load in some browsers (base64 conversion needed for PDF)
2. HSN codes file is large (2MB) - consider lazy loading for performance

---

*Last Updated: January 16, 2026*
