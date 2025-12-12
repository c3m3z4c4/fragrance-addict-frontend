import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, ExternalLink } from 'lucide-react';
import type { APIPerfume } from '@/lib/api';

interface SimilarPerfumeExternal {
  name: string;
  url: string;
  imageUrl?: string;
}

interface SimilarPerfumesSectionProps {
  similarFromDatabase: APIPerfume[];
  similarExternal?: SimilarPerfumeExternal[];
}

export function SimilarPerfumesSection({ similarFromDatabase, similarExternal }: SimilarPerfumesSectionProps) {
  const { t } = useTranslation();
  
  const hasDatabase = similarFromDatabase.length > 0;
  const hasExternal = similarExternal && similarExternal.length > 0;
  
  if (!hasDatabase && !hasExternal) return null;

  return (
    <section className="py-12">
      <h3 className="font-display text-2xl font-medium mb-6">{t('similar.title')}</h3>
      
      {/* From Database */}
      {hasDatabase && (
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-4">{t('similar.fromDatabase')}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similarFromDatabase.map((perfume, index) => (
              <Link
                key={perfume.id}
                to={`/perfume/${perfume.id}`}
                className="group block opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
              >
                <div className="hover-lift">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary/20 mb-3">
                    <img
                      src={perfume.imageUrl || '/placeholder.svg'}
                      alt={perfume.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {perfume.rating && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-background/90 backdrop-blur-sm rounded text-xs">
                        <Star className="h-2.5 w-2.5 fill-accent text-accent" />
                        <span>{perfume.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{perfume.brand}</p>
                  <h4 className="font-medium text-sm group-hover:text-accent transition-colors line-clamp-1">
                    {perfume.name}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* External Similar Perfumes */}
      {hasExternal && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">{t('similar.external')}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {similarExternal.slice(0, 10).map((perfume, index) => (
              <a
                key={`${perfume.name}-${index}`}
                href={perfume.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
              >
                <div className="hover-lift">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary/20 mb-3">
                    {perfume.imageUrl ? (
                      <img
                        src={perfume.imageUrl}
                        alt={perfume.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-4xl">🌸</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>
                  <h4 className="font-medium text-sm group-hover:text-accent transition-colors line-clamp-2">
                    {perfume.name}
                  </h4>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
