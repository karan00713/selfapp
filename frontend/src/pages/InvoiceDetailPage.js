import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sidebar } from '@/components/Sidebar';
import { ArrowLeft, Download, Save } from 'lucide-react';
import { toast } from 'sonner';
import { COMPANY_INFO } from '@/lib/constants';
import { useReactToPrint } from 'react-to-print';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoiceRef = useRef();
  
  const [invoice, setInvoice] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);

  useEffect(() => {
    fetchInvoiceData();
  }, [id]);

  const fetchInvoiceData = async () => {
    try {
      const invoiceRes = await api.get(`/invoices/${id}`);
      const invoiceData = invoiceRes.data;
      setInvoice(invoiceData);
      setPaymentStatus(invoiceData.payment_status);
      setPaidAmount(invoiceData.paid_amount);

      const clientRes = await api.get(`/clients/${invoiceData.client_id}`);
      setClient(clientRes.data);
    } catch (error) {
      toast.error('Failed to load invoice');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async () => {
    setUpdating(true);
    try {
      await api.put(`/invoices/${id}`, {
        payment_status: paymentStatus,
        paid_amount: parseFloat(paidAmount),
      });
      toast.success('Payment status updated');
      fetchInvoiceData();
    } catch (error) {
      toast.error('Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `Invoice-${invoice?.invoice_number}`,
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button 
                data-testid="back-to-invoices-button"
                variant="outline" 
                size="sm"
                onClick={() => navigate('/invoices')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="font-heading font-black text-4xl tracking-tight text-primary">
                  Invoice {invoice?.invoice_number}
                </h1>
                <p className="text-slate-500 mt-2">View and manage invoice details</p>
              </div>
            </div>
            <Button 
              data-testid="download-pdf-button"
              onClick={handlePrint}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Invoice Preview */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardContent className="p-0">
                  {/* Printable Invoice */}
                  <div ref={invoiceRef} className="p-12 bg-white">
                    {/* Header */}
                    <div className="border-b-4 border-primary pb-6 mb-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h1 className="font-heading font-black text-3xl text-primary">
                            {COMPANY_INFO.name}
                          </h1>
                          <p className="text-sm text-slate-600 mt-2 max-w-xs">
                            {COMPANY_INFO.address}
                          </p>
                          <p className="text-sm text-slate-600">
                            Email: {COMPANY_INFO.email}
                          </p>
                          <p className="text-sm text-slate-600">
                            Phone: {COMPANY_INFO.phone}
                          </p>
                          <p className="text-sm font-mono text-slate-600 mt-2">
                            GSTIN: {COMPANY_INFO.gstin}
                          </p>
                          <p className="text-sm font-mono text-slate-600">
                            CIN: {COMPANY_INFO.cin}
                          </p>
                        </div>
                        <div className="text-right">
                          <h2 className="font-heading font-bold text-2xl text-primary">INVOICE</h2>
                          <p className="font-mono text-lg font-bold text-primary mt-2">
                            #{invoice?.invoice_number}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Client & Invoice Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                      <div>
                        <h3 className="font-heading font-bold text-sm text-slate-500 mb-2">BILL TO:</h3>
                        <p className="font-medium text-slate-900">{client?.name}</p>
                        <p className="text-sm text-slate-600 mt-1">{client?.address}</p>
                        <p className="text-sm text-slate-600">{client?.state}</p>
                        <p className="text-sm text-slate-600 mt-2">{client?.email}</p>
                        <p className="text-sm text-slate-600">{client?.phone}</p>
                        {client?.gst_number && (
                          <p className="text-sm font-mono text-slate-600 mt-2">
                            GSTIN: {client?.gst_number}
                          </p>
                        )}
                        {client?.pan_number && (
                          <p className="text-sm font-mono text-slate-600">
                            PAN: {client?.pan_number}
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Invoice Date:</span>
                            <span className="font-medium">{formatDate(invoice?.invoice_date)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Due Date:</span>
                            <span className="font-medium">{formatDate(invoice?.due_date)}</span>
                          </div>
                          <div className="flex justify-between text-sm pt-2 border-t">
                            <span className="text-slate-500">Payment Status:</span>
                            <span className={`font-medium px-2 py-0.5 rounded-sm text-xs ${
                              invoice?.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                              invoice?.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {invoice?.payment_status?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="mb-8">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-900">
                            <th className="text-left py-3 text-sm font-bold text-slate-900">Description</th>
                            <th className="text-left py-3 text-sm font-bold text-slate-900">HSN/SAC</th>
                            <th className="text-right py-3 text-sm font-bold text-slate-900">Qty</th>
                            <th className="text-right py-3 text-sm font-bold text-slate-900">Rate</th>
                            <th className="text-right py-3 text-sm font-bold text-slate-900">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice?.line_items.map((item, index) => (
                            <tr key={index} className="border-b border-slate-200">
                              <td className="py-3 text-sm text-slate-900">{item.description}</td>
                              <td className="py-3 text-sm font-mono text-slate-600">{item.hsn_sac_code}</td>
                              <td className="py-3 text-sm text-right font-mono">{item.quantity}</td>
                              <td className="py-3 text-sm text-right font-mono">{formatCurrency(item.rate)}</td>
                              <td className="py-3 text-sm text-right font-mono font-medium">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mb-8">
                      <div className="w-80">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Subtotal:</span>
                            <span className="font-mono font-medium">{formatCurrency(invoice?.subtotal)}</span>
                          </div>

                          {invoice?.cgst > 0 && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">CGST (9%):</span>
                                <span className="font-mono">{formatCurrency(invoice?.cgst)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">SGST (9%):</span>
                                <span className="font-mono">{formatCurrency(invoice?.sgst)}</span>
                              </div>
                            </>
                          )}

                          {invoice?.igst > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">IGST (18%):</span>
                              <span className="font-mono">{formatCurrency(invoice?.igst)}</span>
                            </div>
                          )}

                          <div className="flex justify-between pt-3 border-t-2 border-primary">
                            <span className="font-heading font-bold text-lg">Total Amount:</span>
                            <span className="font-heading font-black text-2xl text-primary">
                              {formatCurrency(invoice?.total)}
                            </span>
                          </div>

                          {invoice?.paid_amount > 0 && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Paid Amount:</span>
                                <span className="font-mono text-green-600 font-medium">
                                  {formatCurrency(invoice?.paid_amount)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm font-medium">
                                <span className="text-slate-900">Balance Due:</span>
                                <span className="font-mono text-destructive">
                                  {formatCurrency(invoice?.total - invoice?.paid_amount)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {invoice?.notes && (
                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="font-heading font-bold text-sm text-slate-900 mb-2">Notes:</h3>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{invoice?.notes}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
                      <p>Thank you for your business!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Status Update */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8 border-t-4 border-t-accent">
                <CardHeader>
                  <CardTitle className="font-heading font-bold text-xl">Update Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select
                      value={paymentStatus}
                      onValueChange={setPaymentStatus}
                    >
                      <SelectTrigger data-testid="payment-status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Paid Amount (₹)</Label>
                    <Input
                      data-testid="paid-amount-input"
                      type="number"
                      min="0"
                      max={invoice?.total}
                      step="0.01"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-200 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Invoice Total:</span>
                      <span className="font-mono font-medium">{formatCurrency(invoice?.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Balance Due:</span>
                      <span className="font-mono font-medium text-destructive">
                        {formatCurrency(invoice?.total - parseFloat(paidAmount || 0))}
                      </span>
                    </div>
                  </div>

                  <Button
                    data-testid="update-payment-button"
                    className="w-full"
                    onClick={handleUpdatePayment}
                    disabled={updating}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updating ? 'Updating...' : 'Update Payment'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
