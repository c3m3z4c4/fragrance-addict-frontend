import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchPerfumers } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function nameHue(name: string): number {
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

interface PerfumerCardProps {
  name: string;
  count: number;
  imageUrl: string | null;
  index: number;
}

function PerfumerCard({ name, count, imageUrl, index }: PerfumerCardProps) {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);

  const hue = nameHue(name);
  const initials = getInitials(name);
  const showPhoto = imageUrl && !imgError;

  return (
    <Link
      to={`/perfumers/${encodeURIComponent(name)}`}
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
      {/* Portrait area */}
      <div
        className="aspect-[3/4] flex items-center justify-center overflow-hidden"
        style={
          showPhoto
            ? { background: '#f5f0eb' }
            : {
                background: `linear-gradient(160deg, hsl(${hue} 18% 94%) 0%, hsl(${hue} 28% 86%) 100%)`,
              }
        }
      >
        {showPhoto ? (
          <img
            src={imageUrl!}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <span
            className="font-display text-5xl font-bold tracking-widest select-none transition-colors duration-300 group-hover:text-accent"
            style={{ color: `hsl(${hue} 35% 32%)` }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-3 border-t border-border/40 bg-background">
        <h2 className="font-display text-base font-medium truncate">{name}</h2>
        {count > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {count} {count === 1 ? t('perfumers.fragrance') : t('perfumers.fragrances')}
          </p>
        )}
      </div>
    </Link>
  );
}

const Perfumers = () => {
  const { t } = useTranslation();

  const { data: perfumers = [], isLoading } = useQuery({
    queryKey: ['perfumers'],
    queryFn: fetchPerfumers,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-12 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium mb-4">
            {t('perfumers.title')}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('perfumers.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {isLoading
            ? Array.from({ length: 15 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
              ))
            : perfumers.map((p, index) => (
                <PerfumerCard
                  key={p.name}
                  name={p.name}
                  count={p.count}
                  imageUrl={p.imageUrl}
                  index={index}
                />
              ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Perfumers;
