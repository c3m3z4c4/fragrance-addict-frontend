import { useParams, Link, useNavigate } from 'react-router-dom';
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
import { fetchPerfumesByBrand } from '@/lib/api';

const BrandDetail = () => {
  const { brand } = useParams<{ brand: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');

  const decodedBrand = brand ? decodeURIComponent(brand) : '';

  const { data: perfumes = [], isLoading, error } = useQuery({
    queryKey: ['brand-perfumes', decodedBrand],
    queryFn: () => fetchPerfumesByBrand(decodedBrand),
    enabled: !!decodedBrand,
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
        {/* Back */}
        <button
          onClick={() => navigate('/brands')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('brands.title')}
        </button>

        {/* Brand header */}
        <div className="mb-6 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
          <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">{decodedBrand}</h1>
          {!isLoading && (
            <p className="text-muted-foreground text-sm">
              {hasFilters
                ? <>{filtered.length} <span className="text-muted-foreground/60">/ {perfumes.length}</span> {t('brands.fragrances')}</>
                : <>{perfumes.length} {perfumes.length === 1 ? t('brands.fragrance') : t('brands.fragrances')}</>
              }
            </p>
          )}
        </div>

        {/* Filter bar */}
        {!isLoading && perfumes.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-8">
            {/* Text search */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t('brands.filterPerfumes')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-8 h-9 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Gender filter */}
            <div className="flex items-center gap-2">
              <GenderFilterButtons
                value={genderFilter}
                onChange={(g) => setGenderFilter(g)}
                showLabels={false}
                compact={false}
              />
            </div>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
            ))}
          </div>
        ) : error || perfumes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">
              {t('search.noResults')}
            </p>
            <Link to="/brands" className="text-accent hover:underline text-sm">
              {t('brands.title')}
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-2">{t('search.noResults')}</p>
            <button
              onClick={() => { setSearch(''); setGenderFilter('all'); }}
              className="text-sm text-accent hover:underline mt-2"
            >
              {t('search.all')} ×
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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

export default BrandDetail;
