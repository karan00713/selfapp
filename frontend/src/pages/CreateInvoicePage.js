import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Sidebar } from '@/components/Sidebar';
import { Plus, Trash2, ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import { COMPANY_INFO } from '@/lib/constants';
import { Textarea } from '@/components/ui/textarea';

export default function CreateInvoicePage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hsnCodes, setHsnCodes] = useState([]);
  const [hsnDialogOpen, setHsnDialogOpen] = useState(false);
  const [hsnSearchQuery, setHsnSearchQuery] = useState('');
  const [activeLineItemIndex, setActiveLineItemIndex] = useState(null);
  
  const [formData, setFormData] = useState({
    client_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    line_items: [
      { description: '', hsn_sac_code: '', quantity: 1, rate: 0, amount: 0 }
    ],
  });

  useEffect(() => {
    fetchClients();
    fetchHSNCodes();
  }, []);

  const fetchClients = async () => {
    try {
      const data = await api.getClients();
      setClients(data);
    } catch (error) {
      toast.error('Failed to load clients');
    }
  };

  const fetchHSNCodes = async () => {
    try {
      const data = await api.getHSNCodes();
      setHsnCodes(data);
    } catch (error) {
      console.error('Failed to load HSN codes:', error);
    }
  };

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client);
    setFormData({ ...formData, client_id: clientId });
  };

  const handleLineItemChange = (index, field, value) => {
    const newLineItems = [...formData.line_items];
    newLineItems[index][field] = value;
    
    // Calculate amount
    if (field === 'quantity' || field === 'rate') {
      newLineItems[index].amount = parseFloat(newLineItems[index].quantity || 0) * parseFloat(newLineItems[index].rate || 0);
    }
    
    setFormData({ ...formData, line_items: newLineItems });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [
        ...formData.line_items,
        { description: '', hsn_sac_code: '', quantity: 1, rate: 0, amount: 0 }
      ]
    });
  };

  const removeLineItem = (index) => {
    if (formData.line_items.length > 1) {
      const newLineItems = formData.line_items.filter((_, i) => i !== index);
      setFormData({ ...formData, line_items: newLineItems });
    }
  };

  const openHsnDialog = (index) => {
    setActiveLineItemIndex(index);
    setHsnSearchQuery('');
    setHsnDialogOpen(true);
  };

  const selectHsnCode = (code) => {
    if (activeLineItemIndex !== null) {
      handleLineItemChange(activeLineItemIndex, 'hsn_sac_code', code.HSN_CD);
    }
    setHsnDialogOpen(false);
  };

  const filteredHsnCodes = hsnCodes.filter(code => 
    code.HSN_CD.toLowerCase().includes(hsnSearchQuery.toLowerCase()) ||
    code.HSN_Description.toLowerCase().includes(hsnSearchQuery.toLowerCase())
  ).slice(0, 100); // Limit to 100 results for performance

  const calculateSubtotal = () => {
    return formData.line_items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  };

  const calculateGST = () => {
    const subtotal = calculateSubtotal();
    const gstRate = 0.18; // 18%
    
    if (selectedClient && selectedClient.state === COMPANY_INFO.state) {
      // Intra-state: CGST + SGST
      const cgst = subtotal * (gstRate / 2);
      const sgst = subtotal * (gstRate / 2);
      return { cgst, sgst, igst: 0, total: cgst + sgst };
    } else {
      // Inter-state: IGST
      const igst = subtotal * gstRate;
      return { cgst: 0, sgst: 0, igst, total: igst };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      toast.error('Please select a client');
      return;
    }

    if (formData.line_items.length === 0 || !formData.line_items[0].description) {
      toast.error('Please add at least one line item');
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.createInvoice(formData);
      toast.success('Invoice created successfully');
      navigate(`/invoices/${response.id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to create invoice');
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

  const subtotal = calculateSubtotal();
  const gst = calculateGST();
  const total = subtotal + gst.total;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              data-testid="back-button"
              variant="outline" 
              size="sm"
              onClick={() => navigate('/invoices')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="font-heading font-black text-4xl tracking-tight text-primary">
                Create Invoice
              </h1>
              <p className="text-slate-500 mt-2">Fill in the details to generate a new invoice</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Section */}
              <div className="lg:col-span-2 space-y-6">
                {/* Client Selection */}
                <Card>
                  <CardHeader className="border-t-4 border-t-primary">
                    <CardTitle className="font-heading font-bold text-xl">Client Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Client *</Label>
                      <Select
                        value={formData.client_id}
                        onValueChange={handleClientChange}
                        required
                      >
                        <SelectTrigger data-testid="select-client-dropdown">
                          <SelectValue placeholder="Choose a client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} - {client.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedClient && (
                      <div className="p-4 bg-slate-50 rounded-sm border border-slate-200">
                        <p className="text-sm font-medium text-slate-900">{selectedClient.name}</p>
                        <p className="text-sm text-slate-600 mt-1">{selectedClient.address}</p>
                        <p className="text-sm text-slate-600">{selectedClient.state}</p>
                        <p className="text-sm text-slate-600">{selectedClient.email} | {selectedClient.phone}</p>
                        {selectedClient.gst_number && (
                          <p className="text-sm text-slate-600 font-mono mt-1">GST: {selectedClient.gst_number}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Dates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading font-bold text-xl">Invoice Dates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Invoice Date *</Label>
                        <Input
                          data-testid="invoice-date-input"
                          type="date"
                          required
                          value={formData.invoice_date}
                          onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date *</Label>
                        <Input
                          data-testid="invoice-due-date-input"
                          type="date"
                          required
                          value={formData.due_date}
                          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Line Items */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-heading font-bold text-xl">Line Items</CardTitle>
                      <Button 
                        data-testid="add-line-item-button"
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addLineItem}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.line_items.map((item, index) => (
                      <div 
                        key={index} 
                        data-testid={`line-item-${index}`}
                        className="p-4 border border-slate-200 rounded-sm space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm text-slate-900">Item {index + 1}</h4>
                          {formData.line_items.length > 1 && (
                            <Button
                              data-testid={`remove-line-item-${index}-button`}
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLineItem(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 space-y-2">
                            <Label className="text-xs">Description *</Label>
                            <Input
                              data-testid={`line-item-${index}-description`}
                              required
                              value={item.description}
                              onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                              placeholder="Service or product description"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">HSN/SAC Code *</Label>
                            <div className="flex gap-2">
                              <Input
                                data-testid={`line-item-${index}-hsn`}
                                required
                                value={item.hsn_sac_code}
                                onChange={(e) => handleLineItemChange(index, 'hsn_sac_code', e.target.value)}
                                placeholder="e.g., 998314"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => openHsnDialog(index)}
                                data-testid={`hsn-lookup-${index}`}
                              >
                                <Search className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Quantity *</Label>
                            <Input
                              data-testid={`line-item-${index}-quantity`}
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Rate (₹) *</Label>
                            <Input
                              data-testid={`line-item-${index}-rate`}
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => handleLineItemChange(index, 'rate', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Amount (₹)</Label>
                            <Input
                              data-testid={`line-item-${index}-amount`}
                              type="number"
                              readOnly
                              value={item.amount.toFixed(2)}
                              className="bg-slate-50 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading font-bold text-xl">Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      data-testid="invoice-notes-input"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any additional information or terms..."
                      rows={4}
                    />
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/invoices')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    data-testid="create-invoice-submit-button"
                    type="submit" 
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Creating...' : 'Create Invoice'}
                  </Button>
                </div>
              </div>

              {/* Preview Section */}
              <div className="lg:col-span-1">
                <Card className="sticky top-8">
                  <CardHeader className="border-t-4 border-t-accent">
                    <CardTitle className="font-heading font-bold text-xl">Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Subtotal:</span>
                        <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
                      </div>

                      {selectedClient && (
                        <>
                          <div className="pt-2 border-t border-slate-200">
                            <p className="text-xs text-slate-500 mb-2">
                              {selectedClient.state === COMPANY_INFO.state ? 'Intra-State GST (18%)' : 'Inter-State GST (18%)'}
                            </p>
                            
                            {gst.cgst > 0 && (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">CGST (9%):</span>
                                  <span className="font-mono">{formatCurrency(gst.cgst)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">SGST (9%):</span>
                                  <span className="font-mono">{formatCurrency(gst.sgst)}</span>
                                </div>
                              </>
                            )}
                            
                            {gst.igst > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">IGST (18%):</span>
                                <span className="font-mono">{formatCurrency(gst.igst)}</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      <div className="pt-2 border-t-2 border-primary">
                        <div className="flex justify-between">
                          <span className="font-heading font-bold text-lg">Total:</span>
                          <span className="font-heading font-black text-2xl text-primary">{formatCurrency(total)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 text-xs text-slate-500">
                      <p className="font-medium mb-2">Company Details:</p>
                      <p>{COMPANY_INFO.name}</p>
                      <p>GSTIN: {COMPANY_INFO.gstin}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>

          {/* HSN/SAC Code Lookup Dialog */}
          <Dialog open={hsnDialogOpen} onOpenChange={setHsnDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="font-heading font-bold text-xl">
                  Search HSN/SAC Codes
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <Input
                  data-testid="hsn-search-input"
                  placeholder="Search by code or description..."
                  value={hsnSearchQuery}
                  onChange={(e) => setHsnSearchQuery(e.target.value)}
                  autoFocus
                />
                
                <div className="max-h-96 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHsnCodes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                            {hsnSearchQuery ? 'No matching codes found' : 'Start typing to search...'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredHsnCodes.map((code, idx) => (
                          <TableRow 
                            key={idx}
                            className="cursor-pointer hover:bg-slate-50"
                            onClick={() => selectHsnCode(code)}
                          >
                            <TableCell className="font-mono font-medium">{code.HSN_CD}</TableCell>
                            <TableCell className="text-sm">{code.HSN_Description}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost">Select</Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {filteredHsnCodes.length === 100 && (
                  <p className="text-xs text-slate-500 text-center">
                    Showing first 100 results. Refine your search for more specific results.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
