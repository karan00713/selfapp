# Changelog

## [1.0.0] - January 16, 2026

### Added
- Initial release of GST Billing Software for DeepByte Verxe LLP
- Client management (Individual & Organization types)
- Invoice generation with sequential numbering (#0001, #0002, etc.)
- Automatic GST calculation:
  - CGST + SGST (9% + 9%) for intra-state (Tamil Nadu)
  - IGST (18%) for inter-state transactions
- HSN/SAC code lookup with 21,611 codes (including IT service codes)
- PDF invoice generation with company logo
- Payment status tracking (Paid/Unpaid/Partial)
- GST Reports with date range filtering and CSV export
- Electron desktop app architecture for Windows 10/11
- SQLite local database for portable data storage

### Technical
- Frontend: React 19 + Tailwind CSS + Shadcn/UI
- Backend (web): FastAPI + MongoDB
- Desktop: Electron + SQLite
- PDF: jsPDF with autoTable plugin

### Company Information
- DeepByte Verxe LLP
- GSTIN: 33AYFD2259G1Z7
- CIN: ACO-5615
- State: Tamil Nadu
