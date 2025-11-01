import { useState } from 'react';
import { InvoiceRecord } from '@/types/invoice';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X } from 'lucide-react';

interface DataTableProps {
    records: InvoiceRecord[];
    onUpdateRecord: (id: string, updates: Partial<InvoiceRecord>) => void;
}

export function DataTable({ records, onUpdateRecord }: DataTableProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<InvoiceRecord>>({});

    const startEdit = (record: InvoiceRecord) => {
        setEditingId(record.id);
        setEditValues({
            soldBy: record.soldBy,
            clientName: record.clientName,
            number: record.number,
            productLine: record.productLine,
            discOffered: record.discOffered,
            invoiceNumber: record.invoiceNumber,
            voucherType: record.voucherType,
            amount: record.amount,
            source: record.source,
            sourceName: record.sourceName,
            saleType: record.saleType,
        });
    };

    const saveEdit = () => {
        if (editingId) {
            onUpdateRecord(editingId, editValues);
            setEditingId(null);
            setEditValues({});
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValues({});
    };

    return (
        <div className="border rounded-lg overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Sold By</TableHead>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Source NAME</TableHead>
                        <TableHead>Product Line</TableHead>
                        <TableHead>Sale Type</TableHead>
                        <TableHead>Disc Offered %</TableHead>
                        <TableHead>Voucher Type</TableHead>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead>AMOUNT</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                                No records found. Upload PDF files to get started.
                            </TableCell>
                        </TableRow>
                    ) : (
                        records.map((record) => {
                            const isEditing = editingId === record.id;
                            return (
                                <TableRow key={record.id}>
                                    <TableCell>{record.date}</TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <Input
                                                value={editValues.soldBy || ''}
                                                onChange={(e) => setEditValues({ ...editValues, soldBy: e.target.value })}
                                                className="h-8"
                                            />
                                        ) : (
                                            record.soldBy || '-'
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <Input
                                                value={editValues.clientName || ''}
                                                onChange={(e) => setEditValues({ ...editValues, clientName: e.target.value })}
                                                className="h-8"
                                            />
                                        ) : (
                                            record.clientName
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <Input
                                                value={editValues.number || ''}
                                                onChange={(e) => setEditValues({ ...editValues, number: e.target.value })}
                                                className="h-8"
                                            />
                                        ) : (
                                            record.number
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <Input
                                                value={editValues.source || ''}
                                                onChange={(e) => setEditValues({ ...editValues, source: e.target.value })}
                                                className="h-8"
                                            />
                                        ) : (
                                            record.source || '-'
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <Input
                                                value={editValues.sourceName || ''}
                                                onChange={(e) => setEditValues({ ...editValues, sourceName: e.target.value })}
                                                className="h-8"
                                            />
                                        ) : (
                                            record.sourceName || '-'
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <Input
                                                value={editValues.productLine || ''}
                                                onChange={(e) => setEditValues({ ...editValues, productLine: e.target.value })}
                                                className="h-8"
                                            />
                                        ) : (
                                            record.productLine
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <Input
                                                value={editValues.saleType || ''}
                                                onChange={(e) => setEditValues({ ...editValues, saleType: e.target.value })}
                                                className="h-8"
                                            />
                                        ) : (
                                            record.saleType
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <Input
                                                value={editValues.discOffered || ''}
                                                onChange={(e) => setEditValues({ ...editValues, discOffered: e.target.value })}
                                                className="h-8"
                                            />
                                        ) : (
                                            record.discOffered
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${record.voucherType === 'Sales'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {record.voucherType}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <Input
                                                value={editValues.invoiceNumber || ''}
                                                onChange={(e) => setEditValues({ ...editValues, invoiceNumber: e.target.value })}
                                                className="h-8"
                                            />
                                        ) : (
                                            record.invoiceNumber
                                        )}
                                    </TableCell>
                                    <TableCell>₹{isEditing ? (
                                            <Input
                                                value={editValues.amount || ''}
                                                onChange={(e) => setEditValues({ ...editValues, amount: parseFloat(e.target.value) })}
                                                className="h-8"
                                            />
                                        ) : (
                                            record.amount.toFixed(2)
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="ghost" onClick={saveEdit}>
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button size="sm" variant="ghost" onClick={() => startEdit(record)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}