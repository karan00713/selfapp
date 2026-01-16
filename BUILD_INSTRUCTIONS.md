# Building DeepByte GST Billing Desktop App

## Overview
This guide explains how to build the portable Windows .exe file for the GST Billing Software.

## Prerequisites
- Node.js 18+ installed on your Windows machine
- Git (optional, for cloning)

## Quick Build Steps

### 1. Copy the Project
Copy the entire `/app/frontend` folder to your Windows machine.

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Build the React App
```bash
npm run build
```

### 4. Build the Windows Executable
```bash
npm run electron:build
```

### 5. Find Your Executable
The portable .exe will be at:
```
frontend/dist/DeepByte-GST-Billing-1.0.0.exe
```

## What the App Contains
- **SQLite Database**: Stored locally at `%APPDATA%/deepbyte-gst-billing/gst_billing.db`
- **HSN/SAC Codes**: 21,611 codes for goods and services
- **Company Logo**: Embedded in PDF invoices

## First Launch
1. Double-click `DeepByte-GST-Billing-1.0.0.exe`
2. The app will create a local database on first run
3. No installation required - it's fully portable!

## Data Location
All your data (clients, invoices) is stored locally at:
```
C:\Users\<YourName>\AppData\Roaming\deepbyte-gst-billing\gst_billing.db
```

## Backup Your Data
Simply copy the `gst_billing.db` file to backup your data.

## Troubleshooting

### App doesn't start
- Make sure you're running Windows 10 or 11
- Try running as Administrator

### Database errors
- Delete `gst_billing.db` to reset (you'll lose all data)
- The app will recreate the database on next launch

### PDF not generating
- Make sure you have selected a client
- Check that line items are filled in

## Support
For issues, contact: team@deepbyteverxe.com
