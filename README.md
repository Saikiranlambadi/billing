# Restaurant Billing Software

A simple offline-first restaurant billing application for a small restaurant with no tax/GST calculation.

## Stack
- React + Vite frontend
- Node.js + Express backend
- SQLite database
- Browser print dialog for receipts (works with thermal printers through the OS/browser)
- Cash / UPI payments
- Food categories and items
- Bill history and daily sales

## Run

### Both Backend & Frontend (Recommended)
From the root directory:
```bash
npm install
npm run dev
```
This launches both the Express API server (port 5000) and the Vite React frontend (http://localhost:5173) simultaneously.

### Individual Services

#### Backend Only
```bash
npm run dev:backend
```

#### Frontend Only
```bash
npm run dev:frontend
```

#### Production Build
```bash
npm run build
```

## Default login
Username: `admin`
Password: `admin123`

## Printer
For a first client prototype, use an ESC/POS-compatible 58mm or 80mm thermal printer installed in Windows.
The app opens a compact receipt print view. Select the thermal printer in the Windows/browser print dialog.

For silent/direct USB printing without a print dialog, use a desktop wrapper such as Electron plus a printer-specific ESC/POS integration. Test the exact printer model before promising direct printing.

## Notes
This version intentionally does not calculate GST/tax.
