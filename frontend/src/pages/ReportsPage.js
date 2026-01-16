import { useState } from 'react';
import api from '@/lib/electronAPI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sidebar } from '@/components/Sidebar';
import { BarChart3, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const data = await api.getGSTReport(startDate, endDate);
      setReport(data);
      toast.success('Report generated successfully');
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
    }).format(amount || 0);
  };

  const exportToCSV = () => {
    if (!report) return;

    const csvContent = `GST Report - ${report.period}
    
Total Invoices,${report.total_invoices}
Total Taxable Amount,${report.total_taxable_amount}
Total CGST,${report.total_cgst}
Total SGST,${report.total_sgst}
Total IGST,${report.total_igst}
Total Tax Collected,${report.total_tax}
Total Invoice Value,${report.total_invoice_value}
`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GST_Report_${startDate}_to_${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported to CSV');
  };

  // Quick date range buttons
  const setDateRange = (range) => {
    const now = new Date();
    let start, end;

    switch (range) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisQuarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), quarterStart, 1);
        end = now;
        break;
      case 'lastQuarter':
        const lastQuarterStart = Math.floor(now.getMonth() / 3) * 3 - 3;
        start = new Date(now.getFullYear(), lastQuarterStart, 1);
        end = new Date(now.getFullYear(), lastQuarterStart + 3, 0);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        end = now;
        break;
      case 'financialYear':
        // Indian financial year: April to March
        if (now.getMonth() >= 3) {
          start = new Date(now.getFullYear(), 3, 1); // April this year
        } else {
          start = new Date(now.getFullYear() - 1, 3, 1); // April last year
        }
        end = now;
        break;
      default:
        return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
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
            <p className="text-slate-500 mt-2">Generate GST reports for filing and compliance</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Generator */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-t-4 border-t-primary">
                <CardHeader>
                  <CardTitle className="font-heading font-bold text-xl">Generate Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick Date Ranges */}
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">Quick Select</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setDateRange('thisMonth')}
                      >
                        This Month
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setDateRange('lastMonth')}
                      >
                        Last Month
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setDateRange('thisQuarter')}
                      >
                        This Quarter
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setDateRange('lastQuarter')}
                      >
                        Last Quarter
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="col-span-2"
                        onClick={() => setDateRange('financialYear')}
                      >
                        Current Financial Year
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      data-testid="report-start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      data-testid="report-end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>

                  <Button 
                    data-testid="generate-report-button"
                    className="w-full"
                    onClick={generateReport}
                    disabled={loading}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {loading ? 'Generating...' : 'Generate Report'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Report Display */}
            <div className="lg:col-span-2">
              {!report ? (
                <Card>
                  <CardContent className="py-16 text-center text-slate-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No report generated</p>
                    <p className="text-sm mt-1">Select a date range and click "Generate Report"</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="border-t-4 border-t-accent">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-heading font-bold text-xl">GST Summary Report</CardTitle>
                        <p className="text-sm text-slate-500 mt-1">{report.period}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={exportToCSV}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-sm">
                        <p className="text-sm text-slate-500">Total Invoices</p>
                        <p className="text-3xl font-heading font-black text-primary mt-1">
                          {report.total_invoices}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-sm">
                        <p className="text-sm text-slate-500">Total Invoice Value</p>
                        <p className="text-2xl font-heading font-bold text-primary mt-1">
                          {formatCurrency(report.total_invoice_value)}
                        </p>
                      </div>
                    </div>

                    {/* Tax Breakdown */}
                    <div className="border rounded-sm overflow-hidden">
                      <div className="bg-slate-900 text-white px-4 py-3">
                        <h3 className="font-heading font-bold">Tax Breakdown</h3>
                      </div>
                      <div className="divide-y divide-slate-200">
                        <div className="flex justify-between px-4 py-3">
                          <span className="text-slate-600">Taxable Amount (Subtotal)</span>
                          <span className="font-mono font-medium">{formatCurrency(report.total_taxable_amount)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-3 bg-blue-50">
                          <span className="text-slate-600">CGST Collected</span>
                          <span className="font-mono font-medium text-blue-700">{formatCurrency(report.total_cgst)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-3 bg-blue-50">
                          <span className="text-slate-600">SGST Collected</span>
                          <span className="font-mono font-medium text-blue-700">{formatCurrency(report.total_sgst)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-3 bg-green-50">
                          <span className="text-slate-600">IGST Collected</span>
                          <span className="font-mono font-medium text-green-700">{formatCurrency(report.total_igst)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-4 bg-slate-100">
                          <span className="font-heading font-bold text-lg">Total GST Liability</span>
                          <span className="font-heading font-black text-xl text-primary">
                            {formatCurrency(report.total_tax)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-sm">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> This report is for reference only. Please verify all amounts 
                        with your tax consultant before filing GST returns. The values shown are based on 
                        invoice dates within the selected period.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
