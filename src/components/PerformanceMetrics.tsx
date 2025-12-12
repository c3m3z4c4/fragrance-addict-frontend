import { useTranslation } from 'react-i18next';
import { Wind, Clock, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceMetricsProps {
  sillage?: {
    dominant?: string;
    percentage?: number;
    votes?: Record<string, number>;
  };
  longevity?: {
    dominant?: string;
    percentage?: number;
    votes?: Record<string, number>;
  };
  projection?: string;
}

export function PerformanceMetrics({ sillage, longevity, projection }: PerformanceMetricsProps) {
  const { t } = useTranslation();
  
  // Don't render if no data
  if (!sillage?.dominant && !longevity?.dominant && !projection) {
    return null;
  }

  const getPerformanceLevel = (value: string): number => {
    const levels: Record<string, number> = {
      // Sillage
      'intimate': 25,
      'moderate': 50,
      'strong': 75,
      'enormous': 100,
      // Longevity
      'weak': 20,
      'poor': 30,
      'very weak': 20,
      'eternal': 100,
      'long lasting': 80,
      'very long': 90,
    };
    return levels[value.toLowerCase()] || 50;
  };

  const translatePerformanceValue = (value: string): string => {
    const key = value.toLowerCase().replace(/\s+/g, '');
    const translated = t(`performance.${key}`, { defaultValue: '' });
    return translated || value;
  };

  const getPerformanceColor = (percentage: number): string => {
    if (percentage >= 75) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="mb-8">
      <h2 className="font-display text-lg mb-4">{t('performance.title')}</h2>
      <div className="space-y-4">
        {/* Sillage */}
        {sillage?.dominant && (
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Wind className="h-5 w-5 text-accent" />
              <span className="font-medium">{t('performance.sillage')}</span>
              <span className="ml-auto text-sm text-muted-foreground capitalize">
                {translatePerformanceValue(sillage.dominant)}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-500", getPerformanceColor(sillage.percentage || getPerformanceLevel(sillage.dominant)))}
                style={{ width: `${sillage.percentage || getPerformanceLevel(sillage.dominant)}%` }}
              />
            </div>
            {sillage.votes && Object.keys(sillage.votes).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {Object.entries(sillage.votes).map(([label, count]) => (
                  <span key={label} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {translatePerformanceValue(label)}: {count}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Longevity */}
        {longevity?.dominant && (
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-accent" />
              <span className="font-medium">{t('performance.longevity')}</span>
              <span className="ml-auto text-sm text-muted-foreground capitalize">
                {translatePerformanceValue(longevity.dominant)}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-500", getPerformanceColor(longevity.percentage || getPerformanceLevel(longevity.dominant)))}
                style={{ width: `${longevity.percentage || getPerformanceLevel(longevity.dominant)}%` }}
              />
            </div>
            {longevity.votes && Object.keys(longevity.votes).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {Object.entries(longevity.votes).map(([label, count]) => (
                  <span key={label} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {translatePerformanceValue(label)}: {count}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Projection */}
        {projection && (
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center gap-3">
              <Radio className="h-5 w-5 text-accent" />
              <span className="font-medium">{t('performance.projection')}</span>
              <span className="ml-auto text-sm text-muted-foreground capitalize">
                {translatePerformanceValue(projection)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
