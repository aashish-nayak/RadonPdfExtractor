import { InvoiceRecord } from '@/types/invoice';

export async function parsePDF(file: File): Promise<InvoiceRecord | null> {
    try {
        const text = await extractTextFromPDF(file);

        // Determine document type
        const isCreditNote = text.includes('CREDIT NOTE') || text.includes('CN-');
        const isSalesOrder = text.includes('Tax Invoice') || text.includes('Invoice#');

        if (isCreditNote) {
            return parseCreditNote(text, file.name);
        } else if (isSalesOrder) {
            return parseSalesOrder(text, file.name);
        }

        return null;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        return null;
    }
}

async function extractTextFromPDF(file: File): Promise<string> {
    // Using PDF.js library for client-side PDF parsing
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // @ts-expect-error - pdfjs-dist will be loaded from CDN
    const pdfjsLib = window.pdfjsLib;
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: { str: string }) => item.str).join(' ');
        fullText += pageText + '\n';
    }

    return fullText;
}

function parseSalesOrder(text: string, fileName: string): InvoiceRecord {
    // Extract Invoice Date
    const invoiceDateMatch = text.match(/Invoice Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/);
    const date = invoiceDateMatch ? invoiceDateMatch[1] : '';

    // Extract P.O.# and Invoice# for Invoice Number format: P.O.# / Invoice#
    const poNumberMatch = text.match(/P\.O\.#\s*:\s*([^\s]+)/);
    const poNumber = poNumberMatch ? poNumberMatch[1] : '';

    const invoiceNumMatch = text.match(/Invoice#\s*:\s*([^\s]+)/);
    const invoiceNum = invoiceNumMatch ? invoiceNumMatch[1] : '';

    const invoiceNumber = `${poNumber} / ${invoiceNum}`;


    // Extract Client Name (Bill To section)
    const clientNameMatch = text.match(/Bill To\s+([^\n]+)/);
    let clientName = clientNameMatch ? clientNameMatch[1].trim() : '';

    // Clean up client name (remove extra info)
    if (clientName) {
        clientName = clientName.split(/\d{10}/)[0].trim(); // Remove phone numbers
    }

    // Extract Customer Number (phone number after Bill To)
    const numberMatch = text.match(/Bill To[^]*?(\d{10})/);
    const number = numberMatch ? numberMatch[1] : '';

    // Extract Product Line (from items - first item description)
    const productLineMatch = text.match(/Item & Description\s+[^]*?([A-Z0-9\s]+)/);
    // const productLine = productLineMatch ? productLineMatch[1].trim().split('\n')[0] : 'TILES';
    const productLine = 'TILES';

    // Extract Discount
    const discountMatch = text.match(/Discount\((\d+\.?\d*)%\)/);
    const discOffered = discountMatch ? discountMatch[1] + '%' : '0%';

    // Extract Total Amount
    const subTotalMatch = text.match(/Sub Total\s+([\d,]+\.?\d*)/);
    const subAmount = subTotalMatch ? parseFloat(subTotalMatch[1].replace(/,/g, '')) : 0;

    // Calculate discounted amount
    const discountedAmount = subAmount * (1 - (parseFloat(discOffered) / 100));
    const amount = parseFloat(discountedAmount.toFixed(2));

    return {
        id: crypto.randomUUID(),
        date,
        clientName,
        number,
        productLine,
        discOffered,
        voucherType: 'Sales',
        invoiceNumber,
        amount,
        soldBy: '',
        source: '',
        sourceName: '',
        saleType: '',
        fileName
    };
}

function parseCreditNote(text: string, fileName: string): InvoiceRecord {
    // Extract Credit Date (use as Date)
    const creditDateMatch = text.match(/Credit Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/);
    const date = creditDateMatch ? creditDateMatch[1] : '';

    // Extract # (CN number) and Invoice# for Invoice Number format: # / Invoice#
    const cnNumberMatch = text.match(/#\s*:\s*([^\s]+)/);
    const cnNumber = cnNumberMatch ? cnNumberMatch[1].replace('/JGT', '') : '';

    const invoiceNumMatch = text.match(/Invoice#\s*:\s*([^\s]+)/);
    const invoiceNum = invoiceNumMatch ? invoiceNumMatch[1] : '';

    const invoiceNumber = `${cnNumber} / ${invoiceNum}`;

    // Extract Client Name (Bill To section)
    const clientNameMatch = text.match(/Bill To\s+([^\n]+)/);
    let clientName = clientNameMatch ? clientNameMatch[1].trim() : '';

    // Clean up client name
    if (clientName) {
        clientName = clientName.split('GHODA')[0].trim();
    }

    // Extract Customer Number (if available)
    const numberMatch = text.match(/(\d{10})/);
    const number = numberMatch ? numberMatch[1] : '';

    // Extract Product Line
    const productLineMatch = text.match(/Item & Description\s+[^]*?([A-Z0-9\s]+)/);
    // const productLine = productLineMatch ? productLineMatch[1].trim().split('\n')[0] : 'TILES';
    const productLine = 'TILES';

    // Extract Discount    
    const discountMatch = text.match(/Discount\((\d+\.?\d*)%\)/);
    const discOffered = discountMatch ? discountMatch[1] + '%' : '0%';

    // Extract Total Amount
    const subTotalMatch = text.match(/Sub Total\s+([\d,]+\.?\d*)/);
    const subAmount = subTotalMatch ? parseFloat(subTotalMatch[1].replace(/,/g, '')) : 0;

    // Calculate discounted amount
    const discountedAmount = subAmount * (1 - (parseFloat(discOffered) / 100));
    const amount = parseFloat(discountedAmount.toFixed(2));

    return {
        id: crypto.randomUUID(),
        date,
        clientName,
        number,
        productLine,
        discOffered,
        voucherType: 'CN',
        invoiceNumber,
        amount,
        soldBy: '',
        source: '',
        sourceName: '',
        saleType: '',
        fileName
    };
}