/* eslint-disable no-useless-escape */
/* eslint-disable prefer-const */
// eslint-disable no-useless-escape
import { InvoiceRecord } from '@/types/invoice';

export async function parsePDF(file: File): Promise<InvoiceRecord | null> {
    try {
        const text = await extractTextFromPDF(file);

        // Determine document type
        const isCreditNote = text.includes('CREDIT NOTE') || text.includes('CN-');
        const isSalesOrder = text.includes('Tax Invoice') || text.includes('Invoice#') || text.includes('Sales Order') || text.includes('Sales Order#');
        const isRMA = text.includes('SALES RETURN') || text.includes('RMA#') || text.includes('RMA-');

        if (isRMA) {
            return parseRMA(text, file.name);
        } else if (isCreditNote) {
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
    let invoiceDateMatch = text.match(/Invoice Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/);
    let date = invoiceDateMatch ? invoiceDateMatch[1] : '';

    if (date == '') {
        invoiceDateMatch = text.match(/Order Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/);
        date = invoiceDateMatch ? invoiceDateMatch[1] : '';
    }

    // Extract P.O.# and Invoice# for Invoice Number format: P.O.# / Invoice#
    let poNumberMatch = text.match(/P\.O\.#\s*:\s*([^\s]+)/);
    let poNumber = poNumberMatch ? poNumberMatch[1] : '';

    const invoiceNumMatch = text.match(/Invoice#\s*:\s*([^\s]+)/);
    const invoiceNum = invoiceNumMatch ? invoiceNumMatch[1] : '';

    if (poNumber == '') {
        poNumberMatch = text.match(/Sales Order#\s*:\s*([^\s]+)/);
        poNumber = poNumberMatch ? poNumberMatch[1] : '';
    }

    const invoiceNumber = `${poNumber} / ${invoiceNum}`;


    const {name,phone} = extractClientNameAndPhone(text);
    // Extract Client Name (Bill To section)
    const clientName = name;
    // Extract Customer Number (phone number after Bill To)
    const number = phone;

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

    // Calculate Shipping Charge Aount
    const shippingCharge = getShippingCharge(text);
    const finalAmount = parseFloat((amount - shippingCharge).toFixed(2));
    const roundedAmount = Math.round(finalAmount);

    return {
        id: crypto.randomUUID(),
        date,
        clientName,
        number,
        productLine,
        discOffered,
        voucherType: 'Sales',
        invoiceNumber,
        amount : roundedAmount,
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

    const {name,phone} = extractClientNameAndPhone(text);
    // Extract Client Name (Bill To section)
    const clientName = name;
    // Extract Customer Number (phone number after Bill To)
    const number = phone;

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

    // Calculate Shipping Charge Aount
    const shippingCharge = getShippingCharge(text);
    const finalAmount = parseFloat((amount - shippingCharge).toFixed(2));
    const roundedAmount = Math.round(finalAmount);

    return {
        id: crypto.randomUUID(),
        date,
        clientName,
        number,
        productLine,
        discOffered,
        voucherType: 'CN',
        invoiceNumber,
        amount : roundedAmount,
        soldBy: '',
        source: '',
        sourceName: '',
        saleType: '',
        fileName
    };
}

function parseRMA(text: string, fileName: string): InvoiceRecord {
    // Extract Date
    const dateMatch = text.match(/Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/);
    const date = dateMatch ? dateMatch[1] : '';

    // Extract RMA Number (e.g., RMA-00169)
    const rmaNumberMatch = text.match(/RMA#\s*(RMA-\d+)/);
    const rmaNumber = rmaNumberMatch ? rmaNumberMatch[1] : '';

    // For RMA, invoice number is just the RMA number
    const invoiceNumber = rmaNumber;

    // Extract Client Name (Bill To section)
    const {name,phone} = extractClientNameAndPhone(text);

    // Extract Client Name (Bill To section)
    const clientName = name;
    // Extract Customer Number (phone number after Bill To)
    const number = phone;

    // Extract Product Line - default to TILES for now
    const productLine = 'TILES';

    // RMA documents typically don't have discounts, but check anyway
    const discountMatch = text.match(/Discount\((\d+\.?\d*)%\)/);
    const discOffered = discountMatch ? discountMatch[1] + '%' : '0%';

    // Extract Total Amount
    // Try to get "Total" first, if not available, use "Sub Total"
    let amount = 0;
    const subTotalMatch = text.match(/Sub Total\s+([\d,]+\.?\d*)/);
    if (subTotalMatch) {
        amount = parseFloat(subTotalMatch[1].replace(/,/g, ''));
    } else {
        const totalMatch = text.match(/Total\s+([\d,]+\.?\d*)/);
        if (totalMatch) {
            const subAmount = parseFloat(totalMatch[1].replace(/,/g, ''));
            // Calculate discounted amount if discount exists
            const discountedAmount = subAmount * (1 - (parseFloat(discOffered) / 100));
            amount = parseFloat(discountedAmount.toFixed(2));
        }
    }

    // Calculate Shipping Charge Aount
    const shippingCharge = getShippingCharge(text);
    const finalAmount = parseFloat((amount - shippingCharge).toFixed(2));
    const roundedAmount = Math.round(finalAmount);

    return {
        id: crypto.randomUUID(),
        date,
        clientName,
        number,
        productLine,
        discOffered,
        voucherType: 'RMA',
        invoiceNumber,
        amount : roundedAmount,
        soldBy: '',
        source: '',
        sourceName: '',
        saleType: '',
        fileName
    };
}

function getShippingCharge(text: string): number {
    // Normalize spacing
    const clean = text.replace(/\s+/g, " ");

    // Find the part after Shipping charge
    const index = clean.toLowerCase().indexOf("shipping charge");
    if (index === -1) return 0;

    // Extract next 200 chars
    const fragment = clean.substring(index, index + 200);

    // Pattern: SAC: XXXXXXX <SPACE> 800.00
    // So extract the FIRST number that appears AFTER the SAC code.
    const match = fragment.match(/SAC[: ]\s*\d+\s+([\d,]+\.?\d*)/i);

    if (match && match[1]) {
        return parseFloat(match[1].replace(/,/g, ""));
    }

    // Fallback: pick LAST number (if SAC missing)
    const nums = [...fragment.matchAll(/([\d,]+\.?\d*)/g)];
    if (nums.length) {
        return parseFloat(nums[nums.length - 1][1].replace(/,/g, ""));
    }

    return 0;
}

function extractClientNameAndPhone(text: string): { name: string, phone: string } {
    // Normalize text
    const clean = text.replace(/\s+/g, " ").trim();

    // ---- 1. Locate Bill To / Ship To ----
    let idx = clean.toLowerCase().indexOf("bill to");
    let label = "bill to";

    if (idx === -1) {
        idx = clean.toLowerCase().indexOf("ship to");
        label = "ship to";
    }
    if (idx === -1) return { name: "", phone: "" };

    // Extract next chunk
    let block = clean.substring(idx + label.length, idx + 200).trim();

    // ---- Remove literal words SHIP / TO inside name ----
    block = block.replace(/\bship\b/gi, "").replace(/\bto\b/gi, "").trim();

    // ---- 2. Extract Phone Number ----
    const phoneMatch = block.match(/(\d{10})/);
    const phone = phoneMatch ? phoneMatch[1] : "";

    if (phone) block = block.replace(phone, "").trim();

    // Remove brackets (like: (866...) )
    block = block.replace(/[\(\)]/g, " ").trim();

    // ---- 3. Detect Prefix ----
    let prefix = "";
    const prefixMatch = block.match(/^(mr|mrs|ms|shri|smt)\.?/i);

    if (prefixMatch) {
        prefix = prefixMatch[1].toUpperCase() + ".";
        block = block.replace(/^(mr|mrs|ms|shri|smt)\.?/i, "").trim();
    }

    // ---- 4. Extract name tokens ----
    const tokens = block.split(" ");
    let nameParts: string[] = [];

    for (let w of tokens) {
        if (!w) continue;

        // Stop if word is address-like
        if (/^\d/.test(w)) break;
        if (/^(opposite|road|sector|nagar|lane|street|plot|colony|jaipur|rajasthan|india)$/i.test(w)) break;

        nameParts.push(w);

        if (nameParts.length >= 3) break;
    }

    let name = nameParts.join(" ").trim();

    // ---- 5. Apply prefix ----
    // if (!prefix) {
    //     prefix = "MR.";
    // }
    if (prefix) {
        name = prefix + " " + name;
    }
    name = name.toUpperCase();

    return { name, phone };
}


