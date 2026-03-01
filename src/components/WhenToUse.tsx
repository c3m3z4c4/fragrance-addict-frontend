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

  const c = (concentration || '').toLowerCase();
  if (c.includes('extrait') || c.includes('parfum')) {
    scores.night += 15; scores.winter += 10; scores.day -= 10;
  } else if (c.includes('eau de cologne') || c.includes('fraiche')) {
    scores.summer += 15; scores.day += 15; scores.night -= 10;
  }

  if (gender === 'feminine') {
    scores.spring += 10; scores.day += 5;
  } else if (gender === 'masculine') {
    scores.night += 5; scores.autumn += 5;
  }

  const max = Math.max(...Object.values(scores));
  const result = {} as SeasonUsage;
  for (const k of Object.keys(scores)) {
    result[k as keyof SeasonUsage] = Math.round((scores[k as keyof SeasonUsage] / max) * 100);
  }
  return result;
}

// ─── Category config ──────────────────────────────────────────────────────────

interface CategoryConfig {
  key: keyof SeasonUsage;
  icon: string;
  color: string;
  labelKey: string;
}

const SEASON_CATEGORIES: CategoryConfig[] = [
  { key: 'winter', icon: '❄️', color: '#60A5FA', labelKey: 'whenToUse.winter' },
  { key: 'spring', icon: '🌸', color: '#4ADE80', labelKey: 'whenToUse.spring' },
  { key: 'summer', icon: '☀️', color: '#FCA5A5', labelKey: 'whenToUse.summer' },
  { key: 'autumn', icon: '🍂', color: '#FB923C', labelKey: 'whenToUse.autumn' },
];

const TIME_CATEGORIES: CategoryConfig[] = [
  { key: 'day',   icon: '🌤️', color: '#FCD34D', labelKey: 'whenToUse.day' },
  { key: 'night', icon: '🌙', color: '#A5B4FC', labelKey: 'whenToUse.night' },
];

// ─── HorizontalBar ────────────────────────────────────────────────────────────

function HorizontalBar({ icon, label, pct, color }: { icon: string; label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      {/* Icon + label */}
      <div className="flex items-center gap-1.5 w-24 shrink-0">
        <span className="text-base leading-none select-none">{icon}</span>
        <span className="text-[11px] font-medium text-muted-foreground truncate">{label}</span>
      </div>
      {/* Bar */}
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {/* Score */}
      <span
        className="text-[11px] font-semibold tabular-nums w-7 text-right shrink-0"
        style={{ color }}
      >
        {pct}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WhenToUse({ seasonUsage, accords = [], concentration, gender, className }: WhenToUseProps) {
  const { t } = useTranslation();

  const isEstimated = !seasonUsage;
  const data: SeasonUsage = seasonUsage ?? estimateSeasonUsage(accords, concentration, gender);

  if (!seasonUsage && accords.length === 0) return null;

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
          {t('whenToUse.title')}
        </h2>
      </div>

      {/* Seasons */}
      <div className="space-y-2.5 mb-4">
        {SEASON_CATEGORIES.map((cat) => (
          <HorizontalBar
            key={cat.key}
            icon={cat.icon}
            label={t(cat.labelKey)}
            pct={data[cat.key]}
            color={cat.color}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-border/50 my-3" />

      {/* Time of day */}
      <div className="space-y-2.5">
        {TIME_CATEGORIES.map((cat) => (
          <HorizontalBar
            key={cat.key}
            icon={cat.icon}
            label={t(cat.labelKey)}
            pct={data[cat.key]}
            color={cat.color}
          />
        ))}
      </div>

      {isEstimated && (
        <p className="mt-3 text-[10px] text-muted-foreground/50 text-right">
          {t('whenToUse.estimated')}
        </p>
      )}
    </div>
  );
}
