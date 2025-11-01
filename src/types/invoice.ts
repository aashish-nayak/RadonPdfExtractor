export interface InvoiceRecord {
    id: string;
    date: string;
    clientName: string;
    number: string;
    productLine: string;
    discOffered: string;
    voucherType: string;
    invoiceNumber: string;
    amount: number;
    // Editable fields
    soldBy: string;
    source: string;
    sourceName: string;
    saleType: string;
    fileName: string;
}

export interface ParsedPDFData {
    text: string;
    fileName: string;
}