import { cn } from '@/lib/utils';

interface NotesPyramidVisualProps {
  notes: {
    top?: string[];
    heart?: string[];
    base?: string[];
  };
  className?: string;
}

export function NotesPyramidVisual({ notes, className }: NotesPyramidVisualProps) {
  const topNotes = notes?.top || [];
  const heartNotes = notes?.heart || [];
  const baseNotes = notes?.base || [];

  if (!topNotes.length && !heartNotes.length && !baseNotes.length) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      <h3 className="font-display text-2xl font-medium">Fragrance Notes</h3>
      
      <div className="relative">
        {/* Pyramid visualization */}
        <div className="flex flex-col items-center gap-4">
          {/* Top Notes */}
          {topNotes.length > 0 && (
            <div className="w-full max-w-md animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-8 rounded-full bg-gradient-to-b from-accent to-accent/50" />
                <div>
                  <p className="text-sm uppercase tracking-wider text-accent font-medium">Top Notes</p>
                  <p className="text-xs text-muted-foreground">First impression (0-30 min)</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pl-4">
                {topNotes.map((note, i) => (
                  <span
                    key={note}
                    className="px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-sm text-foreground hover:bg-accent/20 transition-colors cursor-default"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Heart Notes */}
          {heartNotes.length > 0 && (
            <div className="w-full max-w-lg animate-fade-in animation-delay-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-8 rounded-full bg-gradient-to-b from-gold to-gold/50" />
                <div>
                  <p className="text-sm uppercase tracking-wider text-gold font-medium">Heart Notes</p>
                  <p className="text-xs text-muted-foreground">The core (30 min - 4 hrs)</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pl-4">
                {heartNotes.map((note, i) => (
                  <span
                    key={note}
                    className="px-3 py-1.5 bg-gold/10 border border-gold/20 rounded-full text-sm text-foreground hover:bg-gold/20 transition-colors cursor-default"
                    style={{ animationDelay: `${i * 50 + 100}ms` }}
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Base Notes */}
          {baseNotes.length > 0 && (
            <div className="w-full max-w-xl animate-fade-in animation-delay-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-8 rounded-full bg-gradient-to-b from-amber to-amber/50" />
                <div>
                  <p className="text-sm uppercase tracking-wider text-amber font-medium">Base Notes</p>
                  <p className="text-xs text-muted-foreground">The foundation (4+ hrs)</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pl-4">
                {baseNotes.map((note, i) => (
                  <span
                    key={note}
                    className="px-3 py-1.5 bg-amber/10 border border-amber/20 rounded-full text-sm text-foreground hover:bg-amber/20 transition-colors cursor-default"
                    style={{ animationDelay: `${i * 50 + 200}ms` }}
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
