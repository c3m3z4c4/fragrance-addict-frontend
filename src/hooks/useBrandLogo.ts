import { useState, useEffect } from 'react';

// Module-level cache: persists across re-renders for the session
const logoCache = new Map<string, string | null>();

async function fetchBrandLogo(brandName: string): Promise<string | null> {
  const title = brandName.trim();
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

export function useBrandLogo(brandName: string): string | null {
  const [url, setUrl] = useState<string | null>(() =>
    logoCache.has(brandName) ? logoCache.get(brandName)! : null
  );

  useEffect(() => {
    if (logoCache.has(brandName)) {
      setUrl(logoCache.get(brandName)!);
      return;
    }

    let cancelled = false;
    fetchBrandLogo(brandName).then((imgUrl) => {
      logoCache.set(brandName, imgUrl);
      if (!cancelled) setUrl(imgUrl);
    });

    return () => { cancelled = true; };
  }, [brandName]);

  return url;
}
