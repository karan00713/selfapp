import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/electronAPI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/Sidebar';
import { 
  Users, 
  FileText, 
  IndianRupee, 
  Clock,
  Plus,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading font-black text-4xl tracking-tight text-primary">
                Dashboard
              </h1>
              <p className="text-slate-500 mt-2">Overview of your GST billing</p>
            </div>
            <Button 
              data-testid="create-invoice-btn"
              onClick={() => navigate('/invoices/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-t-4 border-t-primary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Clients</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-heading font-black text-primary">
                  {stats?.total_clients || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-accent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Invoices</CardTitle>
                <FileText className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-heading font-black text-accent">
                  {stats?.total_invoices || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Paid Amount</CardTitle>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-heading font-black text-green-600">
                  {formatCurrency(stats?.paid_amount)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-orange-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Pending Amount</CardTitle>
                <Clock className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-heading font-black text-orange-600">
                  {formatCurrency(stats?.pending_amount)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading font-bold text-lg flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  Unpaid Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-heading font-black text-red-600">
                  {stats?.unpaid_invoices || 0}
                </div>
                <p className="text-sm text-slate-500 mt-1">Requires attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading font-bold text-lg flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  Partial Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-heading font-black text-yellow-600">
                  {stats?.partial_invoices || 0}
                </div>
                <p className="text-sm text-slate-500 mt-1">In progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading font-bold text-lg flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Paid Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-heading font-black text-green-600">
                  {stats?.paid_invoices || 0}
                </div>
                <p className="text-sm text-slate-500 mt-1">Completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading font-bold text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  data-testid="quick-new-invoice"
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => navigate('/invoices/new')}
                >
                  <FileText className="w-6 h-6" />
                  <span className="text-sm">New Invoice</span>
                </Button>
                <Button 
                  data-testid="quick-add-client"
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => navigate('/clients')}
                >
                  <Users className="w-6 h-6" />
                  <span className="text-sm">Add Client</span>
                </Button>
                <Button 
                  data-testid="quick-view-reports"
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => navigate('/reports')}
                >
                  <IndianRupee className="w-6 h-6" />
                  <span className="text-sm">GST Reports</span>
                </Button>
                <Button 
                  data-testid="quick-hsn-codes"
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => navigate('/hsn-codes')}
                >
                  <AlertCircle className="w-6 h-6" />
                  <span className="text-sm">HSN/SAC Codes</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
