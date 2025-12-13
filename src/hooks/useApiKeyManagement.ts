import { useState, useCallback, useEffect } from 'react';

export interface ApiKey {
    id: string;
    name: string;
    deviceName: string | null;
    lastUsedAt: string | null;
    createdAt: string;
    isActive: boolean;
    keyPreview: string;
}

export interface GeneratedApiKey {
    key: string;
    id: string;
    name: string;
    deviceName: string | null;
    message: string;
}

export const useApiKeyManagement = (currentApiKey: string | null) => {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newKeyGenerated, setNewKeyGenerated] =
        useState<GeneratedApiKey | null>(null);

    // Fetch user's API keys
    const fetchKeys = useCallback(async () => {
        if (!currentApiKey) {
            setError('No API key available');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/keys', {
                method: 'GET',
                headers: {
                    'x-api-key': currentApiKey,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch API keys');
            }

            const data = await response.json();
            setKeys(data.data || []);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            console.error('Error fetching API keys:', err);
        } finally {
            setLoading(false);
        }
    }, [currentApiKey]);

    // Generate new API key
    const generateKey = useCallback(
        async (name: string, deviceName?: string) => {
            if (!currentApiKey) {
                setError('No API key available');
                return null;
            }

            if (!name.trim()) {
                setError('Key name is required');
                return null;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/keys/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': currentApiKey,
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        deviceName: deviceName?.trim() || undefined,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.error || 'Failed to generate API key'
                    );
                }

                const data = await response.json();
                const generatedKey = data.data;

                // Store the newly generated key
                setNewKeyGenerated(generatedKey);

                // Refresh the key list
                await fetchKeys();

                return generatedKey;
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : 'Unknown error';
                setError(message);
                console.error('Error generating API key:', err);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [currentApiKey, fetchKeys]
    );

    // Deactivate an API key
    const deactivateKey = useCallback(
        async (keyId: string) => {
            if (!currentApiKey) {
                setError('No API key available');
                return false;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/keys/${keyId}`, {
                    method: 'DELETE',
                    headers: {
                        'x-api-key': currentApiKey,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.error || 'Failed to deactivate API key'
                    );
                }

                // Refresh the key list
                await fetchKeys();

                return true;
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : 'Unknown error';
                setError(message);
                console.error('Error deactivating API key:', err);
                return false;
            } finally {
                setLoading(false);
            }
        },
        [currentApiKey, fetchKeys]
    );

    // Clear the newly generated key from state
    const clearNewKey = useCallback(() => {
        setNewKeyGenerated(null);
    }, []);

    // Initial fetch on mount
    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    return {
        keys,
        loading,
        error,
        newKeyGenerated,
        generateKey,
        deactivateKey,
        fetchKeys,
        clearNewKey,
    };
};
