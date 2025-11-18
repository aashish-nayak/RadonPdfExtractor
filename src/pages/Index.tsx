import { useState, useEffect } from 'react';
import { InvoiceRecord } from '@/types/invoice';
import { parsePDF } from '@/lib/pdfParser';
import { generateExcel, generateFilteredExcel } from '@/lib/excelGenerator';
import { FileUpload } from '@/components/FileUpload';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Search, FileSpreadsheet, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Store PDF files in memory with their URLs
const pdfFileStore = new Map<string, string>();

type SortField = 'date' | 'clientName' | 'amount' | 'invoiceNumber';
type SortOrder = 'asc' | 'desc';

export default function Index() {
  const [records, setRecords] = useState<InvoiceRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      pdfFileStore.forEach(url => URL.revokeObjectURL(url));
      pdfFileStore.clear();
    };
  }, []);

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    const newRecords: InvoiceRecord[] = [];

    for (const file of files) {
      try {
        const record = await parsePDF(file);
        if (record) {
          // Create a blob URL for the PDF file
          const blobUrl = URL.createObjectURL(file);
          pdfFileStore.set(record.fileName, blobUrl);
          
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

  const handleDeleteRecord = (id: string) => {
    const record = records.find(r => r.id === id);
    if (record) {
      // Revoke the blob URL for the deleted record
      const blobUrl = pdfFileStore.get(record.fileName);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        pdfFileStore.delete(record.fileName);
      }
      
      setRecords(records.filter(r => r.id !== id));
      toast.success('Record deleted');
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm(`Are you sure you want to delete all ${records.length} records?`)) {
      // Revoke all blob URLs
      pdfFileStore.forEach(url => URL.revokeObjectURL(url));
      pdfFileStore.clear();
      
      setRecords([]);
      toast.success('All records deleted');
    }
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

  // Parse date string (DD/MM/YYYY) to Date object
  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date(0);
    // Month is 0-indexed in JavaScript Date
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  // Apply filters and sorting
  const filteredRecords = records
    .filter(record => {
      // Type filter
      const matchesType = filterType === 'All' || record.voucherType === filterType;
      
      // Search filter
      const matchesSearch = !searchText ||
        record.clientName.toLowerCase().includes(searchText.toLowerCase()) ||
        record.number.includes(searchText) ||
        record.date.includes(searchText) ||
        record.invoiceNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        record.soldBy.toLowerCase().includes(searchText.toLowerCase());
      
      // Date range filter
      let matchesDateRange = true;
      if (dateFrom || dateTo) {
        const recordDate = parseDate(record.date);
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          matchesDateRange = matchesDateRange && recordDate >= fromDate;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999); // Include the entire end date
          matchesDateRange = matchesDateRange && recordDate <= toDate;
        }
      }
      
      return matchesType && matchesSearch && matchesDateRange;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = parseDate(a.date).getTime() - parseDate(b.date).getTime();
          break;
        case 'clientName':
          comparison = a.clientName.localeCompare(b.clientName);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'invoiceNumber':
          comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const totalSales = records
    .filter(r => r.voucherType === 'Sales')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalCN = records
    .filter(r => r.voucherType === 'CN')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalRMA = records
    .filter(r => r.voucherType === 'RMA')
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
            Extract data from Sales Orders, Credit Notes, and RMA Documents
          </p>
        </div>

        {/* File Upload */}
        <FileUpload onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />

        {/* Statistics */}
        {records.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <CardDescription>RMA Returns</CardDescription>
                <CardTitle className="text-3xl text-orange-600">
                  {records.filter(r => r.voucherType === 'RMA').length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Net Total</CardDescription>
                <CardTitle className="text-3xl">₹{(totalSales - totalCN - totalRMA).toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        {records.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Records Preview</CardTitle>
              <CardDescription>Search, filter, sort, and edit your records before exporting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* First Row: Search and Type Filter */}
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
                    <SelectItem value="RMA">RMA Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Second Row: Date Range and Sort Options */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex gap-2 items-center">
                  <label className="text-sm font-medium whitespace-nowrap">Date Range:</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-[150px]"
                    placeholder="From"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-[150px]"
                    placeholder="To"
                  />
                </div>
                
                <div className="flex gap-2 items-center">
                  <label className="text-sm font-medium whitespace-nowrap">Sort By:</label>
                  <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="clientName">Client Name</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="invoiceNumber">Invoice Number</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Third Row: Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleExportFiltered} variant="outline">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export Filtered
                </Button>
                <Button 
                  onClick={handleDeleteAll} 
                  variant="destructive"
                  disabled={records.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All Records
                </Button>
              </div>

              <DataTable 
                records={filteredRecords} 
                onUpdateRecord={handleUpdateRecord}
                onDeleteRecord={handleDeleteRecord}
              />

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

// Export the pdfFileStore for use in DataTable
export { pdfFileStore };