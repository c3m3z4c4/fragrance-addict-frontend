import { Link } from 'react-router-dom';

interface BrandBadgeProps {
    brand: string;
    brandImageUrl?: string | null; // representative perfume image to use as background hint
    className?: string;
}

function getInitials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
}

// Derive a subtle hue from brand name for the gradient accent
function brandHue(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
}

export function BrandBadge({ brand, className }: BrandBadgeProps) {
    const initials = getInitials(brand);
    const hue = brandHue(brand);

    return (
        <Link
            to={`/?brand=${encodeURIComponent(brand)}`}
            className={`group flex flex-col items-center gap-3 ${className ?? ''}`}
            title={`Ver todos los perfumes de ${brand}`}
        >
            {/* Monogram badge */}
            <div
                className="relative w-20 h-20 rounded-sm flex items-center justify-center border border-border/60 overflow-hidden transition-all duration-500 group-hover:border-accent/40 group-hover:shadow-lg"
                style={{
                    background: `linear-gradient(135deg, hsl(${hue} 20% 94%) 0%, hsl(${hue} 30% 88%) 100%)`,
                }}
            >
                {/* Decorative corner lines */}
                <span className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-foreground/20" />
                <span className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-foreground/20" />
                <span className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-foreground/20" />
                <span className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-foreground/20" />

                {/* Monogram */}
                <span
                    className="font-display font-bold tracking-widest text-xl select-none transition-colors duration-300 group-hover:text-accent"
                    style={{ color: `hsl(${hue} 40% 25%)` }}
                >
                    {initials}
                </span>
            </div>

            {/* Brand name */}
            <span className="text-xs uppercase tracking-widest text-muted-foreground text-center leading-tight group-hover:text-accent transition-colors duration-300 max-w-[90px]">
                {brand}
            </span>
        </Link>
    );
}
