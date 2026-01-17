import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/electronAPI';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchInvoiceData();
  }, [id]);

  const fetchInvoiceData = async () => {
    try {
      const invoiceData = await api.getInvoice(id);
      if (!invoiceData) {
        toast.error('Invoice not found');
        navigate('/invoices');
        return;
      }
      
      setInvoice(invoiceData);
      setPaymentStatus(invoiceData.payment_status);
      setPaidAmount(invoiceData.paid_amount);

      const clientData = await api.getClient(invoiceData.client_id);
      setClient(clientData);
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
      await api.updateInvoice(id, {
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

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPos = 20;

      // Company Header - NO LOGO, just company name
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(COMPANY_INFO.name, 15, yPos);
      
      yPos += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(COMPANY_INFO.address, 15, yPos);
      yPos += 4;
      doc.text(`Email: ${COMPANY_INFO.email} | Phone: ${COMPANY_INFO.phone}`, 15, yPos);
      yPos += 4;
      doc.text(`GSTIN: ${COMPANY_INFO.gstin} | CIN: ${COMPANY_INFO.cin}`, 15, yPos);

      // Invoice Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('TAX INVOICE', pageWidth - 15, 20, { align: 'right' });
      doc.setFontSize(12);
      doc.text(`#${invoice.invoice_number}`, pageWidth - 15, 28, { align: 'right' });

      // Draw line
      yPos = 50;
      doc.setLineWidth(0.5);
      doc.line(15, yPos, pageWidth - 15, yPos);
      yPos += 10;

      // Bill To Section
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('BILL TO:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 5;
      doc.text(client?.name || '', 15, yPos);
      yPos += 4;
      doc.setFontSize(9);
      doc.text(client?.address || '', 15, yPos);
      yPos += 4;
      doc.text(client?.state || '', 15, yPos);
      yPos += 4;
      doc.text(`${client?.email || ''} | ${client?.phone || ''}`, 15, yPos);
      if (client?.gst_number) {
        yPos += 4;
        doc.text(`GSTIN: ${client.gst_number}`, 15, yPos);
      }

      // Invoice Details (right side)
      const rightX = pageWidth - 60;
      let rightY = 60;
      doc.setFontSize(9);
      doc.text('Invoice Date:', rightX, rightY);
      doc.text(formatDate(invoice.invoice_date), rightX + 35, rightY);
      rightY += 5;
      doc.text('Due Date:', rightX, rightY);
      doc.text(formatDate(invoice.due_date), rightX + 35, rightY);
      rightY += 5;
      doc.text('Status:', rightX, rightY);
      doc.text(invoice.payment_status.toUpperCase(), rightX + 35, rightY);

      // Line Items Table
      yPos += 15;
      const tableData = invoice.line_items.map(item => [
        item.description,
        item.hsn_sac_code,
        item.quantity.toString(),
        formatCurrency(item.rate),
        formatCurrency(item.amount)
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Description', 'HSN/SAC', 'Qty', 'Rate', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' }
        },
        margin: { left: 15, right: 15 }
      });

      // Totals
      yPos = doc.lastAutoTable.finalY + 10;
      const totalsX = pageWidth - 80;
      
      doc.setFontSize(9);
      doc.text('Subtotal:', totalsX, yPos);
      doc.text(formatCurrency(invoice.subtotal), pageWidth - 15, yPos, { align: 'right' });
      
      if (invoice.cgst > 0) {
        yPos += 5;
        doc.text('CGST (9%):', totalsX, yPos);
        doc.text(formatCurrency(invoice.cgst), pageWidth - 15, yPos, { align: 'right' });
        yPos += 5;
        doc.text('SGST (9%):', totalsX, yPos);
        doc.text(formatCurrency(invoice.sgst), pageWidth - 15, yPos, { align: 'right' });
      }
      
      if (invoice.igst > 0) {
        yPos += 5;
        doc.text('IGST (18%):', totalsX, yPos);
        doc.text(formatCurrency(invoice.igst), pageWidth - 15, yPos, { align: 'right' });
      }

      yPos += 8;
      doc.setLineWidth(0.3);
      doc.line(totalsX, yPos - 3, pageWidth - 15, yPos - 3);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Amount:', totalsX, yPos);
      doc.text(formatCurrency(invoice.total), pageWidth - 15, yPos, { align: 'right' });

      if (invoice.paid_amount > 0) {
        yPos += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Paid Amount:', totalsX, yPos);
        doc.text(formatCurrency(invoice.paid_amount), pageWidth - 15, yPos, { align: 'right' });
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Balance Due:', totalsX, yPos);
        doc.text(formatCurrency(invoice.total - invoice.paid_amount), pageWidth - 15, yPos, { align: 'right' });
      }

      // Notes
      if (invoice.notes) {
        yPos += 15;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', 15, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 5;
        const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 30);
        doc.text(splitNotes, 15, yPos);
      }

      // Footer
      const footerY = doc.internal.pageSize.height - 20;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Generated by ${COMPANY_INFO.name}`, pageWidth / 2, footerY + 5, { align: 'center' });

      // Save PDF
      doc.save(`Invoice-${invoice.invoice_number}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
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
                  Invoice #{invoice?.invoice_number}
                </h1>
                <p className="text-slate-500 mt-2">View and manage invoice details</p>
              </div>
            </div>
            <Button 
              data-testid="download-pdf-button"
              onClick={generatePDF}
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
                    {/* Header - NO LOGO */}
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
                          <h2 className="font-heading font-bold text-2xl text-primary">TAX INVOICE</h2>
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
