import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  fetchSitemapUrls, 
  addToQueue, 
  startQueue, 
  stopQueue, 
  getQueueStatus, 
  clearQueue,
  type QueueStatus 
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Play, 
  Square, 
  Trash2, 
  Download, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function SitemapImporter() {
  const [brand, setBrand] = useState('');
  const [limit, setLimit] = useState('50');
  const queryClient = useQueryClient();

  // Poll queue status every 3 seconds when processing
  const { data: queueStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['queue-status'],
    queryFn: getQueueStatus,
    refetchInterval: (query) => {
      const data = query.state.data as QueueStatus | undefined;
      return data?.processing ? 3000 : false;
    },
    retry: false,
  });

  // Refetch when queue starts/stops
  useEffect(() => {
    if (queueStatus?.processing) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['admin-perfumes'] });
        queryClient.invalidateQueries({ queryKey: ['perfumes'] });
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [queueStatus?.processing, queryClient]);

  const fetchUrlsMutation = useMutation({
    mutationFn: () => fetchSitemapUrls(brand || undefined, parseInt(limit)),
    onSuccess: async (result) => {
      if (result.success && result.urls) {
        toast({ 
          title: 'URLs Found', 
          description: `Found ${result.count} perfume URLs` 
        });
        
        // Add to queue
        const addResult = await addToQueue(result.urls);
        if (addResult.success) {
          toast({ 
            title: 'Added to Queue', 
            description: `${addResult.added} URLs added (${addResult.skipped} duplicates skipped)` 
          });
          refetchStatus();
        }
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const startMutation = useMutation({
    mutationFn: startQueue,
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: 'Queue Started', description: 'Processing perfumes in background' });
        refetchStatus();
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    },
  });

  const stopMutation = useMutation({
    mutationFn: stopQueue,
    onSuccess: () => {
      toast({ title: 'Queue Stopped' });
      refetchStatus();
    },
  });

  const clearMutation = useMutation({
    mutationFn: clearQueue,
    onSuccess: () => {
      toast({ title: 'Queue Cleared' });
      refetchStatus();
    },
  });

  const progress = queueStatus?.total 
    ? ((queueStatus.processed + queueStatus.failed) / queueStatus.total) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Fetch URLs Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import from Fragrantica
          </CardTitle>
          <CardDescription>
            Fetch perfume URLs from Fragrantica by brand or sitemap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Brand (optional)</label>
              <Input
                placeholder="e.g. Dior, Chanel, Tom Ford"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                disabled={fetchUrlsMutation.isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to fetch from sitemap
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Limit</label>
              <Input
                type="number"
                min="10"
                max="500"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                disabled={fetchUrlsMutation.isPending}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => fetchUrlsMutation.mutate()}
                disabled={fetchUrlsMutation.isPending}
                className="w-full"
              >
                {fetchUrlsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Fetch & Add to Queue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scraping Queue
            </span>
            <div className="flex items-center gap-2">
              {queueStatus?.processing ? (
                <span className="flex items-center gap-1 text-sm text-green-500">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Processing
                </span>
              ) : queueStatus?.remaining ? (
                <span className="text-sm text-muted-foreground">Paused</span>
              ) : (
                <span className="text-sm text-muted-foreground">Idle</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          {queueStatus && queueStatus.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{queueStatus.processed + queueStatus.failed} / {queueStatus.total}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{queueStatus?.remaining || 0}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded-lg">
              <p className="text-2xl font-bold text-green-500">{queueStatus?.processed || 0}</p>
              <p className="text-xs text-muted-foreground">Processed</p>
            </div>
            <div className="text-center p-3 bg-destructive/10 rounded-lg">
              <p className="text-2xl font-bold text-destructive">{queueStatus?.failed || 0}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{queueStatus?.total || 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>

          {/* Current Processing */}
          {queueStatus?.current && (
            <div className="p-3 bg-accent/10 rounded-lg flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              <span className="text-sm truncate">
                Processing: {queueStatus.current}
              </span>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            {!queueStatus?.processing ? (
              <Button 
                onClick={() => startMutation.mutate()}
                disabled={!queueStatus?.remaining || startMutation.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Processing
              </Button>
            ) : (
              <Button 
                variant="destructive"
                onClick={() => stopMutation.mutate()}
                disabled={stopMutation.isPending}
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => clearMutation.mutate()}
              disabled={queueStatus?.processing || clearMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Queue
            </Button>
          </div>

          {/* Recent Errors */}
          {queueStatus?.errors && queueStatus.errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Recent Errors
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {queueStatus.errors.map((err, i) => (
                  <div key={i} className="text-xs p-2 bg-destructive/10 rounded flex items-start gap-2">
                    <XCircle className="h-3 w-3 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="truncate">{err.url}: {err.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-secondary/20">
        <CardHeader>
          <CardTitle className="text-base">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Scraping respects a 5-second delay between requests</p>
          <p>• Processing 100 perfumes takes approximately 8-10 minutes</p>
          <p>• The queue runs in the backend - you can close this page</p>
          <p>• Duplicates are automatically skipped</p>
          <p>• Popular brands: Dior, Chanel, Tom Ford, Creed, Parfums de Marly</p>
        </CardContent>
      </Card>
    </div>
  );
}
