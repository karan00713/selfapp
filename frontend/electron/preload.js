const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Clients
  getClients: () => ipcRenderer.invoke('clients:getAll'),
  getClient: (id) => ipcRenderer.invoke('clients:getById', id),
  createClient: (data) => ipcRenderer.invoke('clients:create', data),
  updateClient: (id, data) => ipcRenderer.invoke('clients:update', id, data),
  deleteClient: (id) => ipcRenderer.invoke('clients:delete', id),
  
  // Invoices
  getInvoices: () => ipcRenderer.invoke('invoices:getAll'),
  getInvoice: (id) => ipcRenderer.invoke('invoices:getById', id),
  createInvoice: (data) => ipcRenderer.invoke('invoices:create', data),
  updateInvoice: (id, data) => ipcRenderer.invoke('invoices:update', id, data),
  
  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('dashboard:getStats'),
  
  // Reports
  getGSTReport: (startDate, endDate) => ipcRenderer.invoke('reports:getGST', startDate, endDate),
  
  // App utilities
  getLogoBase64: () => ipcRenderer.invoke('app:getLogoBase64'),
  getHSNCodes: () => ipcRenderer.invoke('hsn:getAll'),
});
