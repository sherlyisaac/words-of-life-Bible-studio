import { BackgroundCategory, BackgroundItem } from '../types';

export const CLEAN_BACKGROUND_PRESETS: BackgroundItem[] = [
  {
    id: 'clean-soft-gradient',
    title: 'Soft Sunrise Peach & Pink',
    category: 'Clean Presets',
    style: 'gradient',
    url: 'clean:soft-gradient',
    tags: ['peach', 'pink', 'sunrise', 'soft', 'clean', 'minimal']
  },
  {
    id: 'clean-parchment',
    title: 'Old Bible Parchment Paper',
    category: 'Clean Presets',
    style: 'natural',
    url: 'clean:parchment',
    tags: ['parchment', 'paper', 'bible', 'antique', 'historic', 'warm']
  },
  {
    id: 'clean-bokeh',
    title: 'Blurred Light Bokeh',
    category: 'Clean Presets',
    style: 'natural',
    url: 'clean:bokeh',
    tags: ['bokeh', 'light', 'circles', 'soft', 'glow', 'peaceful']
  },
  {
    id: 'clean-navy-gold',
    title: 'Dark Navy & Gold Text',
    category: 'Clean Presets',
    style: 'gradient',
    url: 'clean:navy-gold',
    tags: ['navy', 'dark', 'gold', 'solid', 'premium', 'royal']
  }
];

export const PHOTO_BACKGROUND_PRESETS: BackgroundItem[] = [
  {
    id: 'photo-celestial-clouds',
    title: 'Celestial Clouds & Sunset',
    category: 'Clouds & Mountains',
    style: 'natural',
    url: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1600&q=80',
    tags: ['clouds', 'sky', 'sunset', 'heavenly']
  },
  {
    id: 'photo-morning-mountains',
    title: 'Misty Dawn Mountain Peaks',
    category: 'Clouds & Mountains',
    style: 'natural',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    tags: ['mountains', 'dawn', 'peaks', 'serene']
  },
  {
    id: 'photo-golden-heavens',
    title: 'Golden Light & Peaceful Sky',
    category: 'Clouds & Mountains',
    style: 'natural',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1600&q=80',
    tags: ['sky', 'sunburst', 'peaceful', 'light']
  },
  {
    id: 'photo-quiet-hills',
    title: 'Psalm 23 Green Hills',
    category: 'Clouds & Mountains',
    style: 'natural',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80',
    tags: ['hills', 'pastures', 'peace', 'shepherd']
  }
];

export const CORNER_DESIGN_PRESETS: BackgroundItem[] = [
  {
    id: 'corner-floral-pink',
    title: 'Floral Butterflies & Bees - Pink',
    category: 'Corner Designs',
    style: 'natural',
    url: '/backgrounds/corner-designs/floral-butterflies-bees-pink.png',
    tags: ['floral', 'flowers', 'pink', 'butterflies', 'bees', 'corner', 'frame', 'spring']
  },
  {
    id: 'corner-vintage-garden',
    title: 'Vintage Garden Frame - Corner',
    category: 'Corner Designs',
    style: 'natural',
    url: '/backgrounds/corner-designs/vintage-garden-frame-corner.png',
    tags: ['vintage', 'garden', 'frame', 'botanical', 'corner', 'parchment', 'roses']
  }
];

export const CURATED_BACKGROUNDS: BackgroundItem[] = [
  // Presets #1 to #4: Clean Presets
  ...CLEAN_BACKGROUND_PRESETS,
  // Presets #5 and #6: Clouds & Mountains
  PHOTO_BACKGROUND_PRESETS[0], // #5: Celestial Clouds & Sunset
  PHOTO_BACKGROUND_PRESETS[1], // #6: Misty Dawn Mountain Peaks
  // Presets #7 and #8: Corner Designs (Community & Shared)
  ...CORNER_DESIGN_PRESETS,
  // Additional scenery presets
  PHOTO_BACKGROUND_PRESETS[2],
  PHOTO_BACKGROUND_PRESETS[3]
];

export const BACKGROUND_CATEGORIES: BackgroundCategory[] = [
  'All',
  'Corner Designs',
  'Clean Presets',
  'Clouds & Mountains',
  'Community Designs'
];
