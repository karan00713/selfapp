import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/sonner';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ClientsPage from '@/pages/ClientsPage';
import InvoicesPage from '@/pages/InvoicesPage';
import CreateInvoicePage from '@/pages/CreateInvoicePage';
import InvoiceDetailPage from '@/pages/InvoiceDetailPage';
import ReportsPage from '@/pages/ReportsPage';
import '@/App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <ClientsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <InvoicesPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/invoices/new"
            element={
              <ProtectedRoute>
                <CreateInvoicePage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/invoices/:id"
            element={
              <ProtectedRoute>
                <InvoiceDetailPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
