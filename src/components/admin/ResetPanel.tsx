import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getAuthToken } from '@/contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function ResetPanel() {
    const [confirmText, setConfirmText] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const [result, setResult] = useState<{ deleted: { perfumes: number; brands: number } } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const CONFIRM_PHRASE = 'BORRAR TODO';
    const isConfirmed = confirmText.trim().toUpperCase() === CONFIRM_PHRASE;

    const handleReset = async () => {
        if (!isConfirmed) return;
        setIsResetting(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`${API_BASE}/api/scrape/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({ confirm: 'CONFIRM_RESET' }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Error al resetear la base de datos');
            }
            setResult(data);
            setConfirmText('');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Warning card */}
            <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Zona de Peligro
                    </CardTitle>
                    <CardDescription>
                        Esta operación es <strong>irreversible</strong>. Eliminará todos los perfumes,
                        todas las marcas almacenadas y los logos. Los favoritos de los usuarios también
                        serán eliminados. Después del reset, debes volver a scrapear las marcas desde cero.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-md border border-destructive/30 bg-background p-4 text-sm space-y-2">
                        <p className="font-medium">Lo que se eliminará:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Todos los registros de perfumes</li>
                            <li>Todos los logos de marcas almacenados</li>
                            <li>Todos los favoritos de usuarios</li>
                            <li>La cola de scraping activa (si hay una)</li>
                        </ul>
                        <p className="font-medium mt-3">Lo que NO se eliminará:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Cuentas de usuario</li>
                            <li>API keys</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">
                            Para confirmar, escribe <span className="font-mono bg-muted px-1 rounded">{CONFIRM_PHRASE}</span>:
                        </p>
                        <Input
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder={CONFIRM_PHRASE}
                            className="font-mono"
                            disabled={isResetting}
                        />
                    </div>

                    <Button
                        variant="destructive"
                        className="w-full gap-2"
                        disabled={!isConfirmed || isResetting}
                        onClick={handleReset}
                    >
                        {isResetting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Eliminando datos…
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4" />
                                Vaciar base de datos
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Success result */}
            {result && (
                <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <p className="font-medium text-green-700 dark:text-green-400">
                                    Base de datos vaciada exitosamente
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {result.deleted.perfumes.toLocaleString()} perfumes eliminados ·{' '}
                                    {result.deleted.brands.toLocaleString()} marcas eliminadas
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Ahora puedes ir a la pestaña <strong>Brands</strong> para scrapear
                                    las marcas con sus logos desde cero.
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
                                <p className="font-medium text-destructive">Error al resetear</p>
                                <p className="text-sm text-muted-foreground">{error}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
