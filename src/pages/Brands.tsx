import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchBrands } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type SearchMode = 'marca' | 'perfume' | 'perfumista';

const SEARCH_MODES: { id: SearchMode; label: string; placeholder: string }[] = [
  { id: 'marca', label: 'Marca', placeholder: 'Buscar marca…' },
  { id: 'perfume', label: 'Nombre', placeholder: 'Buscar perfume por nombre…' },
  { id: 'perfumista', label: 'Perfumista', placeholder: 'Buscar perfumista…' },
];

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

function brandToKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');
}

interface BrandCardProps {
  name: string;
  count: number;
  imageUrl: string | null;
  index: number;
}

function BrandCard({ name, count, imageUrl, index }: BrandCardProps) {
  const { t } = useTranslation();
  const localLogo = `/logos/${brandToKey(name)}.png`;
  const [triedLocal, setTriedLocal] = useState(false);
  const [imgError, setImgError] = useState(false);

  const currentSrc = imageUrl && !triedLocal ? imageUrl : localLogo;

  const handleError = () => {
    if (!triedLocal && imageUrl) {
      setTriedLocal(true);
    } else {
      setImgError(true);
    }
  };

  const showLogo = !imgError;
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
            src={currentSrc}
            alt={name}
            className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
            onError={handleError}
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
  const navigate = useNavigate();
  const [mode, setMode] = useState<SearchMode>('marca');
  const [query, setQuery] = useState('');

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
    staleTime: 5 * 60 * 1000,
  });

  // "Marca" filters the grid live; "Nombre"/"Perfumista" route to their search pages.
  const filteredBrands = useMemo(() => {
    if (mode !== 'marca') return brands;
    const q = query.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, mode, query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (mode === 'perfume') navigate(`/search?q=${encodeURIComponent(q)}`);
    else if (mode === 'perfumista') navigate(`/perfumers?q=${encodeURIComponent(q)}`);
    // 'marca' filters in place — nothing to navigate.
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium mb-4">
            {t('brands.title')}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('brands.subtitle')}
          </p>
        </div>

        {/* Search bar: by brand / perfume name / perfumer */}
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-12">
          <div className="flex justify-center gap-1 mb-3" role="tablist" aria-label="Modo de búsqueda">
            {SEARCH_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200',
                  mode === m.id
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={SEARCH_MODES.find((m) => m.id === mode)!.placeholder}
              className="pl-10 pr-10 h-12 rounded-full"
              aria-label={SEARCH_MODES.find((m) => m.id === mode)!.placeholder}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                aria-label="Limpiar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {mode !== 'marca' && (
            <p className="text-center text-xs text-muted-foreground/70 mt-2">
              Pulsa Enter para buscar {mode === 'perfume' ? 'perfumes' : 'perfumistas'}.
            </p>
          )}
        </form>

        {/* Brands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
              ))
            : filteredBrands.map((brand, index) => (
                <BrandCard
                  key={brand.name}
                  name={brand.name}
                  count={brand.count}
                  imageUrl={brand.imageUrl}
                  index={index}
                />
              ))}
        </div>

        {/* Empty state when brand filter matches nothing */}
        {!isLoading && mode === 'marca' && query.trim() && filteredBrands.length === 0 && (
          <p className="text-center text-muted-foreground py-16">
            No se encontraron marcas para “{query.trim()}”.
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Brands;
