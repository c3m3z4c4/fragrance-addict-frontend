import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchPerfumes, deletePerfume } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Trash2, ExternalLink, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export function AdminPerfumeList() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-perfumes', page],
    queryFn: () => fetchPerfumes(page, 15),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePerfume,
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: 'Perfume deleted successfully' });
        queryClient.invalidateQueries({ queryKey: ['admin-perfumes'] });
        queryClient.invalidateQueries({ queryKey: ['perfumes'] });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete perfume', variant: 'destructive' });
      setDeleteId(null);
    },
  });

  const filteredPerfumes = data?.perfumes.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = data ? Math.ceil(data.total / 15) : 1;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading perfumes. Check your API connection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter perfumes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead className="hidden md:table-cell">Year</TableHead>
              <TableHead className="hidden md:table-cell">Rating</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredPerfumes && filteredPerfumes.length > 0 ? (
              filteredPerfumes.map((perfume) => (
                <TableRow key={perfume.id}>
                  <TableCell>
                    <img
                      src={perfume.imageUrl || '/placeholder.svg'}
                      alt={perfume.name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{perfume.name}</TableCell>
                  <TableCell className="text-muted-foreground">{perfume.brand}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {perfume.year || '-'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {perfume.rating ? `★ ${perfume.rating.toFixed(1)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/perfume/${perfume.id}`}>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(perfume.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No perfumes found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.total > 15 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({data.total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Perfume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this perfume? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
