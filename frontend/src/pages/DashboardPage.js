import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar } from '@/components/Sidebar';
import { 
  FileText, 
  Users, 
  IndianRupee, 
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, invoicesRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/invoices')
      ]);
      setStats(statsRes.data);
      setRecentInvoices(invoicesRes.data.slice(0, 5));
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading font-black text-4xl tracking-tight text-primary">
              Dashboard
            </h1>
            <p className="text-slate-500 mt-2">Welcome back, {user?.name}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card data-testid="stat-card-clients" className="border-t-4 border-t-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="font-heading font-black text-4xl text-primary">
                  {stats?.total_clients || 0}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="stat-card-invoices" className="border-t-4 border-t-accent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Invoices</CardTitle>
                <FileText className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="font-heading font-black text-4xl text-primary">
                  {stats?.total_invoices || 0}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="stat-card-pending" className="border-t-4 border-t-destructive">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Pending Amount</CardTitle>
                <Clock className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="font-heading font-black text-3xl text-primary">
                  {formatCurrency(stats?.pending_amount || 0)}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {stats?.unpaid_invoices || 0} unpaid, {stats?.partial_invoices || 0} partial
                </p>
              </CardContent>
            </Card>

            <Card data-testid="stat-card-paid" className="border-t-4 border-t-green-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Collected Amount</CardTitle>
                <TrendingUp className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="font-heading font-black text-3xl text-primary">
                  {formatCurrency(stats?.paid_amount || 0)}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {stats?.paid_invoices || 0} paid invoices
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Invoices */}
          <Card data-testid="recent-invoices-card">
            <CardHeader className="border-t-4 border-t-primary">
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading font-bold text-xl">Recent Invoices</CardTitle>
                <Button 
                  data-testid="view-all-invoices-button"
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/invoices')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No invoices yet</p>
                  <Button 
                    data-testid="create-first-invoice-button"
                    className="mt-4"
                    onClick={() => navigate('/invoices/new')}
                  >
                    Create Your First Invoice
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Invoice #</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInvoices.map((invoice) => (
                        <tr 
                          key={invoice.id} 
                          data-testid={`invoice-row-${invoice.invoice_number}`}
                          className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                        >
                          <td className="py-3 px-4 font-mono text-sm text-primary font-medium">
                            {invoice.invoice_number}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {formatDate(invoice.invoice_date)}
                          </td>
                          <td className="py-3 px-4 font-mono text-sm text-primary font-medium">
                            {formatCurrency(invoice.total)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium ${
                              invoice.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                              invoice.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {invoice.payment_status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
