import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAIConfig, setAIDefaultModel } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Save, TriangleAlert } from 'lucide-react';

const MODEL_LABELS: Record<string, { label: string; desc: string }> = {
    'gemini-2.0-flash':      { label: 'Gemini 2.0 Flash',      desc: 'Recommended — stable & fast' },
    'gemini-2.0-flash-lite': { label: 'Gemini 2.0 Flash Lite', desc: 'Lightweight, lower quota usage' },
    'gemini-1.5-flash':      { label: 'Gemini 1.5 Flash',      desc: 'Previous gen, very stable' },
    'gemini-1.5-pro':        { label: 'Gemini 1.5 Pro',        desc: 'Previous gen, most capable' },
    'gemini-2.5-flash':      { label: 'Gemini 2.5 Flash',      desc: 'Latest preview — may have quota limits' },
};

export function AISettings() {
    const queryClient = useQueryClient();
    const [selected, setSelected] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['ai-config'],
        queryFn: getAIConfig,
        onSuccess: (d) => {
            if (selected === null) setSelected(d.model);
        },
    });

    const saveMutation = useMutation({
        mutationFn: () => setAIDefaultModel(selected!),
        onSuccess: (result) => {
            if (result.success) {
                queryClient.invalidateQueries({ queryKey: ['ai-config'] });
                toast({ title: 'AI model updated', description: `Default is now ${MODEL_LABELS[result.model]?.label ?? result.model}` });
            }
        },
        onError: () => {
            toast({ title: 'Error', description: 'Could not update AI model', variant: 'destructive' });
        },
    });

    const currentModel = selected ?? data?.model ?? '';
    const isDirty = data?.model !== undefined && currentModel !== data.model;

    return (
        <div className="space-y-6 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-accent" />
                        AI Recommendations — Model
                    </CardTitle>
                    <CardDescription>
                        Choose which Gemini model is used for all user recommendations. This resets to the default if the server restarts; set <code className="text-xs bg-muted px-1 rounded">AI_DEFAULT_MODEL</code> in your environment to make it permanent.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                {(data?.models ?? []).map((modelId) => {
                                    const info = MODEL_LABELS[modelId] ?? { label: modelId, desc: '' };
                                    const isActive = currentModel === modelId;
                                    return (
                                        <button
                                            key={modelId}
                                            type="button"
                                            onClick={() => setSelected(modelId)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-colors ${
                                                isActive
                                                    ? 'border-accent bg-accent/5 text-accent'
                                                    : 'border-border hover:border-accent/40 hover:bg-muted/30'
                                            }`}
                                        >
                                            <div>
                                                <p className="text-sm font-medium">{info.label}</p>
                                                <p className="text-xs text-muted-foreground">{modelId}</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{info.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>

                            {isDirty && (
                                <div className="flex items-center gap-3 pt-2">
                                    <Button
                                        onClick={() => saveMutation.mutate()}
                                        disabled={saveMutation.isPending}
                                        size="sm"
                                    >
                                        {saveMutation.isPending
                                            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
                                            : <><Save className="h-4 w-4 mr-2" /> Save model</>
                                        }
                                    </Button>
                                    <button
                                        type="button"
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => setSelected(data?.model ?? null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-muted-foreground">
                                <TriangleAlert className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <p>If recommendations fail (502 error), switch to a more stable model. Free-tier API keys may not have access to preview models.</p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
