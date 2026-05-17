import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchBrands, type BrandInfo } from '@/lib/api';

interface BrandFilterCarouselProps {
    /** Brands derived from the perfume list, ordered by recency */
    brands: string[];
    selected: string | null;
    onSelect: (brand: string | null) => void;
}

function BrandAvatar({
    brand,
    logoUrl,
    size = 64,
}: {
    brand: string;
    logoUrl?: string | null;
    size?: number;
}) {
    const [imgError, setImgError] = useState(false);
    const initial = brand.charAt(0).toUpperCase();

    if (logoUrl && !imgError) {
        return (
            <img
                src={logoUrl}
                alt={brand}
                onError={() => setImgError(true)}
                style={{ width: size, height: size }}
                className="rounded-full object-contain bg-background p-1"
            />
        );
    }

    // Deterministic pastel hue from brand name
    const hue = brand.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

    return (
        <span
            style={{
                width: size,
                height: size,
                background: `hsl(${hue} 30% 82%)`,
                color: `hsl(${hue} 40% 30%)`,
                fontSize: size * 0.38,
            }}
            className="flex items-center justify-center rounded-full font-semibold select-none shrink-0"
        >
            {initial}
        </span>
    );
}

export function BrandFilterCarousel({ brands, selected, onSelect }: BrandFilterCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [logoMap, setLogoMap] = useState<Record<string, string | null>>({});

    // Fetch logos once
    useEffect(() => {
        fetchBrands().then((list: BrandInfo[]) => {
            const map: Record<string, string | null> = {};
            list.forEach((b) => {
                map[b.name.toLowerCase()] = b.imageUrl ?? null;
            });
            setLogoMap(map);
        });
    }, []);

    const updateArrows = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 8);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        updateArrows();
        el.addEventListener('scroll', updateArrows, { passive: true });
        const ro = new ResizeObserver(updateArrows);
        ro.observe(el);
        return () => {
            el.removeEventListener('scroll', updateArrows);
            ro.disconnect();
        };
    }, [brands, updateArrows]);

    const scroll = (dir: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        const amount = el.clientWidth * 0.55;
        el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    // Scroll selected item into view
    useEffect(() => {
        if (!scrollRef.current) return;
        const idx = selected ? brands.indexOf(selected) + 1 : 0; // +1 for "Todas"
        const items = scrollRef.current.querySelectorAll('[data-brand-item]');
        items[idx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, [selected, brands]);

    if (brands.length === 0) return null;

    return (
        <div className="relative mb-10 md:mb-14 w-full overflow-hidden">
            {/* Section label */}
            <p className="text-center text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground/45 mb-5">
                Filtrar por marca
            </p>

            {/* Fade edges */}
            <div
                className={cn(
                    'absolute left-0 top-0 bottom-0 w-14 z-10 pointer-events-none transition-opacity duration-300',
                    canScrollLeft ? 'opacity-100' : 'opacity-0'
                )}
                style={{ background: 'linear-gradient(to right, hsl(var(--background)), transparent)' }}
            />
            <div
                className={cn(
                    'absolute right-0 top-0 bottom-0 w-14 z-10 pointer-events-none transition-opacity duration-300',
                    canScrollRight ? 'opacity-100' : 'opacity-0'
                )}
                style={{ background: 'linear-gradient(to left, hsl(var(--background)), transparent)' }}
            />

            {/* Arrow — left */}
            <button
                onClick={() => scroll('left')}
                className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full',
                    'flex items-center justify-center',
                    'bg-background border border-border/60 shadow-sm',
                    'text-foreground/50 hover:text-accent hover:border-accent/40 transition-all duration-200',
                    canScrollLeft ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
                )}
                aria-label="Scroll left"
            >
                <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {/* Arrow — right */}
            <button
                onClick={() => scroll('right')}
                className={cn(
                    'absolute right-0 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full',
                    'flex items-center justify-center',
                    'bg-background border border-border/60 shadow-sm',
                    'text-foreground/50 hover:text-accent hover:border-accent/40 transition-all duration-200',
                    canScrollRight ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
                )}
                aria-label="Scroll right"
            >
                <ChevronRight className="h-3.5 w-3.5" />
            </button>

            {/* Scrollable track */}
            <div
                ref={scrollRef}
                className="overflow-x-auto scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
            <div className="flex items-start gap-4 md:gap-6 px-10 md:px-12 pb-2 w-max min-w-full justify-center">
                {/* "Todas" pill */}
                <button
                    data-brand-item
                    onClick={() => onSelect(null)}
                    className={cn(
                        'group flex flex-col items-center gap-2 shrink-0 transition-all duration-200',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-xl'
                    )}
                >
                    {/* Avatar */}
                    <div
                        className={cn(
                            'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-250',
                            'ring-2 ring-offset-2 ring-offset-background',
                            selected === null
                                ? 'ring-accent bg-accent/10'
                                : 'ring-transparent bg-secondary/30 group-hover:ring-border group-hover:bg-secondary/50'
                        )}
                    >
                        <LayoutGrid
                            className={cn(
                                'h-5 w-5 transition-colors duration-200',
                                selected === null ? 'text-accent' : 'text-foreground/40 group-hover:text-foreground/70'
                            )}
                        />
                    </div>
                    {/* Label */}
                    <span
                        className={cn(
                            'text-[11px] font-semibold tracking-wide leading-none max-w-[72px] text-center truncate transition-colors duration-200',
                            selected === null ? 'text-accent' : 'text-foreground/45 group-hover:text-foreground/70'
                        )}
                    >
                        Todas
                    </span>
                </button>

                {/* Brand items */}
                {brands.map((brand) => {
                    const logo = logoMap[brand.toLowerCase()];
                    const isActive = selected === brand;

                    return (
                        <button
                            key={brand}
                            data-brand-item
                            onClick={() => onSelect(isActive ? null : brand)}
                            className={cn(
                                'group flex flex-col items-center gap-2 shrink-0 transition-all duration-200',
                                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-xl'
                            )}
                        >
                            {/* Avatar */}
                            <div
                                className={cn(
                                    'w-16 h-16 rounded-full overflow-hidden transition-all duration-250',
                                    'ring-2 ring-offset-2 ring-offset-background',
                                    isActive
                                        ? 'ring-accent shadow-[0_0_0_4px_hsl(var(--accent)/0.08)]'
                                        : 'ring-transparent group-hover:ring-border/60'
                                )}
                            >
                                <BrandAvatar brand={brand} logoUrl={logo} size={64} />
                            </div>
                            {/* Label */}
                            <span
                                className={cn(
                                    'text-[11px] font-semibold tracking-wide leading-none max-w-[72px] text-center truncate transition-colors duration-200',
                                    isActive
                                        ? 'text-accent'
                                        : 'text-foreground/45 group-hover:text-foreground/70'
                                )}
                            >
                                {brand}
                            </span>
                        </button>
                    );
                })}
            </div>
            </div>
        </div>
    );
}
