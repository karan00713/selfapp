// API layer that works with both Electron IPC and Web API
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// For web development, use REST API without auth (single user app)
const webAPI = {
  async getClients() {
    const res = await fetch(`${BACKEND_URL}/api/clients`);
    if (!res.ok) throw new Error('Failed to fetch clients');
    return res.json();
  },
  async getClient(id) {
    const res = await fetch(`${BACKEND_URL}/api/clients/${id}`);
    if (!res.ok) throw new Error('Failed to fetch client');
    return res.json();
  },
  async createClient(data) {
    const res = await fetch(`${BACKEND_URL}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create client');
    return res.json();
  },
  async updateClient(id, data) {
    const res = await fetch(`${BACKEND_URL}/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update client');
    return res.json();
  },
  async deleteClient(id) {
    const res = await fetch(`${BACKEND_URL}/api/clients/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete client');
    return res.json();
  },
  async getInvoices() {
    const res = await fetch(`${BACKEND_URL}/api/invoices`);
    if (!res.ok) throw new Error('Failed to fetch invoices');
    return res.json();
  },
  async getInvoice(id) {
    const res = await fetch(`${BACKEND_URL}/api/invoices/${id}`);
    if (!res.ok) throw new Error('Failed to fetch invoice');
    return res.json();
  },
  async createInvoice(data) {
    const res = await fetch(`${BACKEND_URL}/api/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create invoice');
    return res.json();
  },
  async updateInvoice(id, data) {
    const res = await fetch(`${BACKEND_URL}/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update invoice');
    return res.json();
  },
  async getDashboardStats() {
    const res = await fetch(`${BACKEND_URL}/api/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },
  async getGSTReport(startDate, endDate) {
    const res = await fetch(`${BACKEND_URL}/api/reports/gst?start_date=${startDate}&end_date=${endDate}`);
    if (!res.ok) throw new Error('Failed to fetch GST report');
    return res.json();
  },
  async getHSNCodes() {
    const res = await fetch('/hsn_sac_codes.json');
    if (!res.ok) throw new Error('Failed to fetch HSN codes');
    return res.json();
  },
  // Products/Services
  async getProducts() {
    const res = await fetch(`${BACKEND_URL}/api/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },
  async getProduct(id) {
    const res = await fetch(`${BACKEND_URL}/api/products/${id}`);
    if (!res.ok) throw new Error('Failed to fetch product');
    return res.json();
  },
  async createProduct(data) {
    const res = await fetch(`${BACKEND_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create product');
    return res.json();
  },
  async updateProduct(id, data) {
    const res = await fetch(`${BACKEND_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  },
  async deleteProduct(id) {
    const res = await fetch(`${BACKEND_URL}/api/products/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return res.json();
  },
  // Backup
  async createBackup() {
    const res = await fetch(`${BACKEND_URL}/api/backup/create`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to create backup');
    return res.json();
  },
  async restoreBackup(data) {
    const res = await fetch(`${BACKEND_URL}/api/backup/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to restore backup');
    return res.json();
  },
  // Bank Details
  async getBankDetails() {
    const res = await fetch(`${BACKEND_URL}/api/bank-details`);
    if (!res.ok) throw new Error('Failed to fetch bank details');
    return res.json();
  },
  async saveBankDetails(data) {
    const res = await fetch(`${BACKEND_URL}/api/bank-details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to save bank details');
    return res.json();
  }
};

// Export unified API
const api = {
  // Clients
  getClients: () => isElectron() ? window.electronAPI.getClients() : webAPI.getClients(),
  getClient: (id) => isElectron() ? window.electronAPI.getClient(id) : webAPI.getClient(id),
  createClient: (data) => isElectron() ? window.electronAPI.createClient(data) : webAPI.createClient(data),
  updateClient: (id, data) => isElectron() ? window.electronAPI.updateClient(id, data) : webAPI.updateClient(id, data),
  deleteClient: (id) => isElectron() ? window.electronAPI.deleteClient(id) : webAPI.deleteClient(id),
  
  // Invoices
  getInvoices: () => isElectron() ? window.electronAPI.getInvoices() : webAPI.getInvoices(),
  getInvoice: (id) => isElectron() ? window.electronAPI.getInvoice(id) : webAPI.getInvoice(id),
  createInvoice: (data) => isElectron() ? window.electronAPI.createInvoice(data) : webAPI.createInvoice(data),
  updateInvoice: (id, data) => isElectron() ? window.electronAPI.updateInvoice(id, data) : webAPI.updateInvoice(id, data),
  
  // Dashboard
  getDashboardStats: () => isElectron() ? window.electronAPI.getDashboardStats() : webAPI.getDashboardStats(),
  
  // Reports
  getGSTReport: (startDate, endDate) => isElectron() ? window.electronAPI.getGSTReport(startDate, endDate) : webAPI.getGSTReport(startDate, endDate),
  
  // HSN Codes
  getHSNCodes: () => isElectron() ? window.electronAPI.getHSNCodes() : webAPI.getHSNCodes(),
  
  // Products/Services
  getProducts: () => isElectron() ? window.electronAPI.getProducts() : webAPI.getProducts(),
  getProduct: (id) => isElectron() ? window.electronAPI.getProduct(id) : webAPI.getProduct(id),
  createProduct: (data) => isElectron() ? window.electronAPI.createProduct(data) : webAPI.createProduct(data),
  updateProduct: (id, data) => isElectron() ? window.electronAPI.updateProduct(id, data) : webAPI.updateProduct(id, data),
  deleteProduct: (id) => isElectron() ? window.electronAPI.deleteProduct(id) : webAPI.deleteProduct(id),
  
  // Backup
  createBackup: () => isElectron() ? window.electronAPI.createBackup() : webAPI.createBackup(),
  restoreBackup: (data) => isElectron() ? window.electronAPI.restoreBackup(data) : webAPI.restoreBackup(data),
  
  // Helper to check if running in Electron
  isElectron
};

export default api;
