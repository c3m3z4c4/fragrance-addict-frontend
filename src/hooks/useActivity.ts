import { useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { getAuthToken } from '@/contexts/AuthContext';

function getSessionId(): string {
    let id = sessionStorage.getItem('fa_session_id');
    if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem('fa_session_id', id);
    }
    return id;
}

export function useActivity() {
    const inFlight = useRef(new Set<string>());

    const logEvent = useCallback(
        async (
            eventType: 'perfume_view' | 'brand_search' | 'search_query',
            entityId: string,
            entityName: string,
            metadata?: Record<string, unknown>
        ) => {
            const dedupKey = `${eventType}:${entityId}`;
            if (inFlight.current.has(dedupKey)) return;
            inFlight.current.add(dedupKey);
            setTimeout(() => inFlight.current.delete(dedupKey), 5000);

            try {
                const token = getAuthToken();
                await fetch(`${API_BASE_URL}/api/activity/log`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        sessionId: getSessionId(),
                        eventType,
                        entityId,
                        entityName,
                        metadata: metadata ?? {},
                    }),
                });
            } catch {
                // Fire-and-forget — never break UX
            }
        },
        []
    );

    return { logEvent };
}
