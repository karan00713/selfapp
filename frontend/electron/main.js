const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

let mainWindow;
let db;

// Get user data path for storing database
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'gst_billing.db');
const logoPath = path.join(__dirname, '../public/company_logo.jpg');

function initDatabase() {
  db = new Database(dbPath);
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      client_type TEXT NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      state TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      aadhar_number TEXT,
      pan_number TEXT,
      cin TEXT,
      gst_number TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      client_id TEXT NOT NULL,
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      line_items TEXT NOT NULL,
      notes TEXT,
      subtotal REAL NOT NULL,
      cgst REAL DEFAULT 0,
      sgst REAL DEFAULT 0,
      igst REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_status TEXT DEFAULT 'unpaid',
      paid_amount REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Initialize invoice counter if not exists - START FROM 0 so first invoice is 0001
  const counter = db.prepare('SELECT value FROM settings WHERE key = ?').get('invoice_counter');
  if (!counter) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('invoice_counter', '0');
  }

  console.log('Database initialized at:', dbPath);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    title: 'DeepByte Verxe - GST Billing Software'
  });

  // Load the React app
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) db.close();
    app.quit();
  }
});

// ============= IPC Handlers =============

// ----- Clients -----
ipcMain.handle('clients:getAll', () => {
  const clients = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
  return clients;
});

ipcMain.handle('clients:getById', (event, id) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  return client;
});

ipcMain.handle('clients:create', (event, clientData) => {
  const id = Date.now().toString();
  const created_at = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO clients (id, client_type, name, address, state, phone, email, aadhar_number, pan_number, cin, gst_number, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    clientData.client_type,
    clientData.name,
    clientData.address,
    clientData.state,
    clientData.phone,
    clientData.email,
    clientData.aadhar_number || null,
    clientData.pan_number || null,
    clientData.cin || null,
    clientData.gst_number || null,
    created_at
  );
  
  return { id, ...clientData, created_at };
});

ipcMain.handle('clients:update', (event, id, clientData) => {
  const stmt = db.prepare(`
    UPDATE clients SET 
      client_type = ?, name = ?, address = ?, state = ?, phone = ?, email = ?,
      aadhar_number = ?, pan_number = ?, cin = ?, gst_number = ?
    WHERE id = ?
  `);
  
  stmt.run(
    clientData.client_type,
    clientData.name,
    clientData.address,
    clientData.state,
    clientData.phone,
    clientData.email,
    clientData.aadhar_number || null,
    clientData.pan_number || null,
    clientData.cin || null,
    clientData.gst_number || null,
    id
  );
  
  return db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
});

ipcMain.handle('clients:delete', (event, id) => {
  db.prepare('DELETE FROM clients WHERE id = ?').run(id);
  return { success: true };
});

// ----- Invoices -----
ipcMain.handle('invoices:getAll', () => {
  const invoices = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all();
  return invoices.map(inv => ({
    ...inv,
    line_items: JSON.parse(inv.line_items)
  }));
});

ipcMain.handle('invoices:getById', (event, id) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  if (invoice) {
    invoice.line_items = JSON.parse(invoice.line_items);
  }
  return invoice;
});

ipcMain.handle('invoices:create', (event, invoiceData) => {
  const id = Date.now().toString();
  const created_at = new Date().toISOString();
  
  // Get and increment invoice counter - this ensures first invoice is 0001
  const counterRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('invoice_counter');
  let currentCounter = parseInt(counterRow.value, 10);
  currentCounter += 1; // Increment FIRST, then use
  
  const invoice_number = currentCounter.toString().padStart(4, '0');
  
  // Update counter
  db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(currentCounter.toString(), 'invoice_counter');
  
  // Get client for GST calculation
  const client = db.prepare('SELECT state FROM clients WHERE id = ?').get(invoiceData.client_id);
  
  // Calculate subtotal
  const subtotal = invoiceData.line_items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  
  // Calculate GST (18%)
  const companyState = 'Tamil Nadu';
  const gstRate = 0.18;
  let cgst = 0, sgst = 0, igst = 0;
  
  if (client && client.state.toLowerCase().trim() === companyState.toLowerCase().trim()) {
    // Intra-state: CGST + SGST
    cgst = Math.round(subtotal * (gstRate / 2) * 100) / 100;
    sgst = Math.round(subtotal * (gstRate / 2) * 100) / 100;
  } else {
    // Inter-state: IGST
    igst = Math.round(subtotal * gstRate * 100) / 100;
  }
  
  const total = subtotal + cgst + sgst + igst;
  
  const stmt = db.prepare(`
    INSERT INTO invoices (id, invoice_number, client_id, invoice_date, due_date, line_items, notes, subtotal, cgst, sgst, igst, total, payment_status, paid_amount, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    invoice_number,
    invoiceData.client_id,
    invoiceData.invoice_date,
    invoiceData.due_date,
    JSON.stringify(invoiceData.line_items),
    invoiceData.notes || null,
    subtotal,
    cgst,
    sgst,
    igst,
    total,
    'unpaid',
    0,
    created_at
  );
  
  return {
    id,
    invoice_number,
    ...invoiceData,
    subtotal,
    cgst,
    sgst,
    igst,
    total,
    payment_status: 'unpaid',
    paid_amount: 0,
    created_at
  };
});

ipcMain.handle('invoices:update', (event, id, updateData) => {
  const updates = [];
  const values = [];
  
  if (updateData.payment_status !== undefined) {
    updates.push('payment_status = ?');
    values.push(updateData.payment_status);
  }
  if (updateData.paid_amount !== undefined) {
    updates.push('paid_amount = ?');
    values.push(updateData.paid_amount);
  }
  if (updateData.notes !== undefined) {
    updates.push('notes = ?');
    values.push(updateData.notes);
  }
  
  if (updates.length > 0) {
    values.push(id);
    db.prepare(`UPDATE invoices SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }
  
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  if (invoice) {
    invoice.line_items = JSON.parse(invoice.line_items);
  }
  return invoice;
});

// ----- Dashboard Stats -----
ipcMain.handle('dashboard:getStats', () => {
  const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
  const invoices = db.prepare('SELECT * FROM invoices').all();
  
  const totalInvoices = invoices.length;
  const pendingAmount = invoices
    .filter(inv => inv.payment_status !== 'paid')
    .reduce((sum, inv) => sum + (inv.total - inv.paid_amount), 0);
  const paidAmount = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
  const unpaidInvoices = invoices.filter(inv => inv.payment_status === 'unpaid').length;
  const partialInvoices = invoices.filter(inv => inv.payment_status === 'partial').length;
  const paidInvoices = invoices.filter(inv => inv.payment_status === 'paid').length;
  
  return {
    total_clients: totalClients,
    total_invoices: totalInvoices,
    pending_amount: pendingAmount,
    paid_amount: paidAmount,
    unpaid_invoices: unpaidInvoices,
    partial_invoices: partialInvoices,
    paid_invoices: paidInvoices
  };
});

// ----- GST Reports -----
ipcMain.handle('reports:getGST', (event, startDate, endDate) => {
  const invoices = db.prepare(`
    SELECT * FROM invoices 
    WHERE invoice_date >= ? AND invoice_date <= ?
  `).all(startDate, endDate);
  
  const totalInvoices = invoices.length;
  const totalTaxableAmount = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const totalCgst = invoices.reduce((sum, inv) => sum + inv.cgst, 0);
  const totalSgst = invoices.reduce((sum, inv) => sum + inv.sgst, 0);
  const totalIgst = invoices.reduce((sum, inv) => sum + inv.igst, 0);
  const totalTax = totalCgst + totalSgst + totalIgst;
  const totalInvoiceValue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  
  return {
    period: `${startDate} to ${endDate}`,
    total_invoices: totalInvoices,
    total_taxable_amount: totalTaxableAmount,
    total_cgst: totalCgst,
    total_sgst: totalSgst,
    total_igst: totalIgst,
    total_tax: totalTax,
    total_invoice_value: totalInvoiceValue
  };
});

// ----- Company Logo -----
ipcMain.handle('app:getLogoBase64', () => {
  try {
    // Try to read from multiple possible locations
    const possiblePaths = [
      path.join(__dirname, '../public/company_logo.jpg'),
      path.join(__dirname, '../build/company_logo.jpg'),
      path.join(process.resourcesPath, 'company_logo.jpg')
    ];
    
    for (const logoPath of possiblePaths) {
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        return `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
      }
    }
    return null;
  } catch (error) {
    console.error('Error reading logo:', error);
    return null;
  }
});

// ----- HSN/SAC Codes -----
ipcMain.handle('hsn:getAll', () => {
  try {
    const possiblePaths = [
      path.join(__dirname, '../public/hsn_sac_codes.json'),
      path.join(__dirname, '../build/hsn_sac_codes.json'),
      path.join(process.resourcesPath, 'hsn_sac_codes.json')
    ];
    
    for (const hsnPath of possiblePaths) {
      if (fs.existsSync(hsnPath)) {
        const data = fs.readFileSync(hsnPath, 'utf8');
        return JSON.parse(data);
      }
    }
    return [];
  } catch (error) {
    console.error('Error reading HSN codes:', error);
    return [];
  }
});
