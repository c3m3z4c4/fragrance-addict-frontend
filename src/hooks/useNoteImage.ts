import { useState, useEffect } from 'react';

// Module-level cache: persists across re-renders for the session
const imageCache = new Map<string, string | null>();

// Common Spanish → English note name translations
export const ES_TO_EN: Record<string, string> = {
  // Citrus
  'bergamota': 'bergamot',
  'limón': 'lemon',
  'limón (lima ácida)': 'lemon',
  'lima': 'lime',
  'naranja': 'orange',
  'mandarina': 'mandarin orange',
  'pomelo': 'grapefruit',
  'toronja': 'grapefruit',
  'yuzu': 'yuzu',
  'naranja amarga': 'bitter orange',
  'naranja sanguina': 'blood orange',
  // Spices
  'pimienta rosa': 'pink pepper',
  'pimienta negra': 'black pepper',
  'pimienta blanca': 'white pepper',
  'canela': 'cinnamon',
  'cardamomo': 'cardamom',
  'jengibre': 'ginger',
  'clavo': 'clove',
  'nuez moscada': 'nutmeg',
  'azafrán': 'saffron',
  'anís': 'anise',
  'comino': 'cumin',
  'pimienta': 'black pepper',
  // Fruits
  'piña': 'pineapple',
  'manzana': 'apple',
  'pera': 'pear',
  'melocotón': 'peach',
  'durazno': 'peach',
  'fresa': 'strawberry',
  'frambuesa': 'raspberry',
  'mora': 'blackberry',
  'ciruela': 'plum',
  'grosella negra': 'blackcurrant',
  'grosellas negras': 'blackcurrant',
  'mango': 'mango',
  'guayaba': 'guava',
  'lichi': 'lychee',
  'coco': 'coconut',
  'higo': 'fig',
  'cereza': 'cherry',
  'uva': 'grape',
  // Flowers
  'jazmín': 'jasmine',
  'jazmín de marruecos': 'jasmine',
  'rosa': 'rose',
  'pétalos de rosa': 'rose',
  'lirio': 'lily',
  'lila': 'lilac',
  'violeta': 'violet',
  'iris': 'iris',
  'gardenia': 'gardenia',
  'lavanda': 'lavender',
  'neroli': 'neroli',
  'azahar': 'orange blossom',
  'flor de azahar': 'orange blossom',
  'flor de naranjo': 'orange blossom',
  'magnolia': 'magnolia',
  'fresia': 'freesia',
  'heliotropo': 'heliotrope',
  'geranio': 'geranium',
  'mimosa': 'mimosa',
  'tuberosa': 'tuberose',
  'ylang ylang': 'ylang-ylang',
  'peonia': 'peony',
  'peonía': 'peony',
  'orquídea': 'orchid',
  'flor de loto': 'lotus',
  'campanilla': 'lily of the valley',
  'lirio del valle': 'lily of the valley',
  'muguete': 'lily of the valley',
  // Woods & Resins
  'cedro': 'cedar',
  'sándalo': 'sandalwood',
  'pachulí': 'patchouli',
  'vetiver': 'vetiver',
  'oud': 'agarwood',
  'madera de oud': 'agarwood',
  'musgo de roble': 'oakmoss',
  'musgo': 'moss',
  'madera': 'wood',
  'abedul': 'birch',
  'madera de abedul': 'birch',
  'madera de cedro': 'cedar',
  'madera de sándalo': 'sandalwood',
  'madera de cachemira': 'cashmere',
  'pino': 'pine',
  'abeto': 'fir',
  'enebro': 'juniper',
  'ciprés': 'cypress',
  'roble': 'oak',
  'nogal': 'walnut',
  'bambú': 'bamboo',
  // Musks & Ambers
  'almizcle': 'musk',
  'almizcle blanco': 'white musk',
  'almizcle suave': 'musk',
  'ámbar': 'ambergris',
  'ámbar gris': 'ambergris',
  'ambroxan': 'ambroxane',
  'ambrette': 'ambrette',
  // Gourmands & Sweets
  'vainilla': 'vanilla',
  'caramelo': 'caramel',
  'miel': 'honey',
  'cacao': 'cocoa',
  'chocolate': 'chocolate',
  'café': 'coffee',
  'haba tonka': 'tonka bean',
  'tonka': 'tonka bean',
  'praline': 'praline',
  'almendra': 'almond',
  'avellana': 'hazelnut',
  // Resins & Balsams
  'incienso': 'frankincense',
  'mirra': 'myrrh',
  'resina': 'resin',
  'benjuí': 'benzoin',
  'estoraque': 'storax',
  'copal': 'copal',
  'labdanum': 'labdanum',
  'bálsamo': 'balsam',
  // Aromatics & Others
  'helecho': 'fern',
  'cuero': 'leather',
  'tabaco': 'tobacco',
  'tierra': 'soil',
  'trufa': 'truffle',
  'sal marina': 'sea salt',
  'brisa marina': 'sea breeze',
  'algas': 'seaweed',
  'algodón': 'cotton',
  'té': 'tea',
  'té verde': 'green tea',
  'té negro': 'black tea',
  'tomillo': 'thyme',
  'romero': 'rosemary',
  'salvia': 'sage',
  'menta': 'mint',
  'menta verde': 'spearmint',
  'eucalipto': 'eucalyptus',
  'hinojo': 'fennel',
  'albahaca': 'basil',
  'orégano': 'oregano',
  'mejorana': 'marjoram',
  'artemisa': 'artemisia',
  'violeta hoja': 'violet leaf',
  'hoja de violeta': 'violet leaf',
  'hoja de tomate': 'tomato leaf',
  'hoja de roble': 'oak',
  'musgo marino': 'sea moss',
  'almizcle de madera': 'woody musk',
  'notas amaderadas': 'wood',
  'notas florales': 'flower',
  'notas especiadas': 'spice',
};

/** Translate a note name to English (or return original if no mapping found) */
export function translateNote(note: string, targetLang = 'en'): string {
  if (targetLang !== 'en') return note;
  const lower = note.toLowerCase().trim();
  if (ES_TO_EN[lower]) return ES_TO_EN[lower];
  // Try partial match: "jazmín sambac" → "jasmine"
  for (const [es, en] of Object.entries(ES_TO_EN)) {
    if (lower.startsWith(es) || es.startsWith(lower.split(' ')[0])) {
      if (es.split(' ')[0] === lower.split(' ')[0]) return en;
    }
  }
  return note;
}

/** Normalize note name for Wikipedia lookup */
function normalizeForWiki(noteName: string): string {
  // Remove parenthetical content: "limón (lima ácida)" → "limón"
  const withoutParens = noteName.replace(/\s*\([^)]*\)/g, '').trim();
  const lower = withoutParens.toLowerCase().trim();
  const english = ES_TO_EN[lower];
  if (english) return english;
  // Try stripping "de X" suffix: "jazmín de Marruecos" → "jazmín"
  const withoutDE = lower.replace(/\s+de\s+\w+$/i, '').trim();
  if (ES_TO_EN[withoutDE]) return ES_TO_EN[withoutDE];
  return withoutParens;
}

async function fetchWikipediaThumbnail(noteName: string): Promise<string | null> {
  const searchTerm = normalizeForWiki(noteName);
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
