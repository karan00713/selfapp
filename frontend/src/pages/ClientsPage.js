import { useState, useEffect } from 'react';
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
  DialogTrigger,
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
import { Plus, Pencil, Trash2, Building2, User } from 'lucide-react';
import { toast } from 'sonner';
import { INDIAN_STATES } from '@/lib/constants';

const initialFormState = {
  client_type: 'individual',
  name: '',
  address: '',
  state: '',
  phone: '',
  email: '',
  aadhar_number: '',
  pan_number: '',
  cin: '',
  gst_number: '',
};

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const data = await api.getClients();
      setClients(data);
    } catch (error) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingClient) {
        await api.updateClient(editingClient.id, formData);
        toast.success('Client updated successfully');
      } else {
        await api.createClient(formData);
        toast.success('Client created successfully');
      }
      
      setDialogOpen(false);
      setFormData(initialFormState);
      setEditingClient(null);
      fetchClients();
    } catch (error) {
      toast.error(error.message || 'Failed to save client');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      client_type: client.client_type,
      name: client.name,
      address: client.address,
      state: client.state,
      phone: client.phone,
      email: client.email,
      aadhar_number: client.aadhar_number || '',
      pan_number: client.pan_number || '',
      cin: client.cin || '',
      gst_number: client.gst_number || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await api.deleteClient(clientId);
        toast.success('Client deleted successfully');
        fetchClients();
      } catch (error) {
        toast.error('Failed to delete client');
      }
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingClient(null);
    setFormData(initialFormState);
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  );

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
                Clients
              </h1>
              <p className="text-slate-500 mt-2">Manage your clients and their information</p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-client-button" onClick={() => { setEditingClient(null); setFormData(initialFormState); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-heading font-bold text-2xl">
                    {editingClient ? 'Edit Client' : 'Add New Client'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                  {/* Client Type */}
                  <div className="space-y-2">
                    <Label>Client Type *</Label>
                    <Select
                      value={formData.client_type}
                      onValueChange={(value) => setFormData({ ...formData, client_type: value })}
                    >
                      <SelectTrigger data-testid="client-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Individual
                          </div>
                        </SelectItem>
                        <SelectItem value="organization">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Organization
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Name *</Label>
                      <Input
                        data-testid="client-name-input"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={formData.client_type === 'individual' ? 'Full Name' : 'Company Name'}
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label>Address *</Label>
                      <Input
                        data-testid="client-address-input"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Complete address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>State *</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) => setFormData({ ...formData, state: value })}
                      >
                        <SelectTrigger data-testid="client-state-select">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Phone *</Label>
                      <Input
                        data-testid="client-phone-input"
                        required
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91-XXXXXXXXXX"
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label>Email *</Label>
                      <Input
                        data-testid="client-email-input"
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  {/* Type-specific fields */}
                  {formData.client_type === 'individual' ? (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>Aadhar Number</Label>
                        <Input
                          data-testid="client-aadhar-input"
                          value={formData.aadhar_number}
                          onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })}
                          placeholder="XXXX XXXX XXXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>PAN Number</Label>
                        <Input
                          data-testid="client-pan-input"
                          value={formData.pan_number}
                          onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                          placeholder="XXXXXXXXXX"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>CIN</Label>
                        <Input
                          data-testid="client-cin-input"
                          value={formData.cin}
                          onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                          placeholder="Corporate Identification Number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>PAN Number</Label>
                        <Input
                          data-testid="client-org-pan-input"
                          value={formData.pan_number}
                          onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                          placeholder="XXXXXXXXXX"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>GST Number</Label>
                        <Input
                          data-testid="client-gst-input"
                          value={formData.gst_number}
                          onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                          placeholder="GST Registration Number"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button data-testid="save-client-button" type="submit" disabled={submitting} className="flex-1">
                      {submitting ? 'Saving...' : (editingClient ? 'Update Client' : 'Create Client')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <Input
                data-testid="client-search-input"
                placeholder="Search clients by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </CardContent>
          </Card>

          {/* Clients Table */}
          <Card>
            <CardHeader className="border-t-4 border-t-primary">
              <CardTitle className="font-heading font-bold text-xl">
                All Clients ({filteredClients.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredClients.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No clients found</p>
                  <p className="text-sm mt-1">Add your first client to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>GST/PAN</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id} data-testid={`client-row-${client.id}`}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-medium ${
                            client.client_type === 'organization' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {client.client_type === 'organization' ? (
                              <Building2 className="w-3 h-3" />
                            ) : (
                              <User className="w-3 h-3" />
                            )}
                            {client.client_type}
                          </span>
                        </TableCell>
                        <TableCell>{client.state}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{client.email}</p>
                            <p className="text-slate-500">{client.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {client.gst_number || client.pan_number || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              data-testid={`edit-client-${client.id}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(client)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              data-testid={`delete-client-${client.id}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(client.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
