import { useState, useRef, useEffect } from 'react';
import { useApiKeyManagement } from '@/hooks/useApiKeyManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Copy, Trash2, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

interface ApiKeyGeneratorProps {
    currentApiKey: string | null;
    onKeyChange?: (newKey: string) => void;
}

export function ApiKeyGenerator({
    currentApiKey,
    onKeyChange,
}: ApiKeyGeneratorProps) {
    const {
        keys,
        loading,
        error,
        newKeyGenerated,
        generateKey,
        deactivateKey,
        clearNewKey,
    } = useApiKeyManagement(currentApiKey);

    const [showGenerateForm, setShowGenerateForm] = useState(false);
    const [keyName, setKeyName] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
    const [generatingKey, setGeneratingKey] = useState(false);
    const copyTimeoutRef = useRef<NodeJS.Timeout>();

    const handleGenerateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneratingKey(true);

        try {
            const result = await generateKey(keyName, deviceName);
            if (result) {
                setKeyName('');
                setDeviceName('');
                setShowGenerateForm(false);
            }
        } finally {
            setGeneratingKey(false);
        }
    };

    const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKeyId('new-key');

        if (copyTimeoutRef.current) {
            clearTimeout(copyTimeoutRef.current);
        }

        copyTimeoutRef.current = setTimeout(() => {
            setCopiedKeyId(null);
        }, 2000);
    };

    const handleCopyKeyPreview = (keyId: string, keyPreview: string) => {
        // Copy the preview text
        navigator.clipboard.writeText(keyPreview);
        setCopiedKeyId(keyId);

        if (copyTimeoutRef.current) {
            clearTimeout(copyTimeoutRef.current);
        }

        copyTimeoutRef.current = setTimeout(() => {
            setCopiedKeyId(null);
        }, 2000);
    };

    const handleDeactivateKey = async (keyId: string) => {
        const success = await deactivateKey(keyId);
        if (success) {
            // Show success message (you could add a toast here)
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        try {
            return new Date(dateString).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return 'Invalid date';
        }
    };

    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="space-y-6">
            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Newly Generated Key Alert */}
            {newKeyGenerated && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="ml-2">
                        <div className="space-y-3">
                            <p className="font-semibold text-green-900">
                                ✅ API Key Generated Successfully!
                            </p>
                            <p className="text-sm text-green-800">
                                Save this key securely.{' '}
                                <strong>
                                    You won't be able to see it again.
                                </strong>
                            </p>
                            <div className="mt-3 flex items-center justify-between rounded-md bg-white p-2 font-mono text-sm text-gray-900">
                                <span className="break-all">
                                    {newKeyGenerated.key}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        handleCopyKey(newKeyGenerated.key)
                                    }
                                    className="ml-2 whitespace-nowrap"
                                >
                                    {copiedKeyId === 'new-key' ? (
                                        <>
                                            <CheckCircle2 className="mr-1 h-4 w-4" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="mr-1 h-4 w-4" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={clearNewKey}
                                className="w-full"
                            >
                                Got it, I've saved the key
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Generate New Key Form */}
            {showGenerateForm && !newKeyGenerated && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Generate New API Key
                        </CardTitle>
                        <CardDescription>
                            Create a new API key for another device or
                            application
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handleGenerateKey}
                            className="space-y-4"
                        >
                            <div>
                                <label
                                    htmlFor="keyName"
                                    className="text-sm font-medium"
                                >
                                    Key Name *
                                </label>
                                <Input
                                    id="keyName"
                                    placeholder="e.g., Mobile App, Desktop Client"
                                    value={keyName}
                                    onChange={(e) => setKeyName(e.target.value)}
                                    disabled={generatingKey}
                                    required
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="deviceName"
                                    className="text-sm font-medium"
                                >
                                    Device Name (Optional)
                                </label>
                                <Input
                                    id="deviceName"
                                    placeholder="e.g., iPhone 14 Pro, Windows Desktop"
                                    value={deviceName}
                                    onChange={(e) =>
                                        setDeviceName(e.target.value)
                                    }
                                    disabled={generatingKey}
                                    className="mt-1"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="submit"
                                    disabled={generatingKey || !keyName.trim()}
                                    className="flex-1"
                                >
                                    {generatingKey
                                        ? 'Generating...'
                                        : 'Generate Key'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowGenerateForm(false);
                                        setKeyName('');
                                        setDeviceName('');
                                    }}
                                    disabled={generatingKey}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Generate Key Button */}
            {!showGenerateForm && !newKeyGenerated && (
                <Button
                    onClick={() => setShowGenerateForm(true)}
                    className="w-full"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Generate New API Key
                </Button>
            )}

            {/* Existing Keys List */}
            {keys.length > 0 && (
                <div className="space-y-3">
                    <div>
                        <h3 className="text-sm font-semibold">Your API Keys</h3>
                        <p className="text-xs text-gray-500">
                            {keys.length} key{keys.length !== 1 ? 's' : ''}{' '}
                            total
                        </p>
                    </div>

                    <div className="space-y-2">
                        {keys.map((key) => (
                            <Card key={key.id} className="overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">
                                                    {key.name}
                                                </h4>
                                                <Badge
                                                    variant={
                                                        key.isActive
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {key.isActive
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </Badge>
                                            </div>

                                            {key.deviceName && (
                                                <p className="text-sm text-gray-600">
                                                    Device:{' '}
                                                    <span className="font-medium">
                                                        {key.deviceName}
                                                    </span>
                                                </p>
                                            )}

                                            <div className="flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:gap-3">
                                                <span>
                                                    Created:{' '}
                                                    {formatDate(key.createdAt)}
                                                </span>
                                                <span>
                                                    Last used:{' '}
                                                    {key.lastUsedAt
                                                        ? formatDate(
                                                              key.lastUsedAt
                                                          )
                                                        : 'Never'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between rounded-md bg-gray-50 p-2 font-mono text-xs">
                                                <span className="text-gray-600">
                                                    {key.keyPreview}
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        handleCopyKeyPreview(
                                                            key.id,
                                                            key.keyPreview
                                                        )
                                                    }
                                                    className="h-6 w-6 p-0"
                                                >
                                                    {copiedKeyId === key.id ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        {key.isActive && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="ml-4"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogTitle>
                                                        Deactivate API Key?
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will deactivate the
                                                        key "{key.name}". Any
                                                        devices using this key
                                                        will no longer be able
                                                        to access the
                                                        application. This action
                                                        cannot be undone.
                                                    </AlertDialogDescription>
                                                    <div className="flex gap-3">
                                                        <AlertDialogCancel>
                                                            Cancel
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() =>
                                                                handleDeactivateKey(
                                                                    key.id
                                                                )
                                                            }
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Deactivate
                                                        </AlertDialogAction>
                                                    </div>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading &&
                keys.length === 0 &&
                !showGenerateForm &&
                !newKeyGenerated && (
                    <Card className="text-center">
                        <CardContent className="p-8">
                            <p className="text-sm text-gray-600">
                                No API keys yet. Generate one to get started.
                            </p>
                        </CardContent>
                    </Card>
                )}

            {/* Loading State */}
            {loading && !newKeyGenerated && (
                <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                </div>
            )}
        </div>
    );
}
