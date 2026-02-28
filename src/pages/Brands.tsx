import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchBrands } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function brandHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

interface BrandCardProps {
  name: string;
  count: number;
  imageUrl: string | null;
  index: number;
}

function BrandCard({ name, count, imageUrl, index }: BrandCardProps) {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const showLogo = imageUrl && !imgError;
  const hue = brandHue(name);
  const initials = getInitials(name);

  return (
    <Link
      to={`/brands/${encodeURIComponent(name)}`}
      className={cn(
        'group rounded-lg overflow-hidden opacity-0 animate-fade-in',
        'border border-border/60 hover:border-accent/40 hover-lift',
        'transition-all duration-300'
      )}
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: 'forwards',
      }}
    >
      {/* Logo area — white background contrasts with most brand logos */}
      <div
        className="aspect-[4/3] flex items-center justify-center overflow-hidden"
        style={showLogo ? { background: '#fff' } : {
          background: `linear-gradient(135deg, hsl(${hue} 20% 94%) 0%, hsl(${hue} 30% 88%) 100%)`,
        }}
      >
        {showLogo ? (
          <img
            src={imageUrl}
            alt={name}
            className="max-h-full max-w-full object-contain p-8 transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <span
            className="font-display text-4xl font-bold tracking-widest select-none transition-colors duration-300 group-hover:text-accent"
            style={{ color: `hsl(${hue} 40% 30%)` }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Brand info */}
      <div className="px-4 py-3 border-t border-border/40 bg-background">
        <h2 className="font-display text-base font-medium truncate">{name}</h2>
        {count > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {count} {count === 1 ? t('brands.fragrance') : t('brands.fragrances')}
          </p>
        )}
      </div>
    </Link>
  );
}

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
                <BrandCard
                  key={brand.name}
                  name={brand.name}
                  count={brand.count}
                  imageUrl={brand.imageUrl}
                  index={index}
                />
              ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Brands;
