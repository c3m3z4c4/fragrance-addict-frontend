import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Save, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAboutContent, updateAboutContent, type AboutContent } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const DEFAULT_CONTENT: AboutContent = {
    hero: {
        eyebrow: 'About Parfumería',
        title: 'The Poetry of',
        titleAccent: 'Scent',
        subtitle: 'We believe that fragrance is one of the most intimate and powerful forms of self-expression.',
    },
    story: {
        title: 'Our Story',
        paragraphs: [''],
        imageUrl: 'https://images.unsplash.com/photo-1595535873420-a599195b3f4a?w=800',
        imageAlt: 'Perfume craftsmanship',
    },
    values: {
        title: 'Our Values',
        items: [{ title: '', description: '' }],
    },
};

// ── Small helpers ──────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4 mt-2">
            {children}
        </h3>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
            </label>
            {children}
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AboutEditor() {
    const { t } = useTranslation();
    const [content, setContent] = useState<AboutContent>(DEFAULT_CONTENT);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchAboutContent().then((data) => {
            if (data) setContent(data);
            setIsLoading(false);
        });
    }, []);

    const update = (path: string[], value: unknown) => {
        setContent((prev) => {
            const next = structuredClone(prev) as Record<string, unknown>;
            let cursor: Record<string, unknown> = next;
            for (let i = 0; i < path.length - 1; i++) {
                cursor = cursor[path[i]] as Record<string, unknown>;
            }
            cursor[path[path.length - 1]] = value;
            return next as AboutContent;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        const ok = await updateAboutContent(content);
        setIsSaving(false);
        toast({
            title: ok
                ? t('admin.aboutSaved', { defaultValue: 'About page saved' })
                : t('admin.aboutSaveError', { defaultValue: 'Failed to save — database unavailable' }),
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl space-y-6">
            {/* Save button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {t('common.save')}
                </Button>
            </div>

            {/* ── HERO section ── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Hero</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field label="Eyebrow text">
                        <Input
                            value={content.hero.eyebrow}
                            onChange={(e) => update(['hero', 'eyebrow'], e.target.value)}
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Title">
                            <Input
                                value={content.hero.title}
                                onChange={(e) => update(['hero', 'title'], e.target.value)}
                            />
                        </Field>
                        <Field label="Title accent (italic, colored)">
                            <Input
                                value={content.hero.titleAccent}
                                onChange={(e) => update(['hero', 'titleAccent'], e.target.value)}
                            />
                        </Field>
                    </div>
                    <Field label="Subtitle">
                        <Textarea
                            rows={3}
                            value={content.hero.subtitle}
                            onChange={(e) => update(['hero', 'subtitle'], e.target.value)}
                        />
                    </Field>
                </CardContent>
            </Card>

            {/* ── STORY section ── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Our Story</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field label="Section title">
                        <Input
                            value={content.story.title}
                            onChange={(e) => update(['story', 'title'], e.target.value)}
                        />
                    </Field>

                    <SectionHeading>Paragraphs</SectionHeading>
                    {content.story.paragraphs.map((p, i) => (
                        <div key={i} className="flex gap-2 items-start">
                            <Textarea
                                rows={3}
                                value={p}
                                onChange={(e) => {
                                    const next = [...content.story.paragraphs];
                                    next[i] = e.target.value;
                                    update(['story', 'paragraphs'], next);
                                }}
                                className="flex-1"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-destructive hover:text-destructive"
                                disabled={content.story.paragraphs.length <= 1}
                                onClick={() => {
                                    update(['story', 'paragraphs'], content.story.paragraphs.filter((_, j) => j !== i));
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => update(['story', 'paragraphs'], [...content.story.paragraphs, ''])}
                    >
                        <Plus className="h-4 w-4" /> Add paragraph
                    </Button>

                    <SectionHeading>Image</SectionHeading>
                    <Field label="Image URL">
                        <div className="flex gap-2">
                            <ImageIcon className="h-4 w-4 mt-2.5 shrink-0 text-muted-foreground" />
                            <Input
                                value={content.story.imageUrl}
                                onChange={(e) => update(['story', 'imageUrl'], e.target.value)}
                            />
                        </div>
                    </Field>
                    {content.story.imageUrl && (
                        <img
                            src={content.story.imageUrl}
                            alt={content.story.imageAlt}
                            className="h-40 w-auto rounded-lg object-cover border border-border"
                        />
                    )}
                    <Field label="Image alt text">
                        <Input
                            value={content.story.imageAlt}
                            onChange={(e) => update(['story', 'imageAlt'], e.target.value)}
                        />
                    </Field>
                </CardContent>
            </Card>

            {/* ── VALUES section ── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Our Values</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field label="Section title">
                        <Input
                            value={content.values.title}
                            onChange={(e) => update(['values', 'title'], e.target.value)}
                        />
                    </Field>

                    <SectionHeading>Values</SectionHeading>
                    {content.values.items.map((item, i) => (
                        <div key={i} className="border border-border rounded-lg p-4 space-y-3 relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7 text-destructive hover:text-destructive"
                                disabled={content.values.items.length <= 1}
                                onClick={() => update(['values', 'items'], content.values.items.filter((_, j) => j !== i))}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <Field label={`Value ${i + 1} — Title`}>
                                <Input
                                    value={item.title}
                                    onChange={(e) => {
                                        const next = [...content.values.items];
                                        next[i] = { ...next[i], title: e.target.value };
                                        update(['values', 'items'], next);
                                    }}
                                />
                            </Field>
                            <Field label="Description">
                                <Textarea
                                    rows={2}
                                    value={item.description}
                                    onChange={(e) => {
                                        const next = [...content.values.items];
                                        next[i] = { ...next[i], description: e.target.value };
                                        update(['values', 'items'], next);
                                    }}
                                />
                            </Field>
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => update(['values', 'items'], [...content.values.items, { title: '', description: '' }])}
                    >
                        <Plus className="h-4 w-4" /> Add value
                    </Button>
                </CardContent>
            </Card>

            {/* Bottom save button */}
            <div className="flex justify-end pb-8">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {t('common.save')}
                </Button>
            </div>
        </div>
    );
}
