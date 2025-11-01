import * as XLSX from 'xlsx';
import { InvoiceRecord } from '@/types/invoice';

export function generateExcel(records: InvoiceRecord[], fileName: string = 'invoice_data.xlsx') {
    // Prepare data for Excel with all columns
    const excelData = records.map(record => ({
        'Date': record.date,
        'Sold By': record.soldBy,
        'Client Name': record.clientName,
        'Number': record.number,
        'Source': record.source,
        'Source NAME': record.sourceName,
        'Product Line': record.productLine,
        'Sale Type': record.saleType,
        'Disc Offered %': record.discOffered,
        'Voucher Type': record.voucherType,
        'Invoice Number': record.invoiceNumber,
        'AMOUNT': record.amount
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
        { wch: 12 }, // Date
        { wch: 20 }, // Sold By
        { wch: 30 }, // Client Name
        { wch: 15 }, // Number
        { wch: 15 }, // Source
        { wch: 20 }, // Source NAME
        { wch: 20 }, // Product Line
        { wch: 12 }, // Sale Type
        { wch: 15 }, // Disc Offered %
        { wch: 15 }, // Voucher Type
        { wch: 20 }, // Invoice Number
        { wch: 15 }  // AMOUNT
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice Data');

    // Generate and download file
    XLSX.writeFile(workbook, fileName);
}

export function generateFilteredExcel(
    records: InvoiceRecord[],
    filters: { voucherType?: string; searchText?: string },
    fileName: string = 'filtered_invoice_data.xlsx'
) {
    let filteredRecords = [...records];

    // Apply type filter
    if (filters.voucherType && filters.voucherType !== 'All') {
        filteredRecords = filteredRecords.filter(r => r.voucherType === filters.voucherType);
    }

    // Apply search filter
    if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        filteredRecords = filteredRecords.filter(r =>
            r.clientName.toLowerCase().includes(searchLower) ||
            r.number.includes(searchLower) ||
            r.date.includes(searchLower) ||
            r.invoiceNumber.toLowerCase().includes(searchLower) ||
            r.soldBy.toLowerCase().includes(searchLower)
        );
    }

    generateExcel(filteredRecords, fileName);
}