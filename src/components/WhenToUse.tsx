import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SeasonUsage {
  winter: number;
  spring: number;
  summer: number;
  autumn: number;
  day: number;
  night: number;
}

interface WhenToUseProps {
  seasonUsage?: SeasonUsage | null;
  accords?: string[];
  concentration?: string;
  gender?: string;
  className?: string;
}

// ─── Accord-based usage estimation ───────────────────────────────────────────

const ACCORD_RULES: Array<{
  keywords: string[];
  w: Partial<Record<keyof SeasonUsage, number>>;
}> = [
  { keywords: ['fresh', 'citrus', 'aquatic', 'marine', 'light'], w: { summer: 30, spring: 20, day: 25, winter: -20, night: -10 } },
  { keywords: ['floral', 'rose', 'jasmine', 'floral'], w: { spring: 25, summer: 15, day: 20, autumn: -5 } },
  { keywords: ['green', 'herbal', 'aromatic', 'fougere'], w: { spring: 20, summer: 15, day: 20, night: -5 } },
  { keywords: ['fruity', 'tropical', 'sweet fruity'], w: { spring: 20, summer: 25, day: 15 } },
  { keywords: ['woody', 'earthy', 'mossy'], w: { autumn: 25, winter: 15, night: 15, summer: -15 } },
  { keywords: ['oriental', 'amber', 'warm spicy', 'balsamic'], w: { winter: 30, autumn: 20, night: 30, summer: -20, day: -15 } },
  { keywords: ['spicy', 'pepper', 'cinnamon', 'clove'], w: { winter: 20, autumn: 20, night: 20, summer: -10 } },
  { keywords: ['oud', 'leather', 'tobacco', 'smoky'], w: { winter: 30, night: 35, autumn: 15, summer: -25, day: -15 } },
  { keywords: ['sweet', 'vanilla', 'gourmand', 'caramel', 'honey'], w: { winter: 25, night: 25, autumn: 15, summer: -10 } },
  { keywords: ['musky', 'powdery', 'clean', 'soapy', 'white floral'], w: { day: 20, spring: 15, night: 10 } },
];

function estimateSeasonUsage(accords: string[], concentration?: string, gender?: string): SeasonUsage {
  const scores: SeasonUsage = { winter: 50, spring: 50, summer: 50, autumn: 50, day: 50, night: 50 };
  const lower = accords.map((a) => a.toLowerCase());

  for (const rule of ACCORD_RULES) {
    if (rule.keywords.some((kw) => lower.some((a) => a.includes(kw)))) {
      for (const [k, delta] of Object.entries(rule.w)) {
        const key = k as keyof SeasonUsage;
        scores[key] = Math.max(5, Math.min(100, scores[key] + (delta ?? 0)));
      }
    }
  }

  // Concentration adjustments
  const c = (concentration || '').toLowerCase();
  if (c.includes('extrait') || c.includes('parfum')) {
    scores.night += 15; scores.winter += 10; scores.day -= 10;
  } else if (c.includes('eau de cologne') || c.includes('fraiche')) {
    scores.summer += 15; scores.day += 15; scores.night -= 10;
  }

  // Gender adjustments
  if (gender === 'feminine') {
    scores.spring += 10; scores.day += 5;
  } else if (gender === 'masculine') {
    scores.night += 5; scores.autumn += 5;
  }

  // Normalize so max = 100
  const max = Math.max(...Object.values(scores));
  const result = {} as SeasonUsage;
  for (const k of Object.keys(scores)) {
    result[k as keyof SeasonUsage] = Math.round((scores[k as keyof SeasonUsage] / max) * 100);
  }
  return result;
}

// ─── CircleRing ──────────────────────────────────────────────────────────────

const RING_SIZE = 88;
const STROKE = 5.5;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CircleRing({
  pct,
  color,
  trackColor,
  icon,
  label,
}: {
  pct: number;
  color: string;
  trackColor: string;
  icon: string;
  label: string;
}) {
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center gap-2.5">
      {/* Ring + icon */}
      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          className="-rotate-90"
          style={{ display: 'block' }}
        >
          {/* Background track */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={trackColor}
            strokeWidth={STROKE}
          />
          {/* Progress arc */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>

        {/* Centered content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-2xl leading-none select-none">{icon}</span>
          <span
            className="text-[11px] font-semibold leading-none tabular-nums"
            style={{ color }}
          >
            {pct}%
          </span>
        </div>
      </div>

      {/* Label */}
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

// ─── Category config ─────────────────────────────────────────────────────────

interface CategoryConfig {
  key: keyof SeasonUsage;
  icon: string;
  color: string;
  track: string;
  labelKey: string;
}

const CATEGORIES: CategoryConfig[] = [
  { key: 'winter',  icon: '❄️',  color: '#60A5FA', track: 'rgba(96,165,250,0.15)',  labelKey: 'whenToUse.winter' },
  { key: 'spring',  icon: '🌸',  color: '#4ADE80', track: 'rgba(74,222,128,0.15)',  labelKey: 'whenToUse.spring' },
  { key: 'summer',  icon: '☀️',  color: '#FCA5A5', track: 'rgba(252,165,165,0.15)', labelKey: 'whenToUse.summer' },
  { key: 'autumn',  icon: '🍂',  color: '#FB923C', track: 'rgba(251,146,60,0.15)',  labelKey: 'whenToUse.autumn' },
  { key: 'day',     icon: '🌤️', color: '#FCD34D', track: 'rgba(252,211,77,0.15)',  labelKey: 'whenToUse.day' },
  { key: 'night',   icon: '🌙',  color: '#A5B4FC', track: 'rgba(165,180,252,0.15)', labelKey: 'whenToUse.night' },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function WhenToUse({ seasonUsage, accords = [], concentration, gender, className }: WhenToUseProps) {
  const { t } = useTranslation();

  // Use scraped data if available, otherwise estimate from accords
  const isEstimated = !seasonUsage;
  const data: SeasonUsage = seasonUsage ?? estimateSeasonUsage(accords, concentration, gender);

  // Don't render if we have no accords and no scraped data (nothing to show)
  if (!seasonUsage && accords.length === 0) return null;

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
          {t('whenToUse.title')}
        </h2>
      </div>

      {/* 6-column grid of circular rings */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-6">
        {CATEGORIES.map((cat) => (
          <CircleRing
            key={cat.key}
            pct={data[cat.key]}
            color={cat.color}
            trackColor={cat.track}
            icon={cat.icon}
            label={t(cat.labelKey)}
          />
        ))}
      </div>

      {/* Subtle note if estimated */}
      {isEstimated && (
        <p className="mt-4 text-[10px] text-muted-foreground/50 text-right">
          {t('whenToUse.estimated')}
        </p>
      )}
    </div>
  );
}
