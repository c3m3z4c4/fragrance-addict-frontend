import { cn } from '@/lib/utils';

interface NotePyramidProps {
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
}

export function NotePyramid({ notes }: NotePyramidProps) {
  return (
    <div className="space-y-6">
      {/* Top Notes */}
      <div className="opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 rounded-full bg-gold" />
          <h4 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
            Top Notes
          </h4>
          <span className="text-xs text-muted-foreground/60">(first impression)</span>
        </div>
        <div className="flex flex-wrap gap-2 pl-6">
          {notes.top.map((note, i) => (
            <span
              key={note}
              className={cn(
                "px-3 py-1.5 text-sm bg-gold/10 border border-gold/30 rounded-full",
                "hover:bg-gold/20 transition-colors cursor-default"
              )}
              style={{ animationDelay: `${150 + i * 50}ms` }}
            >
              {note}
            </span>
          ))}
        </div>
      </div>

      {/* Heart Notes */}
      <div className="opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <h4 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
            Heart Notes
          </h4>
          <span className="text-xs text-muted-foreground/60">(core fragrance)</span>
        </div>
        <div className="flex flex-wrap gap-2 pl-6">
          {notes.heart.map((note, i) => (
            <span
              key={note}
              className={cn(
                "px-3 py-1.5 text-sm bg-accent/10 border border-accent/30 rounded-full",
                "hover:bg-accent/20 transition-colors cursor-default"
              )}
              style={{ animationDelay: `${250 + i * 50}ms` }}
            >
              {note}
            </span>
          ))}
        </div>
      </div>

      {/* Base Notes */}
      <div className="opacity-0 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 rounded-full bg-amber" />
          <h4 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
            Base Notes
          </h4>
          <span className="text-xs text-muted-foreground/60">(lasting foundation)</span>
        </div>
        <div className="flex flex-wrap gap-2 pl-6">
          {notes.base.map((note, i) => (
            <span
              key={note}
              className={cn(
                "px-3 py-1.5 text-sm bg-amber/10 border border-amber/30 rounded-full",
                "hover:bg-amber/20 transition-colors cursor-default"
              )}
              style={{ animationDelay: `${350 + i * 50}ms` }}
            >
              {note}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
