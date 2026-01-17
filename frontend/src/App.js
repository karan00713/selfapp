import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import DashboardPage from '@/pages/DashboardPage';
import ClientsPage from '@/pages/ClientsPage';
import InvoicesPage from '@/pages/InvoicesPage';
import CreateInvoicePage from '@/pages/CreateInvoicePage';
import InvoiceDetailPage from '@/pages/InvoiceDetailPage';
import ReportsPage from '@/pages/ReportsPage';
import HSNCodesPage from '@/pages/HSNCodesPage';
import ProductsPage from '@/pages/ProductsPage';
import '@/App.css';

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Default route goes to dashboard - no login required */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoices/new" element={<CreateInvoicePage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/hsn-codes" element={<HSNCodesPage />} />
        <Route path="/products" element={<ProductsPage />} />
      </Routes>
      <Toaster position="top-right" />
    </HashRouter>
  );
}

export default App;
