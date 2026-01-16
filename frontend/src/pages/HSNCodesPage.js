import { useState, useEffect } from 'react';
import api from '@/lib/electronAPI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Sidebar } from '@/components/Sidebar';
import { BookOpen, Search } from 'lucide-react';

export default function HSNCodesPage() {
  const [hsnCodes, setHsnCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHSNCodes();
  }, []);

  const fetchHSNCodes = async () => {
    try {
      const data = await api.getHSNCodes();
      setHsnCodes(data);
    } catch (error) {
      console.error('Failed to load HSN codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCodes = hsnCodes.filter(code => 
    code.HSN_CD.toLowerCase().includes(searchQuery.toLowerCase()) ||
    code.HSN_Description.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 200); // Show more on dedicated page

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
          <div className="mb-8">
            <h1 className="font-heading font-black text-4xl tracking-tight text-primary">
              HSN/SAC Codes
            </h1>
            <p className="text-slate-500 mt-2">
              Search and browse HSN (Harmonized System of Nomenclature) and SAC (Service Accounting Codes) for GST
            </p>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  data-testid="hsn-page-search-input"
                  placeholder="Search by code or description (e.g., '998314' or 'software')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Total codes available: {hsnCodes.length.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {/* HSN Codes Table */}
          <Card>
            <CardHeader className="border-t-4 border-t-primary">
              <CardTitle className="font-heading font-bold text-xl flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                HSN/SAC Code Reference
                {searchQuery && ` - ${filteredCodes.length} results`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredCodes.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">
                    {searchQuery ? 'No matching codes found' : 'Start typing to search codes'}
                  </p>
                  <p className="text-sm mt-1">Try searching with a different term</p>
                </div>
              ) : (
                <>
                  <div className="max-h-[600px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-32 sticky top-0 bg-white">Code</TableHead>
                          <TableHead className="sticky top-0 bg-white">Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCodes.map((code, idx) => (
                          <TableRow key={idx} data-testid={`hsn-row-${idx}`}>
                            <TableCell className="font-mono font-medium text-primary">
                              {code.HSN_CD}
                            </TableCell>
                            <TableCell className="text-sm">
                              {code.HSN_Description}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {filteredCodes.length === 200 && (
                    <p className="text-xs text-slate-500 text-center mt-4 pt-4 border-t">
                      Showing first 200 results. Refine your search for more specific results.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Common IT Services HSN Codes */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="font-heading font-bold text-xl">
                Common IT Service SAC Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-sm border">
                  <p className="font-mono font-bold text-primary">998314</p>
                  <p className="text-sm text-slate-600 mt-1">IT design and development services</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-sm border">
                  <p className="font-mono font-bold text-primary">998315</p>
                  <p className="text-sm text-slate-600 mt-1">Hosting and IT infrastructure provisioning services</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-sm border">
                  <p className="font-mono font-bold text-primary">998316</p>
                  <p className="text-sm text-slate-600 mt-1">IT infrastructure and network management services</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-sm border">
                  <p className="font-mono font-bold text-primary">998319</p>
                  <p className="text-sm text-slate-600 mt-1">Other IT consulting and support services</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-sm border">
                  <p className="font-mono font-bold text-primary">998313</p>
                  <p className="text-sm text-slate-600 mt-1">Software consultancy services</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-sm border">
                  <p className="font-mono font-bold text-primary">998312</p>
                  <p className="text-sm text-slate-600 mt-1">Software originals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
