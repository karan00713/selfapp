// API layer that works with both Electron IPC and Web API
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

// For web development, fall back to REST API
const webAPI = {
  async getClients() {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/clients`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return res.json();
  },
  async getClient(id) {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/clients/${id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return res.json();
  },
  async createClient(data) {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/clients`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async updateClient(id, data) {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/clients/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async deleteClient(id) {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/clients/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return res.json();
  },
  async getInvoices() {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/invoices`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return res.json();
  },
  async getInvoice(id) {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/invoices/${id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return res.json();
  },
  async createInvoice(data) {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/invoices`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async updateInvoice(id, data) {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async getDashboardStats() {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return res.json();
  },
  async getGSTReport(startDate, endDate) {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/reports/gst?start_date=${startDate}&end_date=${endDate}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return res.json();
  },
  async getLogoBase64() {
    return '/company_logo.jpg';
  },
  async getHSNCodes() {
    const res = await fetch('/hsn_sac_codes.json');
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
  
  // Utilities
  getLogoBase64: () => isElectron() ? window.electronAPI.getLogoBase64() : webAPI.getLogoBase64(),
  getHSNCodes: () => isElectron() ? window.electronAPI.getHSNCodes() : webAPI.getHSNCodes(),
  
  // Helper to check if running in Electron
  isElectron
};

export default api;
