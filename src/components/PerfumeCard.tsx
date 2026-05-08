import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { type APIPerfume } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PerfumeCardProps {
  perfume: APIPerfume;
  index?: number;
}

export function PerfumeCard({ perfume, index = 0 }: PerfumeCardProps) {
  const { t } = useTranslation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorite = isFavorite(perfume.id);

  return (
    <article
      className={cn(
        'group relative bg-card rounded-sm overflow-hidden',
        'border border-border/50 hover:border-accent/20',
        'transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-foreground/8',
        'opacity-0 animate-fade-in'
      )}
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'forwards',
      }}
    >
      {/* Image */}
      <Link to={`/perfume/${perfume.id}`} className="block aspect-[3/4] relative overflow-hidden bg-secondary/15">
        <img
          src={perfume.imageUrl}
          alt={perfume.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* View details pill */}
        <div className="absolute inset-0 flex items-end justify-center pb-5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-3 group-hover:translate-y-0">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/90 px-4 py-1.5 bg-foreground/30 backdrop-blur-sm rounded-full">
            {t('common.viewDetails')}
          </span>
        </div>
      </Link>

      {/* Favorite Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'absolute top-3 right-3 h-8 w-8 rounded-full',
          'bg-background/80 backdrop-blur-sm hover:bg-background',
          'transition-all duration-200',
          favorite ? 'text-accent' : 'text-foreground/40 hover:text-foreground/70'
        )}
        onClick={(e) => {
          e.preventDefault();
          toggleFavorite(perfume.id);
        }}
      >
        <Heart className={cn('h-4 w-4', favorite && 'fill-current')} />
      </Button>

      {/* Content */}
      <div className="p-4 md:p-5">
        <p className="text-[10px] font-bold text-muted-foreground/65 uppercase tracking-[0.15em] mb-1">
          {perfume.brand}
        </p>
        <h3 className="font-display text-base font-medium leading-tight mb-2">
          <Link to={`/perfume/${perfume.id}`} className="hover:text-accent transition-colors">
            {perfume.name}
          </Link>
        </h3>

        {/* Top notes preview */}
        <p className="text-xs text-muted-foreground/70 line-clamp-1 mb-3 tracking-wide">
          {(perfume.notes?.top ?? []).slice(0, 3).join(' · ')}
        </p>

        {/* Rating */}
        {perfume.rating && (
          <div className="flex items-center gap-1">
            <span className="text-amber text-sm leading-none">★</span>
            <span className="text-xs font-bold">{perfume.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </article>
  );
}
