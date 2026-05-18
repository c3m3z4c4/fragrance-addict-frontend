import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchPerfumerBrands } from '@/lib/api';
import { cn } from '@/lib/utils';

function nameHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

function brandToKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim().replace(/\s+/g, '_').replace(/_+/g, '_');
}

interface BrandCardProps {
  perfumer: string;
  name: string;
  count: number;
  imageUrl: string | null;
  index: number;
}

function BrandCard({ perfumer, name, count, imageUrl, index }: BrandCardProps) {
  const { t } = useTranslation();
  const localLogo = `/logos/${brandToKey(name)}.png`;
  const [triedLocal, setTriedLocal] = useState(false);
  const [imgError, setImgError] = useState(false);

  const currentSrc = imageUrl && !triedLocal ? imageUrl : localLogo;
  const handleError = () => {
    if (!triedLocal && imageUrl) { setTriedLocal(true); }
    else { setImgError(true); }
  };

  const hue = nameHue(name);

  return (
    <Link
      to={`/perfumers/${encodeURIComponent(perfumer)}/brand/${encodeURIComponent(name)}`}
      className={cn(
        'group rounded-lg overflow-hidden opacity-0 animate-fade-in',
        'border border-border/60 hover:border-accent/40 hover-lift transition-all duration-300'
      )}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}
    >
      <div
        className="aspect-[4/3] flex items-center justify-center overflow-hidden"
        style={!imgError ? { background: '#fff' } : {
          background: `linear-gradient(135deg, hsl(${hue} 20% 94%) 0%, hsl(${hue} 30% 88%) 100%)`,
        }}
      >
        {!imgError ? (
          <img
            src={currentSrc}
            alt={name}
            className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
            onError={handleError}
          />
        ) : (
          <span
            className="font-display text-3xl font-bold tracking-widest select-none group-hover:text-accent transition-colors"
            style={{ color: `hsl(${hue} 40% 30%)` }}
          >
            {name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')}
          </span>
        )}
      </div>
      <div className="px-4 py-3 border-t border-border/40 bg-background">
        <h2 className="font-display text-base font-medium truncate">{name}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {count} {count === 1 ? t('perfumers.fragrance') : t('perfumers.fragrances')}
        </p>
      </div>
    </Link>
  );
}

const PerfumerDetail = () => {
  const { name } = useParams<{ name: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const decodedName = name ? decodeURIComponent(name) : '';

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['perfumer-brands', decodedName],
    queryFn: () => fetchPerfumerBrands(decodedName),
    enabled: !!decodedName,
    staleTime: 5 * 60 * 1000,
  });

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

        <div className="mb-10 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
          <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">{decodedName}</h1>
          {!isLoading && (
            <p className="text-muted-foreground text-sm">
              {brands.length} {brands.length === 1 ? t('perfumers.brand') : t('perfumers.brands')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
              ))
            : brands.map((brand, index) => (
                <BrandCard
                  key={brand.name}
                  perfumer={decodedName}
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

export default PerfumerDetail;
