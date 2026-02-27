import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface AccordBarsProps {
    accords: string[];
    className?: string;
}

// Palette mapped to common accord families (EN + ES)
const ACCORD_COLORS: Record<string, string> = {
    // Floral
    floral: '#e879a0', florales: '#e879a0',
    rose: '#f43f76', rosa: '#f43f76',
    jasmine: '#fde68a', jazmín: '#fde68a',
    violet: '#a78bfa', violeta: '#a78bfa',
    iris: '#c4b5fd', orquídea: '#db2777',
    // Fruity
    fruity: '#fb923c', afrutados: '#fb923c',
    peach: '#fdba74', melocotón: '#fdba74',
    berry: '#e11d48', frutos_rojos: '#e11d48',
    apple: '#84cc16', manzana: '#84cc16',
    citrus: '#fbbf24', cítrico: '#fbbf24',
    lemon: '#facc15', limón: '#facc15',
    bergamot: '#f59e0b', bergamota: '#f59e0b',
    orange: '#f97316', naranja: '#f97316',
    // Sweet
    sweet: '#fb7185', dulce: '#fb7185',
    vanilla: '#fef08a', avainillado: '#fef08a', vainilla: '#fef08a',
    caramel: '#d97706', caramelo: '#d97706',
    gourmand: '#c2410c',
    chocolate: '#7c2d12',
    honey: '#ca8a04', miel: '#ca8a04',
    // Amber / Resinous
    amber: '#d97706', ámbar: '#d97706',
    resinous: '#b45309', resinoso: '#b45309',
    balsamic: '#92400e', balsámico: '#92400e',
    // Woody
    woody: '#92400e', amaderado: '#a16207',
    sandalwood: '#a16207', sándalo: '#a16207',
    cedar: '#78350f', cedro: '#78350f',
    vetiver: '#713f12',
    oud: '#1c1917',
    patchouli: '#713f12', pachulí: '#713f12',
    // Earthy / Mossy
    earthy: '#6b7280', terroso: '#6b7280',
    mossy: '#4d7c0f', musgoso: '#4d7c0f',
    oakmoss: '#365314',
    // Aquatic / Fresh
    aquatic: '#22d3ee', acuático: '#22d3ee',
    marine: '#0ea5e9', marino: '#0ea5e9',
    fresh: '#7dd3fc', fresco: '#7dd3fc',
    // Aromatic / Green
    aromatic: '#4ade80', aromático: '#4ade80',
    herbal: '#86efac', herbáceo: '#86efac',
    green: '#22c55e', verde: '#22c55e',
    // Powdery
    powdery: '#ddd6f3', atalcado: '#ddd6f3', empolvado: '#ddd6f3',
    // Musky
    musk: '#c4b5fd', almizclado: '#c4b5fd',
    white_musk: '#e9d5ff',
    // Spicy
    spicy: '#ef4444', especiado: '#ef4444',
    pepper: '#dc2626', pimienta: '#dc2626',
    cinnamon: '#c2410c', canela: '#c2410c',
    cardamom: '#a16207', cardamomo: '#a16207',
    // Smoky / Leather
    smoky: '#6b7280', ahumado: '#6b7280',
    leather: '#78350f', cuero: '#78350f',
    tobacco: '#854d0e', tabaco: '#854d0e',
    // Animalic
    animalic: '#78350f', animal: '#78350f',
};

const FALLBACK_PALETTE = [
    '#e879a0', '#fb923c', '#fbbf24', '#4ade80', '#22d3ee',
    '#818cf8', '#f87171', '#34d399', '#a78bfa', '#f472b6',
    '#facc15', '#60a5fa', '#fb7185', '#86efac', '#fde68a',
];

function getAccordColor(accord: string, index: number): string {
    const key = accord.toLowerCase().replace(/\s+/g, '_');
    return ACCORD_COLORS[key] ?? FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

function isLight(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6;
}

export function AccordBars({ accords, className }: AccordBarsProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    if (!accords || accords.length === 0) return null;

    const maxBars = Math.min(accords.length, 14);
    const displayed = accords.slice(0, maxBars);

    return (
        <div className={className}>
            <h2 className="font-display text-lg mb-4 uppercase tracking-wider text-muted-foreground text-xs">
                {t('perfume.mainAccords')}
            </h2>

            <div className="space-y-1.5">
                {displayed.map((accord, index) => {
                    // Decreasing width: 100% → min ~52%, step ~4.5% per bar
                    const width = Math.max(100 - index * 4.5, 52);
                    const color = getAccordColor(accord, index);
                    const light = isLight(color);

                    return (
                        <div
                            key={accord}
                            className="opacity-0 animate-fade-in"
                            style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}
                        >
                            <div
                                className="rounded-r-full px-4 py-1.5 flex items-center transition-all duration-300 hover:brightness-110 cursor-default select-none"
                                style={{
                                    width: `${width}%`,
                                    backgroundColor: color,
                                    minWidth: '120px',
                                }}
                            >
                                <span
                                    className="text-sm font-medium truncate"
                                    style={{ color: light ? '#1c1917' : '#fafaf9' }}
                                >
                                    {accord}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={() => navigate(`/?accords=${encodeURIComponent(accords.slice(0, 3).join(','))}`)}
                className="mt-4 text-xs text-muted-foreground hover:text-accent transition-colors underline underline-offset-2"
            >
                {t('perfume.searchByAccords')}
            </button>
        </div>
    );
}
