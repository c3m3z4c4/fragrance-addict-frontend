import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useNoteImage } from '@/hooks/useNoteImage';

interface NotesPyramidVisualProps {
  notes: {
    top?: string[];
    heart?: string[];
    base?: string[];
  };
  className?: string;
}

type NoteCategory = 'top' | 'heart' | 'base';

const LABEL_COLOR: Record<NoteCategory, string> = {
  top: 'text-accent',
  heart: 'text-gold',
  base: 'text-amber',
};

const PLACEHOLDER_BG: Record<NoteCategory, string> = {
  top: 'bg-accent/10',
  heart: 'bg-gold/10',
  base: 'bg-amber/10',
};

const PLACEHOLDER_TEXT: Record<NoteCategory, string> = {
  top: 'text-accent/60',
  heart: 'text-gold/60',
  base: 'text-amber/60',
};

function NoteCard({
  note,
  category,
  delay,
}: {
  note: string;
  category: NoteCategory;
  delay: number;
}) {
  const imageUrl = useNoteImage(note);
  const [imgError, setImgError] = useState(false);
  const showImage = imageUrl && !imgError;

  return (
    <div
      className="opacity-0 animate-fade-in flex flex-col items-center gap-1.5 w-[76px]"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Image / placeholder */}
      <div
        className={cn(
          'w-[72px] h-[72px] rounded-2xl overflow-hidden border border-border/30 shadow-sm flex items-center justify-center',
          showImage ? 'bg-white' : PLACEHOLDER_BG[category]
        )}
      >
        {showImage ? (
          <img
            src={imageUrl}
            alt={note}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className={cn('text-lg font-semibold select-none', PLACEHOLDER_TEXT[category])}>
            {note.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Note name below */}
      <span className="text-[11px] font-medium text-foreground text-center leading-tight line-clamp-2 w-full">
        {note}
      </span>
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
