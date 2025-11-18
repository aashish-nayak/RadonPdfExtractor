import { InvoiceRecord } from '@/types/invoice';

const STORAGE_KEY = 'radon_pdf_extractor_records';

export function saveRecordsToLocalStorage(records: InvoiceRecord[]): void {
    try {
        const data = JSON.stringify(records);
        localStorage.setItem(STORAGE_KEY, data);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        throw new Error('Failed to save data to localStorage');
    }
}

export function loadRecordsFromLocalStorage(): InvoiceRecord[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            return [];
        }
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return [];
    }
}

export function clearLocalStorage(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing localStorage:', error);
        throw new Error('Failed to clear localStorage');
    }
}

export function hasStoredData(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
}