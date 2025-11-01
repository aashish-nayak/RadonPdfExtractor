import { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FileUploadProps {
    onFilesSelected: (files: File[]) => void;
    isProcessing: boolean;
}

export function FileUpload({ onFilesSelected, isProcessing }: FileUploadProps) {
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            onFilesSelected(files);
        }
    }, [onFilesSelected]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
        if (files.length > 0) {
            onFilesSelected(files);
        }
    }, [onFilesSelected]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    }, []);

    return (
        <Card
            className="border-2 border-dashed p-8 text-center hover:border-primary transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <div className="flex flex-col items-center gap-4">
                <Upload className="w-12 h-12 text-muted-foreground" />
                <div>
                    <h3 className="font-semibold text-lg mb-2">Upload PDF Files</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Drag and drop PDF files here, or click to select
                    </p>
                    <Button asChild disabled={isProcessing}>
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                multiple
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={isProcessing}
                            />
                            {isProcessing ? 'Processing...' : 'Select PDF Files'}
                        </label>
                    </Button>
                </div>
            </div>
        </Card>
    );
}