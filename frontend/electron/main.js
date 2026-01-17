const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

let mainWindow;
let db;
let backupInterval;

// Get user data path for storing database
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'gst_billing.db');
const backupDir = path.join(userDataPath, 'backups');

// Get current Indian financial year (April to March)
function getCurrentFinancialYear() {
  const now = new Date();
  if (now.getMonth() >= 3) { // April onwards
    return `${now.getFullYear()}-${now.getFullYear() + 1}`;
  } else { // January to March
    return `${now.getFullYear() - 1}-${now.getFullYear()}`;
  }
}

// Create backup directory if it doesn't exist
function ensureBackupDir() {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
}

// Create automatic backup
function createBackup() {
  ensureBackupDir();
  
  const now = new Date();
  const timestamp = `${now.getDate().toString().padStart(2, '0')}_${(now.getMonth() + 1).toString().padStart(2, '0')}_${now.getFullYear()}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
  const backupFileName = `${timestamp}.json`;
  const backupPath = path.join(backupDir, backupFileName);
  
  try {
    // Get all data
    const clients = db.prepare('SELECT * FROM clients').all();
    const invoices = db.prepare('SELECT * FROM invoices').all();
    const products = db.prepare('SELECT * FROM products').all();
    const settings = db.prepare('SELECT * FROM settings').all();
    
    const backupData = {
      timestamp: now.toISOString(),
      filename: backupFileName,
      data: {
        clients,
        invoices,
        products,
        settings
      }
    };
    
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log('Backup created:', backupPath);
    
    // Clean up old backups (keep last 30 days)
    cleanupOldBackups();
    
    return { success: true, path: backupPath, filename: backupFileName };
  } catch (error) {
    console.error('Backup failed:', error);
    return { success: false, error: error.message };
  }
}

// Clean up backups older than 30 days
function cleanupOldBackups() {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  try {
    const files = fs.readdirSync(backupDir);
    files.forEach(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        console.log('Deleted old backup:', file);
      }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Schedule daily backup at end of day (11:59 PM)
function scheduleDailyBackup() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(23, 59, 0, 0);
  
  let delay = midnight.getTime() - now.getTime();
  if (delay < 0) {
    delay += 24 * 60 * 60 * 1000; // Next day
  }
  
  setTimeout(() => {
    createBackup();
    // Then schedule for every 24 hours
    backupInterval = setInterval(createBackup, 24 * 60 * 60 * 1000);
  }, delay);
  
  console.log(`Daily backup scheduled in ${Math.round(delay / 1000 / 60)} minutes`);
}

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

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      hsn_sac_code TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  console.log('Database initialized at:', dbPath);
  
  // Schedule daily backups
  scheduleDailyBackup();
  
  // Create initial backup on first run
  const lastBackupKey = 'last_backup_date';
  const today = new Date().toDateString();
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const lastBackup = stmt.get(lastBackupKey);
  
  if (!lastBackup || lastBackup.value !== today) {
    createBackup();
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(lastBackupKey, today);
  }
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
    if (backupInterval) clearInterval(backupInterval);
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

// ----- Products/Services -----
ipcMain.handle('products:getAll', () => {
  const products = db.prepare('SELECT * FROM products ORDER BY name ASC').all();
  return products;
});

ipcMain.handle('products:getById', (event, id) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  return product;
});

ipcMain.handle('products:create', (event, productData) => {
  const id = Date.now().toString();
  const created_at = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO products (id, name, hsn_sac_code, price, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    productData.name,
    productData.hsn_sac_code,
    productData.price,
    productData.description || null,
    created_at
  );
  
  return { id, ...productData, created_at };
});

ipcMain.handle('products:update', (event, id, productData) => {
  const stmt = db.prepare(`
    UPDATE products SET name = ?, hsn_sac_code = ?, price = ?, description = ?
    WHERE id = ?
  `);
  
  stmt.run(
    productData.name,
    productData.hsn_sac_code,
    productData.price,
    productData.description || null,
    id
  );
  
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
});

ipcMain.handle('products:delete', (event, id) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
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
  
  // Get financial year specific counter
  const currentFY = getCurrentFinancialYear();
  const counterKey = `invoice_counter_${currentFY}`;
  
  // Get and increment invoice counter
  let counterRow = db.prepare('SELECT value FROM settings WHERE key = ?').get(counterKey);
  let currentCounter = counterRow ? parseInt(counterRow.value, 10) : 0;
  currentCounter += 1; // Increment FIRST, then use - so first invoice is 0001
  
  const invoice_number = currentCounter.toString().padStart(4, '0');
  
  // Update counter
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(counterKey, currentCounter.toString());
  
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

// ----- Backup -----
ipcMain.handle('backup:create', () => {
  return createBackup();
});

ipcMain.handle('backup:list', () => {
  ensureBackupDir();
  try {
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        filename: f,
        path: path.join(backupDir, f),
        created: fs.statSync(path.join(backupDir, f)).mtime
      }))
      .sort((a, b) => b.created - a.created);
    return files;
  } catch (error) {
    return [];
  }
});

ipcMain.handle('backup:restore', (event, backupPath) => {
  try {
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // Clear existing data
    db.prepare('DELETE FROM clients').run();
    db.prepare('DELETE FROM invoices').run();
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM settings').run();
    
    // Restore data
    const { clients, invoices, products, settings } = backupData.data;
    
    if (clients && clients.length > 0) {
      const insertClient = db.prepare(`
        INSERT INTO clients (id, client_type, name, address, state, phone, email, aadhar_number, pan_number, cin, gst_number, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      clients.forEach(c => insertClient.run(c.id, c.client_type, c.name, c.address, c.state, c.phone, c.email, c.aadhar_number, c.pan_number, c.cin, c.gst_number, c.created_at));
    }
    
    if (invoices && invoices.length > 0) {
      const insertInvoice = db.prepare(`
        INSERT INTO invoices (id, invoice_number, client_id, invoice_date, due_date, line_items, notes, subtotal, cgst, sgst, igst, total, payment_status, paid_amount, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      invoices.forEach(i => insertInvoice.run(i.id, i.invoice_number, i.client_id, i.invoice_date, i.due_date, i.line_items, i.notes, i.subtotal, i.cgst, i.sgst, i.igst, i.total, i.payment_status, i.paid_amount, i.created_at));
    }
    
    if (products && products.length > 0) {
      const insertProduct = db.prepare(`
        INSERT INTO products (id, name, hsn_sac_code, price, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      products.forEach(p => insertProduct.run(p.id, p.name, p.hsn_sac_code, p.price, p.description, p.created_at));
    }
    
    if (settings && settings.length > 0) {
      const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
      settings.forEach(s => insertSetting.run(s.key, s.value));
    }
    
    return { success: true, message: 'Backup restored successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('backup:getDir', () => {
  ensureBackupDir();
  return backupDir;
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
