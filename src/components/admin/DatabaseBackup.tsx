import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Database, FileJson, AlertTriangle } from 'lucide-react';
import { exportBackup, importBackup } from '@/lib/api';

export function DatabaseBackup() {
    const { toast } = useToast();

    // Export state
    const [exportBrand, setExportBrand] = useState('');
    const [exporting, setExporting] = useState(false);

    // Import state
    const [importMode, setImportMode] = useState<'upsert' | 'replace'>('upsert');
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ imported: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        setExporting(true);
        try {
            await exportBackup(exportBrand.trim() || undefined);
            toast({
                title: 'Export successful',
                description: exportBrand.trim()
                    ? `Exported perfumes for brand "${exportBrand.trim()}"`
                    : 'Exported all perfumes',
            });
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Export failed',
                description: err?.message || 'Unknown error',
            });
        } finally {
            setExporting(false);
        }
    };

    const handleImport = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
            toast({ variant: 'destructive', title: 'No file selected', description: 'Please choose a .json backup file' });
            return;
        }

        setImporting(true);
        setImportResult(null);
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);

            // Accept both top-level array and { perfumes: [...] } format
            const perfumes = Array.isArray(parsed)
                ? parsed
                : Array.isArray(parsed.perfumes)
                ? parsed.perfumes
                : null;

            if (!perfumes) {
                throw new Error('Invalid backup format: expected array or { perfumes: [...] }');
            }

            const result = await importBackup({ perfumes, mode: importMode });
            setImportResult(result);
            toast({
                title: 'Import successful',
                description: `Imported ${result.imported} perfume(s) with mode "${importMode}"`,
            });
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Import failed',
                description: err?.message || 'Unknown error',
            });
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Export */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Download className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Export Database</CardTitle>
                    </div>
                    <CardDescription>
                        Download all perfumes (or a specific brand) as a JSON file.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="export-brand">Brand filter (optional)</Label>
                        <Input
                            id="export-brand"
                            placeholder="e.g. Chanel — leave blank to export all brands"
                            value={exportBrand}
                            onChange={e => setExportBrand(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                    <Button
                        onClick={handleExport}
                        disabled={exporting}
                        className="gap-2"
                    >
                        <FileJson className="h-4 w-4" />
                        {exporting ? 'Exporting…' : 'Export JSON'}
                    </Button>
                </CardContent>
            </Card>

            {/* Import */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Import Backup</CardTitle>
                    </div>
                    <CardDescription>
                        Restore perfumes from a previously exported JSON backup file.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="import-file">Backup file (.json)</Label>
                        <Input
                            id="import-file"
                            type="file"
                            accept=".json,application/json"
                            ref={fileInputRef}
                            className="max-w-sm cursor-pointer"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Import mode</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input
                                    type="radio"
                                    name="import-mode"
                                    value="upsert"
                                    checked={importMode === 'upsert'}
                                    onChange={() => setImportMode('upsert')}
                                    className="accent-primary"
                                />
                                Upsert (add / update existing)
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input
                                    type="radio"
                                    name="import-mode"
                                    value="replace"
                                    checked={importMode === 'replace'}
                                    onChange={() => setImportMode('replace')}
                                    className="accent-primary"
                                />
                                Replace all
                            </label>
                        </div>
                        {importMode === 'replace' && (
                            <p className="flex items-center gap-1.5 text-xs text-destructive">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Replace mode will overwrite existing records via upsert on source URL.
                            </p>
                        )}
                    </div>

                    <Button
                        onClick={handleImport}
                        disabled={importing}
                        className="gap-2"
                    >
                        <Database className="h-4 w-4" />
                        {importing ? 'Importing…' : 'Import'}
                    </Button>

                    {importResult && (
                        <p className="text-sm text-muted-foreground">
                            Successfully imported <span className="font-semibold text-foreground">{importResult.imported}</span> perfume(s).
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
