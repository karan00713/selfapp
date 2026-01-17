import { useState, useEffect } from 'react';
import api from '@/lib/electronAPI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sidebar } from '@/components/Sidebar';
import { Landmark, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BankDetailsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    account_name: '',
    bank_name: '',
    account_number: '',
    branch: '',
    ifsc_code: '',
  });

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const data = await api.getBankDetails();
      if (data && data.account_name) {
        setFormData({
          account_name: data.account_name || '',
          bank_name: data.bank_name || '',
          account_number: data.account_number || '',
          branch: data.branch || '',
          ifsc_code: data.ifsc_code || '',
        });
      }
    } catch (error) {
      console.error('Failed to load bank details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.saveBankDetails(formData);
      toast.success('Bank details saved successfully');
    } catch (error) {
      toast.error('Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
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
        <div className="max-w-3xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading font-black text-4xl tracking-tight text-primary">
              Bank Details
            </h1>
            <p className="text-slate-500 mt-2">
              Configure your bank account details. These will be displayed on all invoices.
            </p>
          </div>

          <Card>
            <CardHeader className="border-t-4 border-t-primary">
              <CardTitle className="font-heading font-bold text-xl flex items-center gap-2">
                <Landmark className="w-5 h-5" />
                Bank Account Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Account Name *</Label>
                    <Input
                      data-testid="bank-account-name"
                      required
                      value={formData.account_name}
                      onChange={(e) => handleChange('account_name', e.target.value)}
                      placeholder="e.g., DeepByte Verxe LLP"
                    />
                    <p className="text-xs text-slate-500">Name as per bank records</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Bank Name *</Label>
                    <Input
                      data-testid="bank-name"
                      required
                      value={formData.bank_name}
                      onChange={(e) => handleChange('bank_name', e.target.value)}
                      placeholder="e.g., State Bank of India"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Account Number *</Label>
                    <Input
                      data-testid="bank-account-number"
                      required
                      value={formData.account_number}
                      onChange={(e) => handleChange('account_number', e.target.value)}
                      placeholder="e.g., 1234567890123456"
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Branch *</Label>
                    <Input
                      data-testid="bank-branch"
                      required
                      value={formData.branch}
                      onChange={(e) => handleChange('branch', e.target.value)}
                      placeholder="e.g., Madurai Main Branch"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>IFSC Code *</Label>
                    <Input
                      data-testid="bank-ifsc"
                      required
                      value={formData.ifsc_code}
                      onChange={(e) => handleChange('ifsc_code', e.target.value.toUpperCase())}
                      placeholder="e.g., SBIN0001234"
                      className="font-mono uppercase"
                      maxLength={11}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t">
                  <Button
                    data-testid="save-bank-details-button"
                    type="submit"
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Bank Details'}
                  </Button>
                  
                  {formData.account_number && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Bank details configured</span>
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preview Card */}
          {formData.account_name && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="font-heading font-bold text-lg">Preview (as shown on invoices)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-slate-50 rounded-sm border border-slate-200">
                  <h4 className="font-bold text-sm text-slate-900 mb-3">Bank Details:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-600">Account Name:</span>
                    <span className="font-medium">{formData.account_name}</span>
                    
                    <span className="text-slate-600">Bank Name:</span>
                    <span className="font-medium">{formData.bank_name}</span>
                    
                    <span className="text-slate-600">Account Number:</span>
                    <span className="font-mono font-medium">{formData.account_number}</span>
                    
                    <span className="text-slate-600">Branch:</span>
                    <span className="font-medium">{formData.branch}</span>
                    
                    <span className="text-slate-600">IFSC Code:</span>
                    <span className="font-mono font-medium">{formData.ifsc_code}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
