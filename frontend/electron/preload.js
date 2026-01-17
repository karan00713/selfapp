const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Clients
  getClients: () => ipcRenderer.invoke('clients:getAll'),
  getClient: (id) => ipcRenderer.invoke('clients:getById', id),
  createClient: (data) => ipcRenderer.invoke('clients:create', data),
  updateClient: (id, data) => ipcRenderer.invoke('clients:update', id, data),
  deleteClient: (id) => ipcRenderer.invoke('clients:delete', id),
  
  // Products/Services
  getProducts: () => ipcRenderer.invoke('products:getAll'),
  getProduct: (id) => ipcRenderer.invoke('products:getById', id),
  createProduct: (data) => ipcRenderer.invoke('products:create', data),
  updateProduct: (id, data) => ipcRenderer.invoke('products:update', id, data),
  deleteProduct: (id) => ipcRenderer.invoke('products:delete', id),
  
  // Invoices
  getInvoices: () => ipcRenderer.invoke('invoices:getAll'),
  getInvoice: (id) => ipcRenderer.invoke('invoices:getById', id),
  createInvoice: (data) => ipcRenderer.invoke('invoices:create', data),
  updateInvoice: (id, data) => ipcRenderer.invoke('invoices:update', id, data),
  
  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('dashboard:getStats'),
  
  // Reports
  getGSTReport: (startDate, endDate) => ipcRenderer.invoke('reports:getGST', startDate, endDate),
  
  // Backup
  createBackup: () => ipcRenderer.invoke('backup:create'),
  listBackups: () => ipcRenderer.invoke('backup:list'),
  restoreBackup: (backupPath) => ipcRenderer.invoke('backup:restore', backupPath),
  getBackupDir: () => ipcRenderer.invoke('backup:getDir'),
  
  // HSN/SAC Codes
  getHSNCodes: () => ipcRenderer.invoke('hsn:getAll'),
});
