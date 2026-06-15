import { useRef, type ReactNode } from 'react';
import { BlossomCarousel, type BlossomCarouselHandle } from '@blossom-carousel/react';
import '@blossom-carousel/core/style.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarouselProps {
  /** Slides — each child becomes one horizontally-scrollable item. */
  children: ReactNode;
  /** Tailwind width (and optional responsive) class applied to every slide, e.g. "w-44 md:w-52". */
  slideClassName?: string;
  /** Extra classes for the outer wrapper. */
  className?: string;
  /** Accessible label for the scroll region. */
  ariaLabel?: string;
  /** Hide the prev/next arrows (drag + native scroll still work). */
  hideArrows?: boolean;
  /** Alignment used when paging with the arrows. */
  align?: 'start' | 'center' | 'end';
}

/**
 * Reusable carousel built on Blossom Carousel — native browser scrolling enhanced
 * with drag physics on pointer devices (0kb on touch). Use for any horizontal rail:
 * recent perfumes, similar perfumes, brand strips, etc.
 *
 * Usage:
 *   <Carousel slideClassName="w-44 md:w-52" ariaLabel="Perfumes similares">
 *     {items.map((p) => <PerfumeCard key={p.id} {...p} />)}
 *   </Carousel>
 */
export function Carousel({
  children,
  slideClassName = 'w-44 md:w-52',
  className,
  ariaLabel,
  hideArrows = false,
  align = 'start',
}: CarouselProps) {
  const ref = useRef<BlossomCarouselHandle>(null);
  const slides = Array.isArray(children) ? children : [children];

  const arrowBase =
    'absolute top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full flex items-center justify-center ' +
    'bg-background border border-border/60 shadow-sm text-foreground/60 ' +
    'hover:text-accent hover:border-accent/40 transition-all duration-200 ' +
    'opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100';

  return (
    <div className={cn('relative group/carousel', className)}>
      {!hideArrows && (
        <>
          <button
            type="button"
            onClick={() => ref.current?.prev({ align })}
            className={cn(arrowBase, '-left-3 md:-left-4')}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => ref.current?.next({ align })}
            className={cn(arrowBase, '-right-3 md:-right-4')}
            aria-label="Siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      <BlossomCarousel ref={ref} as="ul" aria-label={ariaLabel} className="py-1">
        {slides.map((slide, i) => (
          <li key={i} className={cn('pr-4 last:pr-0 align-top', slideClassName)}>
            {slide}
          </li>
        ))}
      </BlossomCarousel>
    </div>
  );
}
