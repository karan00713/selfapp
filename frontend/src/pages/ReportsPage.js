import { useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sidebar } from '@/components/Sidebar';
import { BarChart3, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/reports/gst', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });
      setReport(response.data);
    } catch (error) {
      toast.error('Failed to generate report');
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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading font-black text-4xl tracking-tight text-primary">
              GST Reports
            </h1>
            <p className="text-slate-500 mt-2">Generate and view GST summary reports</p>
          </div>

          {/* Report Generator */}
          <Card className="mb-6 border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="font-heading font-bold text-xl">Generate Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    data-testid="report-start-date-input"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>End Date</Label>
                  <Input
                    data-testid="report-end-date-input"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <Button 
                  data-testid="generate-report-button"
                  onClick={handleGenerateReport}
                  disabled={loading}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {loading ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Results */}
          {report && (
            <Card data-testid="gst-report-card" className="border-t-4 border-t-accent">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading font-bold text-xl">
                    GST Summary Report
                  </CardTitle>
                  <span className="text-sm text-slate-500">{report.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-6 bg-slate-50 rounded-sm border border-slate-200">
                    <p className="text-sm text-slate-600 mb-2">Total Invoices</p>
                    <p className="font-heading font-black text-4xl text-primary">{report.total_invoices}</p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-sm border border-slate-200">
                    <p className="text-sm text-slate-600 mb-2">Taxable Amount</p>
                    <p className="font-heading font-black text-3xl text-primary">
                      {formatCurrency(report.total_taxable_amount)}
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-sm border border-slate-200">
                    <p className="text-sm text-slate-600 mb-2">Total Tax</p>
                    <p className="font-heading font-black text-3xl text-primary">
                      {formatCurrency(report.total_tax)}
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-sm border border-slate-200">
                    <p className="text-sm text-slate-600 mb-2">Total Invoice Value</p>
                    <p className="font-heading font-black text-3xl text-primary">
                      {formatCurrency(report.total_invoice_value)}
                    </p>
                  </div>
                </div>

                <div className="mt-8 p-6 border border-slate-200 rounded-sm">
                  <h3 className="font-heading font-bold text-lg mb-4">Tax Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">CGST Collected</p>
                      <p className="font-mono text-xl font-bold text-primary">
                        {formatCurrency(report.total_cgst)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">SGST Collected</p>
                      <p className="font-mono text-xl font-bold text-primary">
                        {formatCurrency(report.total_sgst)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">IGST Collected</p>
                      <p className="font-mono text-xl font-bold text-primary">
                        {formatCurrency(report.total_igst)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button 
                    data-testid="export-report-button"
                    variant="outline"
                    onClick={() => {
                      const reportText = `GST REPORT - ${report.period}\n\n` +
                        `Total Invoices: ${report.total_invoices}\n` +
                        `Taxable Amount: ${formatCurrency(report.total_taxable_amount)}\n` +
                        `CGST: ${formatCurrency(report.total_cgst)}\n` +
                        `SGST: ${formatCurrency(report.total_sgst)}\n` +
                        `IGST: ${formatCurrency(report.total_igst)}\n` +
                        `Total Tax: ${formatCurrency(report.total_tax)}\n` +
                        `Total Invoice Value: ${formatCurrency(report.total_invoice_value)}`;
                      
                      const blob = new Blob([reportText], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `GST-Report-${startDate}-to-${endDate}.txt`;
                      a.click();
                      toast.success('Report exported successfully');
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
