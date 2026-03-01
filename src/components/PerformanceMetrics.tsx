import { useTranslation } from 'react-i18next';
import { Wind, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Ordered steps for each metric (low → high)
const LONGEVITY_STEPS = ['poor', 'veryweak', 'weak', 'moderate', 'longlasting', 'verylong', 'eternal'] as const;
const SILLAGE_STEPS = ['intimate', 'moderate', 'strong', 'enormous'] as const;

interface MetricData {
  dominant?: string;
  percentage?: number;
  votes?: Record<string, number>;
}

interface PerformanceMetricsProps {
  sillage?: MetricData | null;
  longevity?: MetricData | null;
  projection?: string;
  accords?: string[];
  concentration?: string;
}

// ─── Accord/concentration-based estimation ────────────────────────────────────

function estimateLongevity(concentration?: string, accords?: string[]): MetricData {
  const c = (concentration || '').toLowerCase();
  const lower = (accords || []).map(a => a.toLowerCase());

  let idx = 3; // moderate by default

  if (c.includes('extrait')) idx = 6;
  else if (c.includes('parfum') && !c.includes('eau de parfum')) idx = 5;
  else if (c.includes('eau de parfum') || c.includes('edp')) idx = 4;
  else if (c.includes('eau de toilette') || c.includes('edt')) idx = 3;
  else if (c.includes('eau de cologne') || c.includes('edc')) idx = 2;
  else if (c.includes('fraiche')) idx = 0;

  // Accord boost: oriental/amber/oud lasts longer
  if (idx < 5 && lower.some(a => ['oud', 'amber', 'oriental', 'balsamic', 'resin', 'vanilla', 'leather'].some(kw => a.includes(kw)))) {
    idx = Math.min(5, idx + 1);
  }
  // Accord reduction: fresh/aquatic fades faster
  if (idx > 1 && lower.some(a => ['fresh', 'aquatic', 'citrus', 'light', 'marine'].some(kw => a.includes(kw))) && idx > 3) {
    idx = Math.max(2, idx - 1);
  }

  return { dominant: LONGEVITY_STEPS[idx] };
}

function estimateSillage(accords?: string[], concentration?: string): MetricData {
  const lower = (accords || []).map(a => a.toLowerCase());
  const c = (concentration || '').toLowerCase();

  let idx = 1; // moderate by default

  if (lower.some(a => ['oud', 'leather', 'tobacco', 'smoke'].some(kw => a.includes(kw)))) idx = 3;
  else if (lower.some(a => ['oriental', 'amber', 'warm spicy', 'balsamic', 'resinous'].some(kw => a.includes(kw)))) idx = 2;
  else if (lower.some(a => ['woody', 'earthy', 'mossy', 'spicy'].some(kw => a.includes(kw)))) idx = 1;
  else if (lower.some(a => ['fresh', 'aquatic', 'citrus', 'marine', 'light'].some(kw => a.includes(kw)))) idx = 0;
  else if (lower.some(a => ['musky', 'powdery', 'clean', 'soapy'].some(kw => a.includes(kw)))) idx = 0;

  // Concentration adjustment
  if (c.includes('extrait') || (c.includes('parfum') && !c.includes('eau de parfum'))) {
    idx = Math.min(3, idx + 1);
  } else if (c.includes('eau de cologne') || c.includes('fraiche')) {
    idx = Math.max(0, idx - 1);
  }

  return { dominant: SILLAGE_STEPS[idx] };
}

// ─── Single metric card ───────────────────────────────────────────────────────

function MetricCard({
  label,
  icon,
  data,
  steps,
}: {
  label: string;
  icon: React.ReactNode;
  data: MetricData;
  steps: readonly string[];
}) {
  const { t } = useTranslation();

  const votes = data.votes ?? {};
  // Derive dominant from actual votes when available — stored value can be stale
  const derivedDominant = Object.keys(votes).length > 0
    ? Object.entries(votes).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0]
    : undefined;
  const dominant = derivedDominant ?? data.dominant;
  const maxVotes = Math.max(...Object.values(votes), 1);

  const dominantIdx = dominant ? steps.indexOf(dominant) : -1;

  const getLabel = (key: string) =>
    t(`performance.${key}`, { defaultValue: key });

  return (
    <div className="flex-1 rounded-xl bg-secondary/40 border border-border/60 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground text-center">
          {label}
        </span>
      </div>

      {/* Slider track */}
      <div className="relative pb-1">
        <div className="relative h-1.5 bg-muted rounded-full">
          {dominantIdx >= 0 && (
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-accent/60"
              style={{ width: `${((dominantIdx + 1) / steps.length) * 100}%` }}
            />
          )}
          {steps.map((step, i) => (
            <div
              key={step}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-all',
                step === dominant
                  ? 'w-3.5 h-3.5 bg-accent border-2 border-background shadow-md'
                  : 'w-1.5 h-1.5 bg-muted-foreground/30'
              )}
              style={{ left: `${(i / (steps.length - 1)) * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Vote bars (when real data) or dominant label (when estimated) */}
      {Object.keys(votes).length > 0 ? (
        <div className="space-y-2">
          {steps
            .filter(step => votes[step] !== undefined)
            .map(step => {
              const count = votes[step] ?? 0;
              const pct = maxVotes > 0 ? (count / maxVotes) * 100 : 0;
              const isDominant = step === dominant;
              return (
                <div key={step} className="flex items-center gap-2.5">
                  <span className={cn('text-[11px] w-24 shrink-0 capitalize', isDominant ? 'text-accent font-semibold' : 'text-muted-foreground')}>
                    {getLabel(step)}
                  </span>
                  <span className={cn('text-[11px] w-8 text-right shrink-0 tabular-nums', isDominant ? 'text-accent font-semibold' : 'text-muted-foreground')}>
                    {count}
                  </span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', isDominant ? 'bg-accent' : 'bg-muted-foreground/30')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        /* Estimated: show all steps as bars with relative fill */
        <div className="space-y-2">
          {steps.map((step, i) => {
            const isDominant = step === dominant;
            // Distribute visual weight: dominant gets full bar, others fade proportionally
            const pct = isDominant ? 85 : Math.max(10, 85 - Math.abs(i - dominantIdx) * 18);
            return (
              <div key={step} className="flex items-center gap-2.5">
                <span className={cn('text-[11px] w-24 shrink-0 capitalize', isDominant ? 'text-accent font-semibold' : 'text-muted-foreground/60')}>
                  {getLabel(step)}
                </span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', isDominant ? 'bg-accent' : 'bg-muted-foreground/15')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PerformanceMetrics({ sillage, longevity, projection, accords, concentration }: PerformanceMetricsProps) {
  const { t } = useTranslation();

  const hasRealLongevity = !!(longevity?.dominant || longevity?.votes);
  const hasRealSillage = !!(sillage?.dominant || sillage?.votes);

  // No data at all and nothing to estimate from
  if (!hasRealLongevity && !hasRealSillage && !projection && !accords?.length && !concentration) {
    return null;
  }

  const isEstimated = !hasRealLongevity && !hasRealSillage;
  const longevityData: MetricData = hasRealLongevity ? longevity! : estimateLongevity(concentration, accords);
  const sillageData: MetricData = hasRealSillage ? sillage! : estimateSillage(accords, concentration);

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground whitespace-nowrap">
          {t('performance.title')}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex gap-4">
        <MetricCard
          label={t('performance.longevity')}
          icon={<Clock className="h-5 w-5" />}
          data={longevityData}
          steps={LONGEVITY_STEPS}
        />
        <MetricCard
          label={t('performance.sillageTitle', { defaultValue: t('performance.sillage') })}
          icon={<Wind className="h-5 w-5" />}
          data={sillageData}
          steps={SILLAGE_STEPS}
        />
      </div>

      {isEstimated && (
        <p className="mt-3 text-[10px] text-muted-foreground/50 text-right">
          {t('performance.estimated', { defaultValue: 'Estimated from fragrance profile' })}
        </p>
      )}
    </div>
  );
}
