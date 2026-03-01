import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchSitemapUrls,
  addToQueue,
  startQueue,
  stopQueue,
  getQueueStatus,
  clearQueue,
  checkExistingUrls,
  importFullCatalog,
  type QueueStatus,
  type FullCatalogResult,
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
  AlertCircle,
  Search,
  Plus,
  Database,
  Globe,
  TriangleAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UrlCheckResult {
  total: number;
  existingCount: number;
  newCount: number;
  newUrls: string[];
}

export function SitemapImporter() {
  const [brand, setBrand] = useState('');
  const [limit, setLimit] = useState('50');
  const [urlCheckResult, setUrlCheckResult] = useState<UrlCheckResult | null>(null);
  const [fetchedUrls, setFetchedUrls] = useState<string[]>([]);
  const [fullCatalogResult, setFullCatalogResult] = useState<FullCatalogResult | null>(null);
  const [showFullCatalogConfirm, setShowFullCatalogConfirm] = useState(false);
  const queryClient = useQueryClient();

  // Poll queue status every 10 seconds when processing (to avoid rate limiting)
  const { data: queueStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['queue-status'],
    queryFn: getQueueStatus,
    refetchInterval: (query) => {
      const data = query.state.data as QueueStatus | undefined;
      // Only poll when actively processing, use 10s interval to avoid rate limits
      return data?.processing ? 10000 : false;
    },
    retry: 1,
    retryDelay: 5000,
    staleTime: 5000,
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

  // Fetch URLs and check which ones already exist
  const fetchUrlsMutation = useMutation({
    mutationFn: async () => {
      // First, fetch URLs from Fragrantica
      const result = await fetchSitemapUrls(brand || undefined, parseInt(limit));
      if (!result.success || !result.urls) {
        throw new Error(result.error || 'Failed to fetch URLs');
      }
      
      // Check if we got any URLs
      if (result.urls.length === 0) {
        throw new Error('No URLs found. Try a different brand name or check spelling.');
      }
      
      setFetchedUrls(result.urls);
      
      // Then check which ones already exist
      const checkResult = await checkExistingUrls(result.urls);
      if (!checkResult.success) {
        throw new Error(checkResult.error || 'Failed to check existing URLs');
      }
      
      return checkResult;
    },
    onSuccess: (result) => {
      setUrlCheckResult({
        total: result.total || 0,
        existingCount: result.existingCount || 0,
        newCount: result.newCount || 0,
        newUrls: result.newUrls || []
      });
      
      toast({ 
        title: 'URLs Checked', 
        description: `Found ${result.newCount} new perfumes (${result.existingCount} already exist)` 
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Add only new URLs to the queue
  const addToQueueMutation = useMutation({
    mutationFn: () => addToQueue(urlCheckResult?.newUrls || []),
    onSuccess: (result) => {
      if (result.success) {
        toast({ 
          title: 'Added to Queue', 
          description: `${result.added} URLs added` 
        });
        setUrlCheckResult(null);
        setFetchedUrls([]);
        refetchStatus();
      }
    },
    onError: (error: Error) => {
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

  const fullCatalogMutation = useMutation({
    mutationFn: () => importFullCatalog(true),
    onSuccess: (result) => {
      setShowFullCatalogConfirm(false);
      if (result.success) {
        setFullCatalogResult(result);
        refetchStatus();
        toast({
          title: 'Full Catalog Import Started',
          description: `${result.newQueued.toLocaleString()} new perfumes queued from ${result.sitemapsDiscovered} sitemap files`,
        });
      } else {
        toast({ title: 'Import Failed', description: result.error || 'Could not fetch sitemaps', variant: 'destructive' });
      }
    },
    onError: (error: Error) => {
      setShowFullCatalogConfirm(false);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const progress = queueStatus?.total 
    ? ((queueStatus.processed + queueStatus.failed) / queueStatus.total) * 100 
    : 0;

  return (
    <div className="space-y-6">

      {/* Full Catalog Import Card */}
      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-accent" />
            Full Catalog Import
          </CardTitle>
          <CardDescription>
            Import all ~123,000 perfumes from Fragrantica by reading its public sitemaps. Already-scraped perfumes are skipped automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
            <TriangleAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-muted-foreground">
              <p><strong className="text-foreground">Time estimate:</strong> ~123K perfumes × 15 s = <strong className="text-foreground">~21 days</strong> of continuous processing at Fragrantica's safe rate limit.</p>
              <p>The queue runs in the backend — you can safely close this page. You can also pause and resume at any time.</p>
            </div>
          </div>

          {/* Result after import */}
          {fullCatalogResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xl font-bold">{fullCatalogResult.sitemapsDiscovered}</p>
                <p className="text-xs text-muted-foreground">Sitemaps read</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xl font-bold">{fullCatalogResult.totalFound.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total found</p>
              </div>
              <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-xl font-bold text-green-600">{fullCatalogResult.newQueued.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">New queued</p>
              </div>
              <div className="text-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-xl font-bold text-amber-600">{fullCatalogResult.alreadyExist.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Already exist</p>
              </div>
            </div>
          )}

          {/* Confirm / Launch */}
          {!showFullCatalogConfirm ? (
            <Button
              variant="outline"
              className="border-accent/40 hover:border-accent"
              onClick={() => setShowFullCatalogConfirm(true)}
              disabled={fullCatalogMutation.isPending}
            >
              <Globe className="h-4 w-4 mr-2" />
              Import Full Fragrantica Catalog
            </Button>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm flex-1">This will queue tens of thousands of URLs. Confirm?</p>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => fullCatalogMutation.mutate()}
                disabled={fullCatalogMutation.isPending}
              >
                {fullCatalogMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Reading sitemaps…</>
                ) : (
                  'Yes, import all'
                )}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowFullCatalogConfirm(false)} disabled={fullCatalogMutation.isPending}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
            <div>
              <label className="text-sm font-medium mb-1 block invisible select-none">_</label>
              <Button
                onClick={() => {
                  setUrlCheckResult(null);
                  fetchUrlsMutation.mutate();
                }}
                disabled={fetchUrlsMutation.isPending}
                className="w-full"
              >
                {fetchUrlsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Search className="h-4 w-4 mr-2" />
                Check URLs
              </Button>
            </div>
          </div>

          {/* URL Check Results Preview */}
          {urlCheckResult && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  URL Verification Results
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUrlCheckResult(null);
                    setFetchedUrls([]);
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-background rounded-lg border">
                  <p className="text-2xl font-bold">{urlCheckResult.total}</p>
                  <p className="text-xs text-muted-foreground">Total Found</p>
                </div>
                <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-2xl font-bold text-green-600">{urlCheckResult.newCount}</p>
                  <p className="text-xs text-muted-foreground">New Perfumes</p>
                </div>
                <div className="text-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-2xl font-bold text-amber-600">{urlCheckResult.existingCount}</p>
                  <p className="text-xs text-muted-foreground">Already Exist</p>
                </div>
              </div>

              {urlCheckResult.newCount > 0 ? (
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => addToQueueMutation.mutate()}
                    disabled={addToQueueMutation.isPending}
                    className="flex-1"
                  >
                    {addToQueueMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Plus className="h-4 w-4 mr-2" />
                    Add {urlCheckResult.newCount} New URLs to Queue
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-500/10 p-3 rounded-lg">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm">All perfumes from this brand are already in your database!</span>
                </div>
              )}
            </div>
          )}
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
          <p>• Scraping respects a 15-second delay between requests</p>
          <p>• Processing 100 perfumes takes approximately 25-30 minutes</p>
          <p>• The queue runs in the backend - you can close this page</p>
          <p>• Duplicates are automatically skipped</p>
          <p>• Brand names must match exactly (e.g., "Dior" not "dior")</p>
        </CardContent>
      </Card>
    </div>
  );
}
