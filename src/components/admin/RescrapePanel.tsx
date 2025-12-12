import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  getIncompletePerfumes, 
  rescrapePerfumes, 
  addIncompleteToQueue,
  type IncompletePerfume 
} from '@/lib/api';
import { RefreshCw, Plus, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export function RescrapePanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: incompleteData, isLoading, refetch } = useQuery({
    queryKey: ['incomplete-perfumes'],
    queryFn: () => getIncompletePerfumes(100),
    staleTime: 30000,
  });

  const rescrapeMutation = useMutation({
    mutationFn: (ids: string[]) => rescrapePerfumes(ids),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Re-scrape completado',
          description: `Procesados: ${data.processed}, Fallidos: ${data.failed}`,
        });
        queryClient.invalidateQueries({ queryKey: ['incomplete-perfumes'] });
        queryClient.invalidateQueries({ queryKey: ['perfumes'] });
        setSelectedIds([]);
      } else {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Re-scrape failed',
        variant: 'destructive',
      });
    },
  });

  const addToQueueMutation = useMutation({
    mutationFn: (limit: number) => addIncompleteToQueue(limit),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Agregados a la cola',
          description: `${data.added} perfumes agregados. Cola total: ${data.queueSize}`,
        });
      } else {
        toast({
          title: 'Info',
          description: data.message || data.error,
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add to queue',
        variant: 'destructive',
      });
    },
  });

  const handleSelectAll = () => {
    if (selectedIds.length === incompleteData?.perfumes?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(incompleteData?.perfumes?.map(p => p.id) || []);
    }
  };

  const handleToggle = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleRescrape = () => {
    if (selectedIds.length === 0) {
      toast({
        title: 'Selecciona perfumes',
        description: 'Debes seleccionar al menos un perfume para re-scrapear',
        variant: 'destructive',
      });
      return;
    }
    
    if (selectedIds.length > 20) {
      toast({
        title: 'Demasiados perfumes',
        description: 'Máximo 20 perfumes por batch. Usa "Agregar a cola" para más.',
        variant: 'destructive',
      });
      return;
    }
    
    rescrapeMutation.mutate(selectedIds);
  };

  const perfumes = incompleteData?.perfumes || [];
  const totalIncomplete = incompleteData?.count || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Re-Scrape de Datos Faltantes
            </span>
            <Badge variant="secondary" className="text-lg">
              {totalIncomplete} incompletos
            </Badge>
          </CardTitle>
          <CardDescription>
            Perfumes que necesitan datos adicionales: sillage, longevity, proyección, o perfumes similares.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar lista
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSelectAll}
              disabled={perfumes.length === 0}
            >
              {selectedIds.length === perfumes.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </Button>
            
            <Button
              onClick={handleRescrape}
              disabled={selectedIds.length === 0 || rescrapeMutation.isPending}
            >
              {rescrapeMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Re-scrapeando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-scrapear seleccionados ({selectedIds.length})
                </>
              )}
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => addToQueueMutation.mutate(50)}
              disabled={addToQueueMutation.isPending || totalIncomplete === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar 50 a cola
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando perfumes incompletos...
            </div>
          ) : perfumes.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
              <p className="text-muted-foreground">
                ¡Todos los perfumes tienen datos completos!
              </p>
            </div>
          ) : (
            <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
              {perfumes.map((perfume: IncompletePerfume) => (
                <div 
                  key={perfume.id}
                  className="flex items-center gap-4 p-3 hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.includes(perfume.id)}
                    onCheckedChange={() => handleToggle(perfume.id)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{perfume.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{perfume.brand}</p>
                  </div>
                  
                  <div className="flex gap-1 flex-shrink-0">
                    <Badge 
                      variant={perfume.hasSillage ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {perfume.hasSillage ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span className="ml-1">Sillage</span>
                    </Badge>
                    <Badge 
                      variant={perfume.hasLongevity ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {perfume.hasLongevity ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span className="ml-1">Duración</span>
                    </Badge>
                    <Badge 
                      variant={perfume.hasSimilarPerfumes ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {perfume.hasSimilarPerfumes ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span className="ml-1">Similares</span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4" />
            Información importante
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• El re-scrape obtiene datos adicionales: sillage, longevity, proyección y perfumes similares</p>
          <p>• Hay un delay de 15 segundos entre cada perfume para evitar bloqueos</p>
          <p>• Máximo 20 perfumes pueden ser re-scrapeados de forma directa</p>
          <p>• Para más perfumes, usa "Agregar a cola" y luego inicia la cola desde la pestaña Import</p>
          <p>• Los datos existentes (nombre, marca, notas) también se actualizan</p>
        </CardContent>
      </Card>
    </div>
  );
}