import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface NotesPyramidVisualProps {
  notes: {
    top?: string[];
    heart?: string[];
    base?: string[];
  };
  className?: string;
}

type NoteCategory = 'top' | 'heart' | 'base';

const DOT_COLOR: Record<NoteCategory, string> = {
  top: 'bg-accent/60',
  heart: 'bg-gold/60',
  base: 'bg-amber/60',
};

const LABEL_COLOR: Record<NoteCategory, string> = {
  top: 'text-accent',
  heart: 'text-gold',
  base: 'text-amber',
};

function NoteCard({ note, category, delay }: { note: string; category: NoteCategory; delay: number }) {
  return (
    <div
      className="opacity-0 animate-fade-in flex flex-col items-center gap-1.5 w-[76px]"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Name above */}
      <span className="text-[11px] font-semibold text-foreground text-center leading-tight line-clamp-3 w-full">
        {note}
      </span>
      {/* White circle */}
      <div className="w-12 h-12 rounded-full bg-white border border-border/40 shadow-sm flex items-center justify-center flex-shrink-0">
        <div className={cn('w-2.5 h-2.5 rounded-full', DOT_COLOR[category])} />
      </div>
    </div>
  );
}

export function NotesPyramidVisual({ notes, className }: NotesPyramidVisualProps) {
  const { t } = useTranslation();
  const topNotes = [...new Set(notes?.top || [])];
  const heartNotes = [...new Set(notes?.heart || [])];
  const baseNotes = [...new Set(notes?.base || [])];

  if (!topNotes.length && !heartNotes.length && !baseNotes.length) {
    return null;
  }

  const renderSection = (
    noteList: string[],
    category: NoteCategory,
    label: string,
    baseDelay: number
  ) => {
    if (!noteList.length) return null;
    return (
      <div>
        <p className={cn('text-xs uppercase tracking-widest font-semibold mb-4', LABEL_COLOR[category])}>
          {label}
        </p>
        <div className="flex flex-wrap gap-4">
          {noteList.map((note, i) => (
            <NoteCard
              key={`${category}-${i}`}
              note={note}
              category={category}
              delay={baseDelay + i * 40}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-7', className)}>
      {renderSection(topNotes, 'top', t('notes.topNotes'), 0)}
      {renderSection(heartNotes, 'heart', t('notes.heartNotes'), 100)}
      {renderSection(baseNotes, 'base', t('notes.baseNotes'), 200)}
    </div>
  );
}
