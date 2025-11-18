import * as XLSX from 'xlsx';
import { InvoiceRecord } from '@/types/invoice';

interface ExcelRow {
    'Date'?: string;
    'Sold By'?: string;
    'Client Name'?: string;
    'Number'?: string;
    'Source'?: string;
    'Source NAME'?: string;
    'Product Line'?: string;
    'Sale Type'?: string;
    'Disc Offered %'?: string;
    'Voucher Type'?: string;
    'Invoice Number'?: string;
    'AMOUNT'?: number | string;
}

export async function importExcelFile(file: File): Promise<InvoiceRecord[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                
                // Get the first sheet
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);
                
                // Map Excel data to InvoiceRecord format
                const records: InvoiceRecord[] = jsonData.map((row) => ({
                    id: crypto.randomUUID(),
                    date: row['Date'] || '',
                    soldBy: row['Sold By'] || '',
                    clientName: row['Client Name'] || '',
                    number: row['Number'] || '',
                    source: row['Source'] || '',
                    sourceName: row['Source NAME'] || '',
                    productLine: row['Product Line'] || '',
                    saleType: row['Sale Type'] || '',
                    discOffered: row['Disc Offered %'] || '',
                    voucherType: row['Voucher Type'] || '',
                    invoiceNumber: row['Invoice Number'] || '',
                    amount: parseFloat(String(row['AMOUNT'] || 0)) || 0,
                    fileName: `Imported from ${file.name}`
                }));

                resolve(records);
            } catch (error) {
                console.error('Error parsing Excel file:', error);
                reject(new Error('Failed to parse Excel file. Please ensure it matches the export format.'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read Excel file'));
        };

        reader.readAsBinaryString(file);
    });
}