import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePerfumes } from '@/hooks/usePerfumeSearch';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ITEMS_PER_PAGE = 8;

/* Four-point star ornament — used in section dividers */
function StarOrnament({ className = '' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            <path d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z" />
        </svg>
    );
}

export function TrendingPerfumes() {
    const [currentPage, setCurrentPage] = useState(1);
    const { t } = useTranslation();

    const { data, isLoading, error } = usePerfumes(1, 100);

    const allPerfumes = data?.perfumes || [];
    const totalPages = Math.ceil(allPerfumes.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const perfumes = allPerfumes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    if (error) {
        return (
            <section className="py-16">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground">{t('catalog.empty')}</p>
                </div>
            </section>
        );
    }

    return (
        <section className="py-20 md:py-28">
            <div className="container mx-auto px-4">

                {/* ── Section header ──────────────────────────────────────── */}
                <div className="flex flex-col items-center text-center mb-14 md:mb-16">
                    {/* Decorative ornament rule */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px w-10 bg-border" />
                        <StarOrnament className="h-3 w-3 fill-amber/60" />
                        <div className="h-px w-10 bg-border" />
                    </div>

                    <h2 className="font-display text-3xl md:text-5xl font-light tracking-wide mb-4">
                        {t('catalog.recentlyAdded')}
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                        {t('catalog.exploreLatest')}
                    </p>
                </div>

                {/* ── Loading skeletons ────────────────────────────────────── */}
                {isLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="aspect-[3/4] rounded-sm" />
                                <Skeleton className="h-3 w-1/2" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-2/5" />
                            </div>
                        ))}
                    </div>

                ) : perfumes.length > 0 ? (
                    <>
                        {/* ── Perfume grid ─────────────────────────────────── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
                            {perfumes.map((perfume, index) => (
                                <Link
                                    key={perfume.id}
                                    to={`/perfume/${perfume.id}`}
                                    className="group block opacity-0 animate-fade-in"
                                    style={{
                                        animationDelay: `${index * 60}ms`,
                                        animationFillMode: 'forwards',
                                    }}
                                >
                                    <article>
                                        {/* Image container — portrait 3:4 */}
                                        <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-secondary/20 mb-4">
                                            <img
                                                src={perfume.imageUrl || '/placeholder.svg'}
                                                alt={perfume.name}
                                                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                                                loading="lazy"
                                            />

                                            {/* Hover gradient overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                            {/* View details pill */}
                                            <div className="absolute inset-0 flex items-end justify-center pb-5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-400">
                                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/90 bg-foreground/35 backdrop-blur-sm px-4 py-1.5 rounded-full">
                                                    {t('common.viewDetails')}
                                                </span>
                                            </div>

                                            {/* Rating badge */}
                                            {perfume.rating && (
                                                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 bg-background/90 backdrop-blur-sm rounded-full">
                                                    <Star className="h-2.5 w-2.5 fill-amber text-amber" />
                                                    <span className="text-[10px] font-bold">
                                                        {perfume.rating.toFixed(1)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card info */}
                                        <div className="space-y-1 px-0.5">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/65">
                                                {perfume.brand}
                                            </p>
                                            <h3 className="font-display text-base font-medium leading-tight group-hover:text-accent transition-colors duration-300">
                                                {perfume.name}
                                            </h3>
                                            {perfume.accords && perfume.accords.length > 0 && (
                                                <div className="flex flex-wrap gap-1 pt-1.5">
                                                    {perfume.accords.slice(0, 2).map((accord) => (
                                                        <span
                                                            key={accord}
                                                            className="text-[10px] px-2 py-0.5 bg-secondary/25 rounded-full text-foreground/70"
                                                        >
                                                            {accord}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                </Link>
                            ))}
                        </div>

                        {/* ── Pagination ──────────────────────────────────── */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase font-bold"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    {t('common.previous')}
                                </Button>

                                <div className="flex items-center gap-1 flex-wrap justify-center">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setCurrentPage(page)}
                                            className="min-w-[34px] h-8 text-xs font-bold"
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase font-bold"
                                >
                                    {t('common.next')}
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                    </>

                ) : (
                    /* ── Empty state ─────────────────────────────────────── */
                    <div className="text-center py-24">
                        <StarOrnament className="h-6 w-6 fill-border mx-auto mb-6" />
                        <p className="text-muted-foreground">{t('catalog.empty')}</p>
                        <p className="text-xs text-muted-foreground/50 mt-2 tracking-wide">
                            {t('catalog.addViaScraping')}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
