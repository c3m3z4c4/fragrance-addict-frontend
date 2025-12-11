import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStats, getCacheStats, clearCache, fetchBrands } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Database, Layers, Tag, Trash2, Loader2 } from 'lucide-react';

export function AdminStats() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchStats,
  });

  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: fetchBrands,
  });

  const { data: cacheStats, isLoading: cacheLoading } = useQuery({
    queryKey: ['cache-stats'],
    queryFn: getCacheStats,
    retry: false,
  });

  const clearCacheMutation = useMutation({
    mutationFn: clearCache,
    onSuccess: () => {
      toast({ title: 'Cache cleared successfully' });
      queryClient.invalidateQueries({ queryKey: ['cache-stats'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to clear cache', variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Perfumes</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {brandsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{brands?.length || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cache Entries</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {cacheLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{cacheStats?.keys || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
          <CardDescription>
            Manage the scraper cache to free up memory or force re-scraping
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!cacheLoading && cacheStats && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-green-500">{cacheStats.hits}</p>
                <p className="text-xs text-muted-foreground">Cache Hits</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-amber">{cacheStats.misses}</p>
                <p className="text-xs text-muted-foreground">Cache Misses</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{cacheStats.keys}</p>
                <p className="text-xs text-muted-foreground">Cached Items</p>
              </div>
            </div>
          )}
          
          <Button
            variant="destructive"
            onClick={() => clearCacheMutation.mutate()}
            disabled={clearCacheMutation.isPending}
          >
            {clearCacheMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Clear Cache
          </Button>
        </CardContent>
      </Card>

      {/* Brands List */}
      <Card>
        <CardHeader>
          <CardTitle>Brands in Catalog</CardTitle>
          <CardDescription>
            All brands currently in your perfume database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {brandsLoading ? (
            <div className="flex flex-wrap gap-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-20" />
              ))}
            </div>
          ) : brands && brands.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {brands.map((brand) => (
                <span
                  key={brand}
                  className="px-3 py-1 bg-secondary/50 rounded-full text-sm"
                >
                  {brand}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No brands found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
