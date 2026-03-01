import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Triangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNoteImage, translateNote } from '@/hooks/useNoteImage';

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
  top: 'text-accent/40',
  heart: 'text-gold/40',
  base: 'text-amber/40',
};

const DIVIDER_COLOR: Record<NoteCategory, string> = {
  top: 'border-accent/20',
  heart: 'border-gold/20',
  base: 'border-amber/20',
};


function NoteCard({
  note,
  displayName,
  category,
  delay,
}: {
  note: string;
  displayName: string;
  category: NoteCategory;
  delay: number;
}) {
  const imageUrl = useNoteImage(note);
  const [imgError, setImgError] = useState(false);
  const showImage = imageUrl && !imgError;

  return (
    <div
      className="opacity-0 animate-fade-in flex flex-col items-center gap-1.5"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards', width: 72 }}
    >
      <div
        className={cn(
          'w-[68px] h-[68px] rounded-xl overflow-hidden border border-border/30 shadow-sm flex items-center justify-center flex-shrink-0',
          showImage ? 'bg-white' : PLACEHOLDER_BG[category]
        )}
      >
        {showImage ? (
          <img
            src={imageUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className={cn('text-lg font-semibold select-none', PLACEHOLDER_TEXT[category])}>
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium text-foreground/80 text-center leading-tight line-clamp-2 w-full">
        {displayName}
      </span>
    </div>
  );
}

export function NotesPyramidVisual({ notes, className }: NotesPyramidVisualProps) {
  const { t, i18n } = useTranslation();

  const rawTop = [...new Set(notes?.top || [])];
  const rawHeart = [...new Set(notes?.heart || [])];
  const rawBase = [...new Set(notes?.base || [])];

  if (!rawTop.length && !rawHeart.length && !rawBase.length) {
    return null;
  }

  const topNotes = rawTop;
  const heartNotes = rawHeart;
  const baseNotes = rawBase;

  const lang = i18n.language;

  const SECTIONS: Array<{ list: string[]; cat: NoteCategory; label: string; delay: number }> = [
    { list: topNotes, cat: 'top', label: t('notes.topNotes'), delay: 0 },
    { list: heartNotes, cat: 'heart', label: t('notes.heartNotes'), delay: 120 },
    { list: baseNotes, cat: 'base', label: t('notes.baseNotes'), delay: 240 },
  ];

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Triangle className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
          {t('notes.pyramidTitle')}
        </h2>
      </div>

      {/* Always render all 3 sections */}
      <div className="space-y-0">
        {SECTIONS.map(({ list, cat, label, delay }, idx) => (
          <div key={cat}>
            <div className={cn('py-6', idx > 0 && `border-t ${DIVIDER_COLOR[cat]}`)}>
              {/* Section label */}
              <p className={cn(
                'text-[10px] uppercase tracking-[0.18em] font-semibold text-center mb-4',
                LABEL_COLOR[cat]
              )}>
                {label}
              </p>

              {/* Notes or empty placeholder */}
              {list.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-5">
                  {list.map((note, i) => (
                    <NoteCard
                      key={`${cat}-${i}`}
                      note={note}
                      displayName={translateNote(note, lang)}
                      category={cat}
                      delay={delay + i * 35}
                    />
                  ))}
                </div>
              ) : (
                <p className={cn(
                  'text-center text-[11px]',
                  PLACEHOLDER_TEXT[cat]
                )}>
                  —
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
