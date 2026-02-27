import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PerfumeCard } from '@/components/PerfumeCard';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchPerfumesByBrand } from '@/lib/api';

const BrandDetail = () => {
  const { brand } = useParams<{ brand: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const decodedBrand = brand ? decodeURIComponent(brand) : '';

  const { data: perfumes = [], isLoading, error } = useQuery({
    queryKey: ['brand-perfumes', decodedBrand],
    queryFn: () => fetchPerfumesByBrand(decodedBrand),
    enabled: !!decodedBrand,
    staleTime: 5 * 60 * 1000,
  });

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
        <div className="mb-10 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
          <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">{decodedBrand}</h1>
          {!isLoading && (
            <p className="text-muted-foreground text-sm">
              {perfumes.length} {perfumes.length === 1 ? t('brands.fragrance') : t('brands.fragrances')}
            </p>
          )}
        </div>

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
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {perfumes.map((perfume, index) => (
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
