import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Search, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PerfumeCard } from '@/components/PerfumeCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { GenderFilterButtons, type GenderFilter } from '@/components/GenderFilterButtons';
import { fetchPerfumesByPerfumer } from '@/lib/api';

const PerfumerDetail = () => {
  const { name } = useParams<{ name: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');

  const decodedName = name ? decodeURIComponent(name) : '';

  const { data: perfumes = [], isLoading } = useQuery({
    queryKey: ['perfumer-perfumes', decodedName],
    queryFn: () => fetchPerfumesByPerfumer(decodedName),
    enabled: !!decodedName,
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    let result = perfumes;
    if (genderFilter !== 'all') {
      result = result.filter(p => p.gender === genderFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p => p.name?.toLowerCase().includes(q));
    }
    return result;
  }, [perfumes, genderFilter, search]);

  const hasFilters = genderFilter !== 'all' || search.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/perfumers')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('perfumers.title')}
        </button>

        <div className="mb-6 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
          <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">{decodedName}</h1>
          {!isLoading && (
            <p className="text-muted-foreground text-sm">
              {hasFilters
                ? <>{filtered.length} <span className="text-muted-foreground/60">/ {perfumes.length}</span> {t('perfumers.fragrances')}</>
                : <>{perfumes.length} {perfumes.length === 1 ? t('perfumers.fragrance') : t('perfumers.fragrances')}</>
              }
            </p>
          )}
        </div>

        {!isLoading && perfumes.length > 0 && (
          <div className="flex flex-col items-center gap-4 mb-8">
            <GenderFilterButtons value={genderFilter} onChange={setGenderFilter} />
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('brands.filterPerfumes')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            {hasFilters ? t('search.noResults') : t('common.notFound')}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {filtered.map((perfume, index) => (
              <PerfumeCard key={perfume.id} perfume={perfume} index={index} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PerfumerDetail;
