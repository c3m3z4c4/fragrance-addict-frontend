import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type GenderFilter = 'all' | 'masculine' | 'feminine' | 'unisex';

interface GenderOption {
  value: GenderFilter;
  label: string;
  symbol: string;
  idle: string;
  active: string;
  /** Borderless styles for compact (inside search bar) mode */
  idleCompact: string;
  activeCompact: string;
}

// Gender symbols using Unicode — ♂ ♀ ⚥
const OPTIONS: GenderOption[] = [
  {
    value: 'masculine',
    label: 'search.masculine',
    symbol: '♂',
    idle:          'border-blue-400 text-blue-400 hover:bg-blue-400/10',
    active:        'bg-blue-500 border-blue-500 text-white shadow-blue-500/30 shadow-md',
    idleCompact:   'border-transparent text-muted-foreground/60 hover:text-blue-400 hover:bg-blue-400/10',
    activeCompact: 'border-transparent bg-blue-500/15 text-blue-500',
  },
  {
    value: 'feminine',
    label: 'search.feminine',
    symbol: '♀',
    idle:          'border-pink-400 text-pink-400 hover:bg-pink-400/10',
    active:        'bg-pink-500 border-pink-500 text-white shadow-pink-500/30 shadow-md',
    idleCompact:   'border-transparent text-muted-foreground/60 hover:text-pink-400 hover:bg-pink-400/10',
    activeCompact: 'border-transparent bg-pink-500/15 text-pink-500',
  },
  {
    value: 'unisex',
    label: 'search.unisex',
    symbol: '⚥',
    idle:          'border-purple-400 text-purple-400 hover:bg-purple-400/10',
    active:        'bg-purple-500 border-purple-500 text-white shadow-purple-500/30 shadow-md',
    idleCompact:   'border-transparent text-muted-foreground/60 hover:text-purple-400 hover:bg-purple-400/10',
    activeCompact: 'border-transparent bg-purple-500/15 text-purple-500',
  },
];

interface GenderFilterButtonsProps {
  value: GenderFilter;
  onChange: (v: GenderFilter) => void;
  className?: string;
  /** Show text labels below symbol (default true) */
  showLabels?: boolean;
  /** Compact mode: smaller buttons for use inside the search bar */
  compact?: boolean;
}

export function GenderFilterButtons({
  value,
  onChange,
  className,
  showLabels = true,
  compact = false,
}: GenderFilterButtonsProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(isActive ? 'all' : opt.value)}
            title={t(opt.label)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 transition-all duration-200 select-none',
              compact
                ? 'w-9 h-9 rounded-full'
                : 'rounded-xl border-2',
              compact
                ? (isActive ? opt.activeCompact : opt.idleCompact)
                : (isActive ? opt.active : opt.idle),
              !compact && (showLabels ? 'w-14 h-14' : 'w-10 h-10'),
            )}
          >
            <span className={cn('leading-none', compact ? 'text-base' : showLabels ? 'text-xl' : 'text-lg')}>
              {opt.symbol}
            </span>
            {showLabels && !compact && (
              <span className="text-[9px] uppercase tracking-wider font-semibold leading-none opacity-80">
                {t(opt.label)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
