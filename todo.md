# PDF to Excel Converter - MVP Todo List

## Core Files to Create (Maximum 8 files)

1. **src/pages/Index.tsx** - Main application page with file upload, data preview, and export functionality
2. **src/lib/pdfParser.ts** - PDF parsing logic to extract data from Sales Order and Credit Note PDFs
3. **src/lib/excelGenerator.ts** - Excel generation logic using SheetJS
4. **src/types/invoice.ts** - TypeScript interfaces for invoice data
5. **src/components/DataTable.tsx** - Table component to display extracted records with search and edit
6. **src/components/FileUpload.tsx** - File upload component for PDF files
7. **package.json** - Update with required dependencies (pdf-parse, xlsx)

## Features Implementation Plan

### Phase 1: PDF Upload & Parsing
- File upload component accepting PDF files
- Parse Sales Order PDFs (extract: Invoice Date, Customer Name, Customer Number, Sub Total)
- Parse Credit Note PDFs (extract: Credit Date, Customer Name, Customer Number, Sub Total)
- Store parsed data in state with Type of Record (Sales/CN)

### Phase 2: Data Preview & Management
- Display all extracted records in a table
- Implement search functionality across all fields
- Allow inline editing of records
- Show record count and summary

### Phase 3: Excel Export
- Generate Excel file with all columns
- Apply conditional formatting if needed
- Download functionality

## Simplifications for MVP
- Client-side PDF parsing only (no backend)
- Basic search (filter by text match)
- Simple inline editing
- Standard Excel format without complex formatting