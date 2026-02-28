import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Heart, Share2, Star } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { NotesPyramidVisual } from '@/components/NotesPyramidVisual';
import { PerformanceMetrics } from '@/components/PerformanceMetrics';
import { WhenToUse } from '@/components/WhenToUse';
import { SimilarPerfumesSection } from '@/components/SimilarPerfumesSection';
import { AccordBars } from '@/components/AccordBars';
import { BrandBadge } from '@/components/BrandBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { usePerfumeDetail, usePerfumes, findSimilarPerfumes } from '@/hooks/usePerfumeSearch';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { fetchBrands } from '@/lib/api';

const PerfumeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [showFullDescription, setShowFullDescription] = useState(false);

  const { data: perfume, isLoading, error } = usePerfumeDetail(id || '');
  const { data: allPerfumes } = usePerfumes(1, 50);
  const { data: brands } = useQuery({ queryKey: ['brands'], queryFn: fetchBrands, staleTime: 5 * 60 * 1000 });

  const favorite = perfume ? isFavorite(perfume.id) : false;
  const brandImageUrl = perfume && brands
    ? (brands.find(b => b.name === perfume.brand)?.imageUrl ?? null)
    : null;
  const similarPerfumes = perfume && allPerfumes?.perfumes
    ? findSimilarPerfumes(perfume, allPerfumes.perfumes, 4)
    : [];

  const handleShare = async () => {
    if (!perfume) return;

    // Try Web Share API (mobile / supported browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${perfume.name} by ${perfume.brand}`,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // User cancelled — don't proceed to clipboard copy
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // Try Clipboard API (requires HTTPS or localhost)
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Fallback for HTTP: textarea + execCommand
      const el = document.createElement('textarea');
      el.value = window.location.href;
      el.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }

    toast({
      title: t('perfume.linkCopied'),
      description: t('perfume.linkCopiedDesc'),
    });
  };

  const getGenderLabel = (gender?: string) => {
    if (!gender) return '';
    const genderKey = gender.toLowerCase() as 'masculine' | 'feminine' | 'unisex';
    return t(`perfume.${genderKey}`, { defaultValue: gender });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid lg:grid-cols-[1fr_1.2fr_300px] gap-10">
            <Skeleton className="aspect-[3/4] rounded-lg" />
            <div className="space-y-6">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !perfume) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl mb-4">{t('perfume.notFound')}</h1>
            <Link to="/" className="text-accent hover:underline">{t('perfume.returnToSearch')}</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </button>
        </div>

        {/* Product Section — 3-column on large screens */}
        <section className="container mx-auto px-4 pb-16">
          <div className="grid lg:grid-cols-[1fr_1.3fr_300px] gap-8 lg:gap-12 items-start">

            {/* ── Column 1: Image ── */}
            <div className="relative opacity-0 animate-fade-in-left" style={{ animationFillMode: 'forwards' }}>
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                <img
                  src={perfume.imageUrl || '/placeholder.svg'}
                  alt={perfume.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating Actions */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  title={favorite ? t('perfume.removedFromFavorites') : t('perfume.addedToFavorites')}
                  className={cn(
                    "bg-background/80 backdrop-blur-sm",
                    favorite && "text-accent"
                  )}
                  onClick={() => {
                    toggleFavorite(perfume.id);
                    toast({
                      title: favorite ? t('perfume.removedFromFavorites') : t('perfume.addedToFavorites'),
                      description: favorite
                        ? `${perfume.name} ${t('perfume.removedFromFavorites').toLowerCase()}`
                        : `${perfume.name} ${t('perfume.addedToFavorites').toLowerCase()}`,
                    });
                  }}
                >
                  <Heart className={cn("h-5 w-5", favorite && "fill-current")} />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  title={t('perfume.share', { defaultValue: 'Share' })}
                  className="bg-background/80 backdrop-blur-sm"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* ── Column 2: Details ── */}
            <div
              className="opacity-0 animate-fade-in-right"
              style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
            >
              {/* Brand Badge + Name */}
              <div className="flex items-start gap-5 mb-6">
                <BrandBadge brand={perfume.brand} imageUrl={brandImageUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                    {perfume.brand}
                  </p>
                  <h1 className="font-display text-3xl md:text-4xl font-medium leading-tight mb-3">
                    {perfume.name}
                  </h1>

                  {/* Rating */}
                  {perfume.rating && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-4 w-4",
                              star <= Math.floor(perfume.rating || 0)
                                ? "text-amber fill-current"
                                : "text-muted"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{perfume.rating.toFixed(1)}</span>
                      {perfume.concentration && (
                        <span className="text-sm text-muted-foreground">· {perfume.concentration}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 mb-8 py-5 border-y border-border">
                {perfume.perfumer && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t('perfume.perfumer')}</p>
                    <p className="font-medium text-sm">{perfume.perfumer.replace(/^perfumers?[,:]?\s*/i, '').trim()}</p>
                  </div>
                )}
                {perfume.year && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t('perfume.year')}</p>
                    <p className="font-medium text-sm">{perfume.year}</p>
                  </div>
                )}
                {perfume.gender && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t('perfume.gender')}</p>
                    <p className="font-medium text-sm">{getGenderLabel(perfume.gender)}</p>
                  </div>
                )}
                {perfume.concentration && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t('perfume.concentration')}</p>
                    <p className="font-medium text-sm">{perfume.concentration}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {perfume.description && (() => {
                const MAX_LEN = 220;
                const isLong = perfume.description.length > MAX_LEN;
                const displayed = showFullDescription || !isLong
                  ? perfume.description
                  : perfume.description.substring(0, MAX_LEN).trimEnd() + '…';
                return (
                  <div className="mb-8">
                    <h2 className="font-display text-lg mb-3">{t('perfume.aboutFragrance')}</h2>
                    <p className="text-muted-foreground leading-relaxed text-sm">{displayed}</p>
                    {isLong && (
                      <button
                        onClick={() => setShowFullDescription(v => !v)}
                        className="mt-2 text-xs text-accent hover:underline"
                      >
                        {showFullDescription ? t('perfume.readLess') : t('perfume.readMore')}
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Notes Pyramid */}
              {perfume.notes && (
                <NotesPyramidVisual notes={perfume.notes} />
              )}

              {/* Performance Metrics */}
              <PerformanceMetrics
                sillage={perfume.sillage}
                longevity={perfume.longevity}
                projection={perfume.projection}
                accords={perfume.accords}
                concentration={perfume.concentration}
              />

              {/* When To Use */}
              <WhenToUse
                seasonUsage={perfume.seasonUsage}
                accords={perfume.accords}
                concentration={perfume.concentration}
                gender={perfume.gender}
                className="mt-2"
              />

              {/* Accord bars on mobile (below details, since col 3 is hidden on mobile) */}
              {perfume.accords && perfume.accords.length > 0 && (
                <div className="mt-8 lg:hidden">
                  <AccordBars accords={perfume.accords} />
                </div>
              )}
            </div>

            {/* ── Column 3: Accord Bars (desktop sidebar, sticky) ── */}
            {perfume.accords && perfume.accords.length > 0 && (
              <div
                className="hidden lg:block opacity-0 animate-fade-in"
                style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}
              >
                <div className="sticky top-24">
                  <AccordBars accords={perfume.accords} />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Similar Perfumes */}
        {(similarPerfumes.length > 0 || (perfume.similarPerfumes && perfume.similarPerfumes.length > 0)) && (
          <section className="container mx-auto px-4 py-12 border-t border-border">
            <SimilarPerfumesSection
              similarFromDatabase={similarPerfumes}
              similarExternal={perfume.similarPerfumes}
            />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PerfumeDetail;
