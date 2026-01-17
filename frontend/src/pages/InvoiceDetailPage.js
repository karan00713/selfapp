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
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // For internal tracking (not shown on invoice)
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);

  useEffect(() => {
    fetchInvoiceData();
    fetchBankDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchBankDetails = async () => {
    try {
      const data = await api.getBankDetails();
      if (data && data.account_name) {
        setBankDetails(data);
      }
    } catch (error) {
      console.error('Failed to load bank details:', error);
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
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      let yPos = margin;

      // ===== HEADER SECTION =====
      // Company Name (bold, large)
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(COMPANY_INFO.name, margin, yPos);
      
      // Invoice title on right
      doc.setFontSize(14);
      doc.text('TAX INVOICE', pageWidth - margin, yPos, { align: 'right' });
      
      yPos += 6;
      
      // Company details
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(COMPANY_INFO.address, margin, yPos);
      
      // Invoice number on right
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice #' + invoice.invoice_number, pageWidth - margin, yPos, { align: 'right' });
      
      yPos += 4;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('GSTIN: ' + COMPANY_INFO.gstin + '  |  LLPIN: ' + COMPANY_INFO.llpin, margin, yPos);
      
      yPos += 4;
      doc.text('Email: ' + COMPANY_INFO.email + '  |  Phone: ' + COMPANY_INFO.phone, margin, yPos);
      
      // Horizontal line
      yPos += 6;
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // ===== BILL TO & INVOICE INFO =====
      const colWidth = (pageWidth - 2 * margin) / 2;
      
      // Bill To section
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('BILL TO:', margin, yPos);
      
      // Invoice date on right (NO due date)
      doc.text('Invoice Date:', margin + colWidth, yPos);
      
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(client?.name || '', margin, yPos);
      
      doc.setFontSize(9);
      doc.text(formatDate(invoice.invoice_date), margin + colWidth, yPos);
      
      yPos += 5;
      doc.setFontSize(9);
      const addressLines = doc.splitTextToSize(client?.address || '', colWidth - 10);
      doc.text(addressLines, margin, yPos);
      
      yPos += addressLines.length * 4;
      doc.text(client?.state || '', margin, yPos);
      
      yPos += 4;
      doc.text('Email: ' + (client?.email || ''), margin, yPos);
      yPos += 4;
      doc.text('Phone: ' + (client?.phone || ''), margin, yPos);
      
      if (client?.gst_number) {
        yPos += 4;
        doc.text('GSTIN: ' + client.gst_number, margin, yPos);
      }
      
      yPos += 10;

      // ===== LINE ITEMS TABLE =====
      const tableData = invoice.line_items.map((item, index) => [
        (index + 1).toString(),
        item.description,
        item.hsn_sac_code,
        item.quantity.toString(),
        formatNumber(item.rate),
        formatNumber(item.amount)
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['S.No', 'Description', 'HSN/SAC', 'Qty', 'Rate (Rs.)', 'Amount (Rs.)']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [41, 55, 72],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: { 
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 60 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 28, halign: 'right' },
          5: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: margin, right: margin }
      });

      yPos = doc.lastAutoTable.finalY + 8;

      // ===== TOTALS SECTION =====
      const totalsX = pageWidth - 85;
      
      // Subtotal
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', totalsX, yPos);
      doc.text('Rs. ' + formatNumber(invoice.subtotal), pageWidth - margin, yPos, { align: 'right' });
      
      // GST
      if (invoice.cgst > 0) {
        yPos += 5;
        doc.text('CGST (9%):', totalsX, yPos);
        doc.text('Rs. ' + formatNumber(invoice.cgst), pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;
        doc.text('SGST (9%):', totalsX, yPos);
        doc.text('Rs. ' + formatNumber(invoice.sgst), pageWidth - margin, yPos, { align: 'right' });
      }
      
      if (invoice.igst > 0) {
        yPos += 5;
        doc.text('IGST (18%):', totalsX, yPos);
        doc.text('Rs. ' + formatNumber(invoice.igst), pageWidth - margin, yPos, { align: 'right' });
      }
      
      // Total line
      yPos += 3;
      doc.setLineWidth(0.3);
      doc.line(totalsX, yPos, pageWidth - margin, yPos);
      yPos += 5;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Amount:', totalsX, yPos);
      doc.text('Rs. ' + formatNumber(invoice.total), pageWidth - margin, yPos, { align: 'right' });
      
      yPos += 10;

      // ===== BANK DETAILS SECTION =====
      if (bankDetails && bankDetails.account_name) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Bank Details:', margin, yPos);
        
        yPos += 5;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        const bankInfo = [
          ['Account Name:', bankDetails.account_name],
          ['Bank Name:', bankDetails.bank_name],
          ['Account No:', bankDetails.account_number],
          ['Branch:', bankDetails.branch],
          ['IFSC Code:', bankDetails.ifsc_code],
        ];
        
        bankInfo.forEach(([label, value]) => {
          doc.text(label, margin, yPos);
          doc.text(value, margin + 28, yPos);
          yPos += 4;
        });
      }

      // ===== NOTES =====
      if (invoice.notes) {
        yPos += 5;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 4;
        const notesLines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
        doc.text(notesLines, margin, yPos);
        yPos += notesLines.length * 4;
      }

      // ===== SIGNATURE SECTION =====
      const sigY = pageHeight - 45;
      
      // Right aligned signature area
      const sigX = pageWidth - 70;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('For ' + COMPANY_INFO.name, sigX, sigY);
      
      // Signature line
      doc.setLineWidth(0.3);
      doc.line(sigX, sigY + 20, pageWidth - margin, sigY + 20);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Authorized Signatory', sigX + 10, sigY + 25);

      // ===== FOOTER =====
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 15, { align: 'center' });

      // Save PDF
      doc.save('Invoice-' + invoice.invoice_number + '.pdf');
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return 'Rs. ' + new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
        <div className="max-w-6xl mx-auto p-8">
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
                <p className="text-slate-500 mt-2">View and download invoice</p>
              </div>
            </div>
            <Button 
              data-testid="download-pdf-button"
              onClick={generatePDF}
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Invoice Preview - Left Side (2 columns) */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardContent className="p-0">
                  <div ref={invoiceRef} className="p-10 bg-white">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
                      <div>
                        <h1 className="font-heading font-black text-2xl text-primary">
                          {COMPANY_INFO.name}
                        </h1>
                        <p className="text-sm text-slate-600 mt-2 max-w-sm">
                          {COMPANY_INFO.address}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          GSTIN: {COMPANY_INFO.gstin} | LLPIN: {COMPANY_INFO.llpin}
                        </p>
                        <p className="text-sm text-slate-600">
                          Email: {COMPANY_INFO.email} | Phone: {COMPANY_INFO.phone}
                        </p>
                      </div>
                      <div className="text-right">
                        <h2 className="font-heading font-bold text-xl text-primary">TAX INVOICE</h2>
                        <p className="font-mono text-lg font-bold mt-1">
                          #{invoice?.invoice_number}
                        </p>
                        <p className="text-sm text-slate-600 mt-3">
                          Date: {formatDate(invoice?.invoice_date)}
                        </p>
                        {/* NO due date shown on invoice preview */}
                      </div>
                    </div>

                    {/* Client Info */}
                    <div className="mb-8">
                      <h3 className="font-bold text-sm text-slate-500 mb-2">BILL TO:</h3>
                      <p className="font-medium text-slate-900">{client?.name}</p>
                      <p className="text-sm text-slate-600 mt-1">{client?.address}</p>
                      <p className="text-sm text-slate-600">{client?.state}</p>
                      <p className="text-sm text-slate-600 mt-1">{client?.email} | {client?.phone}</p>
                      {client?.gst_number && (
                        <p className="text-sm font-mono text-slate-600 mt-1">GSTIN: {client?.gst_number}</p>
                      )}
                    </div>

                    {/* Line Items Table */}
                    <div className="mb-8">
                      <table className="w-full border border-slate-300">
                        <thead>
                          <tr className="bg-slate-800 text-white">
                            <th className="py-2 px-3 text-left text-sm font-bold w-12">S.No</th>
                            <th className="py-2 px-3 text-left text-sm font-bold">Description</th>
                            <th className="py-2 px-3 text-center text-sm font-bold w-24">HSN/SAC</th>
                            <th className="py-2 px-3 text-center text-sm font-bold w-16">Qty</th>
                            <th className="py-2 px-3 text-right text-sm font-bold w-24">Rate (Rs.)</th>
                            <th className="py-2 px-3 text-right text-sm font-bold w-28">Amount (Rs.)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice?.line_items.map((item, index) => (
                            <tr key={index} className="border-b border-slate-200">
                              <td className="py-2 px-3 text-sm text-center">{index + 1}</td>
                              <td className="py-2 px-3 text-sm">{item.description}</td>
                              <td className="py-2 px-3 text-sm font-mono text-center">{item.hsn_sac_code}</td>
                              <td className="py-2 px-3 text-sm text-center">{item.quantity}</td>
                              <td className="py-2 px-3 text-sm font-mono text-right">{formatNumber(item.rate)}</td>
                              <td className="py-2 px-3 text-sm font-mono text-right font-medium">{formatNumber(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mb-8">
                      <div className="w-72">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Subtotal:</span>
                            <span className="font-mono">Rs. {formatNumber(invoice?.subtotal)}</span>
                          </div>

                          {invoice?.cgst > 0 && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">CGST (9%):</span>
                                <span className="font-mono">Rs. {formatNumber(invoice?.cgst)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">SGST (9%):</span>
                                <span className="font-mono">Rs. {formatNumber(invoice?.sgst)}</span>
                              </div>
                            </>
                          )}

                          {invoice?.igst > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">IGST (18%):</span>
                              <span className="font-mono">Rs. {formatNumber(invoice?.igst)}</span>
                            </div>
                          )}

                          <div className="flex justify-between pt-2 border-t-2 border-slate-900">
                            <span className="font-bold text-lg">Total Amount:</span>
                            <span className="font-bold text-xl">Rs. {formatNumber(invoice?.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bank Details */}
                    {bankDetails && bankDetails.account_name && (
                      <div className="mb-8 p-4 bg-slate-50 rounded border border-slate-200">
                        <h4 className="font-bold text-sm text-slate-900 mb-3">Bank Details:</h4>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                          <div className="flex">
                            <span className="text-slate-600 w-28">Account Name:</span>
                            <span className="font-medium">{bankDetails.account_name}</span>
                          </div>
                          <div className="flex">
                            <span className="text-slate-600 w-28">Bank Name:</span>
                            <span className="font-medium">{bankDetails.bank_name}</span>
                          </div>
                          <div className="flex">
                            <span className="text-slate-600 w-28">Account No:</span>
                            <span className="font-mono font-medium">{bankDetails.account_number}</span>
                          </div>
                          <div className="flex">
                            <span className="text-slate-600 w-28">Branch:</span>
                            <span className="font-medium">{bankDetails.branch}</span>
                          </div>
                          <div className="flex">
                            <span className="text-slate-600 w-28">IFSC Code:</span>
                            <span className="font-mono font-medium">{bankDetails.ifsc_code}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {invoice?.notes && (
                      <div className="mb-8">
                        <h4 className="font-bold text-sm text-slate-900 mb-2">Notes:</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{invoice?.notes}</p>
                      </div>
                    )}

                    {/* Signature Section */}
                    <div className="flex justify-end mt-12">
                      <div className="text-center">
                        <p className="font-bold text-sm mb-16">For {COMPANY_INFO.name}</p>
                        <div className="border-t border-slate-400 pt-2 w-48">
                          <p className="text-sm text-slate-600">Authorized Signatory</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-4 border-t border-slate-200 text-center">
                      <p className="text-xs text-slate-500">Thank you for your business!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Tracking Panel - Right Side (1 column) - For internal tracking only */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8 border-t-4 border-t-accent">
                <CardHeader>
                  <CardTitle className="font-heading font-bold text-lg">Payment Tracking</CardTitle>
                  <p className="text-xs text-slate-500">(Internal use only - not shown on invoice)</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded border text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-600">Due Date:</span>
                      <span className="font-medium">{formatDate(invoice?.due_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Invoice Total:</span>
                      <span className="font-mono font-medium">Rs. {formatNumber(invoice?.total)}</span>
                    </div>
                  </div>

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
                    <Label>Paid Amount (Rs.)</Label>
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
                      <span className="text-slate-600">Balance Due:</span>
                      <span className={`font-mono font-medium ${(invoice?.total - parseFloat(paidAmount || 0)) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Rs. {formatNumber(invoice?.total - parseFloat(paidAmount || 0))}
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
                    {updating ? 'Updating...' : 'Update Payment Status'}
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
