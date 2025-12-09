export interface Perfume {
  id: string;
  name: string;
  brand: string;
  year: number;
  perfumer: string;
  gender: 'masculine' | 'feminine' | 'unisex';
  concentration: string;
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
  description: string;
  imageUrl: string;
  rating: number;
  price: number;
  family: string;
}

export const perfumes: Perfume[] = [
  {
    id: '1',
    name: 'Vanille Leather',
    brand: 'BDK Parfums',
    year: 2022,
    perfumer: 'Alexandra Carlin',
    gender: 'unisex',
    concentration: 'Eau de Parfum',
    notes: {
      top: ['Bergamot', 'Pink Pepper', 'Saffron'],
      heart: ['Vanilla', 'Leather', 'Iris'],
      base: ['Sandalwood', 'Benzoin', 'Musk']
    },
    description: 'A sophisticated blend where the sweetness of vanilla meets the raw edge of leather. This oriental fragrance opens with vibrant bergamot and pink pepper, mellowing into a heart of creamy vanilla and supple leather.',
    imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600',
    rating: 4.7,
    price: 215,
    family: 'Oriental'
  },
  {
    id: '2',
    name: 'Gris Charnel',
    brand: 'BDK Parfums',
    year: 2019,
    perfumer: 'Alexandra Carlin',
    gender: 'unisex',
    concentration: 'Eau de Parfum',
    notes: {
      top: ['Cardamom', 'Bergamot', 'Pink Pepper'],
      heart: ['Fig', 'Iris', 'Vetiver'],
      base: ['Sandalwood', 'Musk', 'Tonka Bean']
    },
    description: 'An intimate and sensual fragrance that captures the warmth of bare skin. Gris Charnel is a journey through spicy, woody, and musky accords that leave an unforgettable trail.',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600',
    rating: 4.8,
    price: 195,
    family: 'Woody'
  },
  {
    id: '3',
    name: 'Rouge Smoking',
    brand: 'BDK Parfums',
    year: 2020,
    perfumer: 'Nathalie Feisthauer',
    gender: 'unisex',
    concentration: 'Eau de Parfum',
    notes: {
      top: ['Cherry', 'Cinnamon', 'Cardamom'],
      heart: ['Tobacco', 'Cedar', 'Rose'],
      base: ['Labdanum', 'Benzoin', 'Vanilla']
    },
    description: 'A daring composition inspired by the glamour of evening wear. Rouge Smoking combines the decadence of cherry with smoky tobacco and warm spices for an intoxicating experience.',
    imageUrl: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=600',
    rating: 4.6,
    price: 205,
    family: 'Oriental Spicy'
  },
  {
    id: '4',
    name: 'Oud Abramad',
    brand: 'Parfums de Marly',
    year: 2021,
    perfumer: 'Hamid Merati-Kashani',
    gender: 'masculine',
    concentration: 'Eau de Parfum',
    notes: {
      top: ['Rose', 'Geranium', 'Pink Pepper'],
      heart: ['Oud', 'Saffron', 'Jasmine'],
      base: ['Amber', 'Sandalwood', 'Musk']
    },
    description: 'A majestic oriental fragrance that showcases the finest oud surrounded by precious roses and golden saffron. Oud Abramad is an olfactory journey to distant lands.',
    imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600',
    rating: 4.9,
    price: 325,
    family: 'Oriental'
  },
  {
    id: '5',
    name: 'Baccarat Rouge 540',
    brand: 'Maison Francis Kurkdjian',
    year: 2015,
    perfumer: 'Francis Kurkdjian',
    gender: 'unisex',
    concentration: 'Eau de Parfum',
    notes: {
      top: ['Saffron', 'Jasmine'],
      heart: ['Amberwood', 'Maison Francis Kurkdjian Ambergris'],
      base: ['Fir Resin', 'Cedar']
    },
    description: 'A luminous and sophisticated fragrance that glows with the radiance of Baccarat crystal. This iconic scent blends floral and woody notes with a mineral amber accord.',
    imageUrl: 'https://images.unsplash.com/photo-1608528577891-eb055944f2e7?w=600',
    rating: 4.8,
    price: 365,
    family: 'Amber Floral'
  },
  {
    id: '6',
    name: 'Aventus',
    brand: 'Creed',
    year: 2010,
    perfumer: 'Olivier Creed',
    gender: 'masculine',
    concentration: 'Eau de Parfum',
    notes: {
      top: ['Pineapple', 'Bergamot', 'Black Currant', 'Apple'],
      heart: ['Birch', 'Patchouli', 'Moroccan Jasmine', 'Rose'],
      base: ['Musk', 'Oak Moss', 'Ambergris', 'Vanilla']
    },
    description: 'A celebration of strength, power, and success inspired by the dramatic life of Emperor Napoleon. Aventus is a fruity-chypre masterpiece that has become legendary.',
    imageUrl: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=600',
    rating: 4.7,
    price: 445,
    family: 'Chypre Fruity'
  },
  {
    id: '7',
    name: 'Delina',
    brand: 'Parfums de Marly',
    year: 2017,
    perfumer: 'Quentin Bisch',
    gender: 'feminine',
    concentration: 'Eau de Parfum',
    notes: {
      top: ['Lychee', 'Rhubarb', 'Bergamot'],
      heart: ['Turkish Rose', 'Peony', 'Vanilla'],
      base: ['Cashmeran', 'Musk', 'Cedarwood']
    },
    description: 'A floral symphony that celebrates femininity with Turkish roses and luminous peony. Delina is romantic, modern, and utterly captivating.',
    imageUrl: 'https://images.unsplash.com/photo-1595425964071-2c1ecb10b52d?w=600',
    rating: 4.6,
    price: 295,
    family: 'Floral'
  },
  {
    id: '8',
    name: 'Ombré Leather',
    brand: 'Tom Ford',
    year: 2018,
    perfumer: 'Sonia Constant',
    gender: 'unisex',
    concentration: 'Eau de Parfum',
    notes: {
      top: ['Cardamom', 'Violet Leaf'],
      heart: ['Leather', 'Jasmine Sambac'],
      base: ['Patchouli', 'Vetiver', 'Moss', 'Amber']
    },
    description: 'A bold, textured scent inspired by the vast deserts of the American Southwest. Ombré Leather is rugged yet refined, with a seductive leather heart.',
    imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600',
    rating: 4.5,
    price: 175,
    family: 'Leather'
  },
  {
    id: '9',
    name: 'Black Orchid',
    brand: 'Tom Ford',
    year: 2006,
    perfumer: 'Tom Ford',
    gender: 'unisex',
    concentration: 'Eau de Parfum',
    notes: {
      top: ['Truffle', 'Ylang-Ylang', 'Bergamot', 'Black Currant'],
      heart: ['Black Orchid', 'Lotus Wood', 'Orchid'],
      base: ['Patchouli', 'Sandalwood', 'Dark Chocolate', 'Incense', 'Vanilla', 'Vetiver']
    },
    description: 'A luxurious and sensual fragrance with an intoxicating blend of black orchid and spicy notes. Black Orchid is daring, seductive, and instantly recognizable.',
    imageUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=600',
    rating: 4.4,
    price: 165,
    family: 'Oriental Floral'
  },
  {
    id: '10',
    name: 'Nuit de Feu',
    brand: 'Louis Vuitton',
    year: 2020,
    perfumer: 'Jacques Cavallier',
    gender: 'unisex',
    concentration: 'Eau de Parfum',
    notes: {
      top: ['Saffron', 'Pink Pepper'],
      heart: ['Oud', 'Leather'],
      base: ['Benzoin', 'Castoreum', 'Cypriol']
    },
    description: 'A tribute to the mystical night rituals of the Middle East. Nuit de Feu captures the warmth of desert nights with its smoky oud and precious saffron.',
    imageUrl: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=600',
    rating: 4.7,
    price: 525,
    family: 'Oriental Woody'
  },
  {
    id: '11',
    name: 'Philosykos',
    brand: 'Diptyque',
    year: 1996,
    perfumer: 'Olivia Giacobetti',
    gender: 'unisex',
    concentration: 'Eau de Parfum',
    notes: {
      top: ['Fig Leaf', 'Fig Tree'],
      heart: ['Green Fig', 'Fig Sap'],
      base: ['White Cedar', 'Coconut']
    },
    description: 'A verdant ode to the fig tree in all its facets. Philosykos captures the entire tree from the milky sap to the woody bark and lush green leaves.',
    imageUrl: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600',
    rating: 4.5,
    price: 185,
    family: 'Green'
  },
  {
    id: '12',
    name: 'Portrait of a Lady',
    brand: 'Frederic Malle',
    year: 2010,
    perfumer: 'Dominique Ropion',
    gender: 'feminine',
    concentration: 'Eau de Parfum',
    notes: {
      top: ['Turkish Rose', 'Raspberry', 'Black Currant'],
      heart: ['Patchouli', 'Clove', 'Cinnamon'],
      base: ['Sandalwood', 'Musk', 'Benzoin', 'Frankincense']
    },
    description: 'A masterful composition that presents the Turkish rose in an entirely new light. Portrait of a Lady is opulent, mysterious, and breathtakingly beautiful.',
    imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600',
    rating: 4.9,
    price: 275,
    family: 'Oriental Floral'
  }
];

export const brands = [...new Set(perfumes.map(p => p.brand))];
export const genders = ['masculine', 'feminine', 'unisex'] as const;
export const families = [...new Set(perfumes.map(p => p.family))];
export const concentrations = [...new Set(perfumes.map(p => p.concentration))];
