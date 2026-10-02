export type AspectRatioType = '1:1' | '9:16' | '4:5' | '16:9';

export type AppLanguage = 'en' | 'hi' | 'hinglish' | 'ml';

export interface Verse {
  id: string;
  reference: string; // e.g. "Romans 8:38-39"
  referenceHi?: string; // e.g. "रोमियों 8:38-39"
  referenceMl?: string; // e.g. "റോമർ 8:38-39"
  text: string; // English
  textHi?: string; // Hindi (Devanagari)
  textHinglish?: string; // Hinglish (Roman Hindi)
  textMl?: string; // Malayalam
  mood: MoodCategory;
  translation: 'NIV' | 'KJV' | 'NKJV' | 'ESV' | 'NLT' | 'CSB' | 'BSI-Hindi' | 'Hindi' | 'BSI-Malayalam' | 'Malayalam';
  theme?: string;
  themeHi?: string;
  themeMl?: string;
}

export type MoodCategory =
  | 'All'
  | 'Peace & Rest'
  | 'Hope & Future'
  | 'Strength & Courage'
  | 'Anxiety & Comfort'
  | 'Love & Grace'
  | 'Joy & Praise'
  | 'Gratitude'
  | 'Healing'
  | 'Morning Inspiration'
  | 'Wisdom & Faith';

export type CornerStyle = 'floral' | 'golden-cross' | 'minimal-leaves' | 'diwali-diya' | 'none';

export type BackgroundCategory =
  | 'All'
  | 'Corner Designs'
  | 'Clean Presets'
  | 'Clouds & Mountains'
  | 'Community Designs';

export interface CustomUploadedBackground {
  id: string;
  title: string;
  url: string; // compressed data URL
  createdAt: number;
  default?: boolean;
}

export interface BackgroundItem {
  id: string;
  title: string;
  category: BackgroundCategory;
  url: string;
  thumbnailUrl?: string;
  style: 'natural' | 'watercolor' | 'gradient';
  tags: string[];
  default?: boolean;
}

export type FontFamily =
  | 'Playfair Display'
  | 'Cinzel'
  | 'Cormorant Garamond'
  | 'Great Vibes'
  | 'Dancing Script'
  | 'Caveat'
  | 'Montserrat'
  | 'Lora'
  | 'Bebas Neue'
  | 'Martel'
  | 'Noto Sans Devanagari'
  | 'Poppins'
  | 'Noto Sans Malayalam';

export type TextAlign = 'center' | 'left' | 'right';

export type TextShadowStyle = 'none' | 'soft' | 'strong' | 'glow' | 'deep';

export type TextBackdropStyle = 'none' | 'pill' | 'frosted' | 'ribbon' | 'dark-box' | 'white-box';

export type DecorativeOrnament = 'none' | 'cross' | 'leaf-wreath' | 'quote-marks' | 'divider-line' | 'stars';

export type TextColorMode = 'auto' | 'gold-glow' | 'dark' | 'white';

export type TextVerticalPosition = 'auto' | 'top' | 'center' | 'bottom';

export interface SafeZone {
  x: number;
  y: number;
  width: number;
  height: number;
  alignment: 'top' | 'center' | 'bottom';
  isFullPhoto?: boolean;
}

export interface TypographySettings {
  fontFamily: FontFamily;
  fontSize: number; // base scale 20 - 70
  fontWeight: '300' | '400' | '600' | '700' | '800' | '900';
  lineHeight: number; // 1.2 - 2.0
  letterSpacing: number; // -1 to 8
  textAlign: TextAlign;
  textColor: string;
  textColorMode?: TextColorMode; // 'auto' (default: smart auto-detection) | 'gold-glow' | 'dark' | 'white'
  textPosition?: TextVerticalPosition; // 'auto' (smart empty-space detection) | 'top' | 'center' | 'bottom'
  textOffsetY?: number; // Manual vertical drag / offset in pixels (-300 to 300)
  isFullPhoto?: boolean; // Set when image has subjects (kittens, scenery) needing top empty-space
  safeZoneBackdrop?: boolean; // Semi-transparent backdrop blur behind text for photo readability
  isDarkBackgroundDetected?: boolean;
  shadowStyle: TextShadowStyle;
  shadowColor: string;
  textBoxEnabled: boolean; // Text Background Box - ON by default
  textBoxMode: 'dark' | 'white'; // 'dark' (Black box 60% transparency + white text) or 'white' (White box 70% transparency + dark text)
  cornerStyle?: CornerStyle; // Corner design style: 'floral' | 'golden-cross' | 'minimal-leaves' | 'diwali-diya' | 'none'
  backdropStyle: TextBackdropStyle;
  backdropColor: string;
  backdropOpacity: number;
  ornament: DecorativeOrnament;
  showReference: boolean;
  referenceFontSize: number;
  referenceColor: string;
  referenceItalic: boolean;
  textContrastHalo?: boolean; // Micro-contrast outline around letters
  strokeWidth?: number; // 2px stroke
  strokeColor?: string;
}

export interface ImageAdjustments {
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  blur: number; // 0 to 100: Photo Blur for photo presets (Clouds, Mountains), default 60%
  uploadedBlur?: number; // 0 to 100: Soft Focus for uploaded backgrounds, default 0%, NEVER auto-blur!
  originalQuality?: boolean; // Keep uploaded PNG/images crisp 1080x1920, no compression blur
  vignette: number; // 0 to 100
  overlayOpacity: number; // 0 to 80 (dark/light tint)
  overlayColor: string;
  watercolorTexture: boolean;
  legibilityScrim: boolean; // Contrast shadow behind text for crystal-clear readability
  scrimIntensity?: 'subtle' | 'strong' | 'deep';
}

export interface DesignProject {
  id: string;
  title: string;
  verse: Verse;
  background: {
    type: 'preset' | 'custom' | 'gradient';
    url: string;
    gradient?: string;
  };
  aspectRatio: AspectRatioType;
  typography: TypographySettings;
  adjustments: ImageAdjustments;
  createdAt: number;
  thumbnailDataUrl?: string;
}

export interface NotificationSchedule {
  enabled: boolean;
  time: string; // "08:00"
  lastSentDate?: string; // "YYYY-MM-DD"
}
