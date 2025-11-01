import { useState } from 'react';
import { InvoiceRecord } from '@/types/invoice';
import { parsePDF } from '@/lib/pdfParser';
import { generateExcel, generateFilteredExcel } from '@/lib/excelGenerator';
import { FileUpload } from '@/components/FileUpload';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Search, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export default function Index() {
  const [records, setRecords] = useState<InvoiceRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    const newRecords: InvoiceRecord[] = [];

    for (const file of files) {
      try {
        const record = await parsePDF(file);
        if (record) {
          newRecords.push(record);
          toast.success(`Parsed: ${file.name}`);
        } else {
          toast.error(`Failed to parse: ${file.name}`);
        }
      } catch (error) {
        toast.error(`Error processing: ${file.name}`);
        console.error(error);
      }
    }

    setRecords([...records, ...newRecords]);
    setIsProcessing(false);

    if (newRecords.length > 0) {
      toast.success(`Successfully processed ${newRecords.length} file(s)`);
    }
  };

  const handleUpdateRecord = (id: string, updates: Partial<InvoiceRecord>) => {
    setRecords(records.map(r => r.id === id ? { ...r, ...updates } : r));
    toast.success('Record updated');
  };

  const handleExportAll = () => {
    if (records.length === 0) {
      toast.error('No records to export');
      return;
    }
    generateExcel(records);
    toast.success('Excel file downloaded');
  };

  const handleExportFiltered = () => {
    if (filteredRecords.length === 0) {
      toast.error('No records match the current filters');
      return;
    }
    generateFilteredExcel(records, { voucherType: filterType, searchText });
    toast.success('Filtered Excel file downloaded');
  };

  // Apply filters
  const filteredRecords = records.filter(record => {
    const matchesType = filterType === 'All' || record.voucherType === filterType;
    const matchesSearch = !searchText ||
      record.clientName.toLowerCase().includes(searchText.toLowerCase()) ||
      record.number.includes(searchText) ||
      record.date.includes(searchText) ||
      record.invoiceNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      record.soldBy.toLowerCase().includes(searchText.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalSales = records
    .filter(r => r.voucherType === 'Sales')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalCN = records
    .filter(r => r.voucherType === 'CN')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            PDF to Excel Converter
          </h1>
          <p className="text-muted-foreground">
            Extract data from Sales Orders and Credit Notes
          </p>
        </div>

        {/* File Upload */}
        <FileUpload onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />

        {/* Statistics */}
        {records.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Records</CardDescription>
                <CardTitle className="text-3xl">{records.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Sales Orders</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {records.filter(r => r.voucherType === 'Sales').length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Credit Notes</CardDescription>
                <CardTitle className="text-3xl text-red-600">
                  {records.filter(r => r.voucherType === 'CN').length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Net Total</CardDescription>
                <CardTitle className="text-3xl">₹{(totalSales - totalCN).toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        {records.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Records Preview</CardTitle>
              <CardDescription>Search, filter, and edit your records before exporting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by client name, number, invoice number, or sold by..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Types</SelectItem>
                    <SelectItem value="Sales">Sales Only</SelectItem>
                    <SelectItem value="CN">Credit Notes Only</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleExportFiltered} variant="outline">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export Filtered
                </Button>
              </div>

              <DataTable records={filteredRecords} onUpdateRecord={handleUpdateRecord} />

              <div className="flex justify-between items-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredRecords.length} of {records.length} records
                </p>
                <Button onClick={handleExportAll} size="lg" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export All to Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}