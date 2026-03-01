import { useState } from 'react';
import { Copy, Trash2, AlertTriangle, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { fetchDuplicates, deleteDuplicates, type DuplicateGroup } from '@/lib/api';

export function DuplicateManager() {
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [duplicates, setDuplicates] = useState<DuplicateGroup[] | null>(null);
    const [deleteResult, setDeleteResult] = useState<{ deleted: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleScan = async () => {
        setIsLoading(true);
        setError(null);
        setDeleteResult(null);
        const result = await fetchDuplicates();
        setIsLoading(false);
        if (result.error) {
            setError(result.error);
        } else {
            setDuplicates(result.data);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);
        const result = await deleteDuplicates();
        setIsDeleting(false);
        if (result.error) {
            setError(result.error);
        } else {
            setDeleteResult({ deleted: result.deleted });
            setDuplicates(null);
        }
    };

    const hasDuplicates = duplicates !== null && duplicates.length > 0;
    const totalDuplicateRows = duplicates?.reduce((sum, g) => sum + g.count - 1, 0) ?? 0;

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Info card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Copy className="h-5 w-5" />
                        Duplicate Perfume Manager
                    </CardTitle>
                    <CardDescription>
                        Scan for perfumes that share the same name and brand (scraping the same perfume
                        from different URLs). The deduplication keeps the record with the highest rating
                        and removes the rest.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-3">
                        <Button onClick={handleScan} disabled={isLoading || isDeleting} className="gap-2">
                            {isLoading ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Scanning…</>
                            ) : (
                                <><RefreshCw className="h-4 w-4" /> Scan for Duplicates</>
                            )}
                        </Button>

                        {hasDuplicates && (
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="gap-2"
                            >
                                {isDeleting ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</>
                                ) : (
                                    <><Trash2 className="h-4 w-4" /> Delete {totalDuplicateRows} Duplicate{totalDuplicateRows !== 1 ? 's' : ''}</>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* No duplicates found */}
                    {duplicates !== null && duplicates.length === 0 && (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            No duplicates found. Your catalog is clean!
                        </div>
                    )}

                    {/* Duplicate list */}
                    {hasDuplicates && (
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Found <strong>{duplicates!.length}</strong> duplicate group{duplicates!.length !== 1 ? 's' : ''} ({totalDuplicateRows} extra rows to remove):
                            </p>
                            <div className="border border-border rounded-lg divide-y divide-border max-h-80 overflow-y-auto">
                                {duplicates!.map((group, i) => (
                                    <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                                        <div>
                                            <span className="font-medium">{group.name}</span>
                                            <span className="text-muted-foreground"> — {group.brand}</span>
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                                            {group.count}×
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                                Deletion keeps the record with the highest rating per group and removes the rest. This action is irreversible.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Success */}
            {deleteResult && (
                <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium text-green-700 dark:text-green-400">
                                    Deduplication complete
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {deleteResult.deleted} duplicate record{deleteResult.deleted !== 1 ? 's' : ''} removed.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error */}
            {error && (
                <Card className="border-destructive/50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium text-destructive">Error</p>
                                <p className="text-sm text-muted-foreground">{error}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
