import { useState, useEffect } from 'react';

// Module-level cache: persists across re-renders for the session
const imageCache = new Map<string, string | null>();

// Common Spanish → English note name translations
const ES_TO_EN: Record<string, string> = {
  'pimienta rosa': 'pink pepper',
  'pimienta negra': 'black pepper',
  'pimienta blanca': 'white pepper',
  'mandarina': 'mandarin orange',
  'bergamota': 'bergamot',
  'limón': 'lemon',
  'naranja': 'orange',
  'pomelo': 'grapefruit',
  'toronja': 'grapefruit',
  'cedro': 'cedar',
  'sándalo': 'sandalwood',
  'pachulí': 'patchouli',
  'vetiver': 'vetiver',
  'oud': 'agarwood',
  'jazmín': 'jasmine',
  'rosa': 'rose',
  'lirio': 'lily',
  'lila': 'lilac',
  'violeta': 'violet',
  'iris': 'iris',
  'gardenia': 'gardenia',
  'lavanda': 'lavender',
  'vainilla': 'vanilla',
  'ámbar': 'ambergris',
  'almizcle': 'musk',
  'almizcle blanco': 'white musk',
  'canela': 'cinnamon',
  'cardamomo': 'cardamom',
  'jengibre': 'ginger',
  'melocotón': 'peach',
  'manzana': 'apple',
  'frambuesa': 'raspberry',
  'ciruela': 'plum',
  'pera': 'pear',
  'durazno': 'peach',
  'fresa': 'strawberry',
  'mora': 'blackberry',
  'grosella negra': 'blackcurrant',
  'caramelo': 'caramel',
  'miel': 'honey',
  'musgo de roble': 'oakmoss',
  'cuero': 'leather',
  'tabaco': 'tobacco',
  'helecho': 'fern',
  'haba tonka': 'tonka bean',
  'benjuí': 'benzoin',
  'incienso': 'frankincense',
  'mirra': 'myrrh',
  'resina': 'resin',
  'madera': 'wood',
  'musgo': 'moss',
  'tierra': 'soil',
  'geranio': 'geranium',
  'neroli': 'neroli',
  'azahar': 'orange blossom',
  'flor de azahar': 'orange blossom',
};

async function fetchWikipediaThumbnail(noteName: string): Promise<string | null> {
  // Normalize: lowercase, check for Spanish translation
  const normalized = noteName.toLowerCase().trim();
  const searchTerm = ES_TO_EN[normalized] || normalized;

  // Capitalize for Wikipedia title
  const title = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);

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

export function useNoteImage(noteName: string): string | null {
  const [url, setUrl] = useState<string | null>(() =>
    imageCache.has(noteName) ? imageCache.get(noteName)! : null
  );

  useEffect(() => {
    if (imageCache.has(noteName)) {
      setUrl(imageCache.get(noteName)!);
      return;
    }

    let cancelled = false;
    fetchWikipediaThumbnail(noteName).then((imgUrl) => {
      imageCache.set(noteName, imgUrl);
      if (!cancelled) setUrl(imgUrl);
    });

    return () => { cancelled = true; };
  }, [noteName]);

  return url;
}
