import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchBrands } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const Brands = () => {
  const { t } = useTranslation();

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-12 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium mb-4">
            {t('brands.title')}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('brands.subtitle')}
          </p>
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
              ))
            : brands.map((brand, index) => (
                <Link
                  key={brand.name}
                  to={`/?brand=${encodeURIComponent(brand.name)}`}
                  className={cn(
                    'group relative aspect-[4/3] rounded-lg overflow-hidden opacity-0 animate-fade-in',
                    'hover-lift luxury-border'
                  )}
                  style={{
                    animationDelay: `${index * 80}ms`,
                    animationFillMode: 'forwards',
                  }}
                >
                  {/* Background Image */}
                  {brand.imageUrl ? (
                    <img
                      src={brand.imageUrl}
                      alt={brand.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted" />
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-primary-foreground">
                    <h2 className="font-display text-2xl font-medium mb-1">{brand.name}</h2>
                    {brand.count > 0 && (
                      <p className="text-sm text-primary-foreground/70">
                        {brand.count} {brand.count === 1 ? t('brands.fragrance') : t('brands.fragrances')}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Brands;
