import {
  AppLanguage,
  AspectRatioType,
  DecorativeOrnament,
  DesignProject,
  ImageAdjustments,
  TypographySettings,
} from '../types';

export const ASPECT_RATIO_DIMENSIONS: Record<AspectRatioType, { width: number; height: number; label: string }> = {
  '9:16': { width: 1080, height: 1920, label: 'Story (9:16 WhatsApp Status)' },
  '1:1': { width: 1200, height: 1200, label: 'Square (1:1)' },
  '4:5': { width: 1080, height: 1350, label: 'Portrait (4:5)' },
  '16:9': { width: 1920, height: 1080, label: 'Banner (16:9)' },
};

// Cache loaded images
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Smart Text Color Engine - exact user implementation
 * Draws bg to 100x100 canvas, samples center area (40, 30, 20, 40), calculates brightness.
 * brightness < 100 ? "#FFE8A0" (dark bg = gold) : "#1A1A1A" (light bg = black)
 */
export function getSmartTextColor(bgImage: HTMLImageElement | HTMLCanvasElement): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#1A1A1A';
    canvas.width = 100;
    canvas.height = 100;
    ctx.drawImage(bgImage, 0, 0, 100, 100);
    const data = ctx.getImageData(40, 30, 20, 40).data; // center area
    let brightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    brightness = brightness / (data.length / 4);
    console.log("BG Brightness:", brightness); // debug

    return brightness < 100 ? "#FFE8A0" : "#1A1A1A"; // dark bg = gold, light = black
  } catch (err) {
    console.warn("getSmartTextColor fallback:", err);
    return '#1A1A1A';
  }
}

/**
 * Universal async smart text color detector supporting image element, canvas, or URL string
 */
export async function detectSmartTextColor(source: HTMLImageElement | HTMLCanvasElement | string): Promise<string> {
  if (typeof source === 'string') {
    if (source === 'clean:navy-gold' || source.includes('navy')) {
      console.log("BG Brightness (preset dark navy): 35");
      return '#FFE8A0';
    }
    if (source.startsWith('clean:')) {
      console.log("BG Brightness (preset light): 230");
      return '#1A1A1A';
    }
    try {
      const img = await preloadImage(source);
      return getSmartTextColor(img);
    } catch {
      return source.includes('navy') ? '#FFE8A0' : '#1A1A1A';
    }
  }
  return getSmartTextColor(source);
}

/**
 * Analyzes center 50% area of an image or background (where scripture text sits)
 * Samples: (x: 25% to 75%, y: 25% to 75%)
 * Calculates: average brightness (R + G + B) / 3
 * Returns: brightness 0 to 255 (< 100 = DARK, >= 100 = LIGHT)
 */
export async function getBackgroundBrightness(
  source: HTMLImageElement | HTMLCanvasElement | string,
  w = 200,
  h = 200
): Promise<number> {
  try {
    let el: HTMLImageElement | HTMLCanvasElement;
    if (typeof source === 'string') {
      el = await preloadImage(source);
    } else {
      el = source;
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 200;

    ctx.drawImage(el, 0, 0, w, h);
    const startX = Math.round(w * 0.25);
    const startY = Math.round(h * 0.25);
    const sampleW = Math.round(w * 0.50);
    const sampleH = Math.round(h * 0.50);

    const imgData = ctx.getImageData(startX, startY, sampleW, sampleH);
    const data = imgData.data;

    let total = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 16) {
      const a = data[i + 3] / 255;
      const r = data[i] * a + 255 * (1 - a);
      const g = data[i + 1] * a + 255 * (1 - a);
      const b = data[i + 2] * a + 255 * (1 - a);
      total += (r + g + b) / 3;
      count++;
    }
    const brightness = count > 0 ? Math.round(total / count) : 200;
    console.log("BG Brightness:", brightness);
    return brightness;
  } catch {
    return 200;
  }
}

/**
 * Synchronous preset brightness lookup for all curated library backgrounds
 * < 100 = DARK background (Dark Navy -> Gold text + glow)
 * >= 100 = LIGHT background (Soft Peach, Parchment, Floral Corner -> Charcoal black text)
 */
export function detectPresetBrightness(bgUrl: string): number {
  if (bgUrl === 'clean:navy-gold' || bgUrl.includes('navy')) return 35; // Preset Dark Navy
  if (bgUrl === 'clean:soft-gradient') return 235; // Preset Soft Peach
  if (bgUrl === 'clean:parchment') return 230; // Preset Old Parchment
  if (bgUrl === 'clean:bokeh') return 220; // Preset Blurred Bokeh
  if (bgUrl.includes('floral-butterflies-bees-pink')) return 245; // Preset #7 Floral Corner
  if (bgUrl.includes('vintage-garden-frame-corner')) return 235; // Preset #8 Vintage Garden Frame
  if (bgUrl.includes('photo-celestial-clouds') || bgUrl.includes('1534088568595')) return 160;
  if (bgUrl.includes('photo-morning-mountains') || bgUrl.includes('1464822759023')) return 150;
  if (bgUrl.includes('photo-golden-heavens') || bgUrl.includes('1509114397022')) return 180;
  if (bgUrl.includes('photo-quiet-hills') || bgUrl.includes('1500382017468')) return 170;
  return 200;
}

export function preloadImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) {
    const cached = imageCache.get(url)!;
    if (cached.complete) return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      const fallback = new Image();
      fallback.onload = () => {
        imageCache.set(url, fallback);
        resolve(fallback);
      };
      fallback.onerror = (err) => reject(err);
      fallback.src = url;
    };
    img.src = url;
  });
}

/**
 * Smart Auto Line-Break
 * Wraps text respecting both pixel max-width AND max-characters-per-line (25 for Hindi, 35 for English)
 */
function wrapTextWithCharLimits(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxCharsPerLine: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;
    const testChars = testLine.length;

    // Break line if either char limit or pixel width is exceeded
    if ((testChars > maxCharsPerLine || testWidth > maxWidth) && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Decorative Ornaments (Cross, Laurel, etc.)
 */
function drawOrnament(
  ctx: CanvasRenderingContext2D,
  ornament: DecorativeOrnament,
  centerX: number,
  y: number,
  color: string,
  scale = 1
) {
  ctx.save();
  ctx.translate(centerX, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * scale;

  if (ornament === 'cross') {
    const w = 4.5 * scale;
    const h = 30 * scale;
    const armW = 20 * scale;
    const armH = 4.5 * scale;
    const armY = -6 * scale;

    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillRect(-armW / 2, armY - armH / 2, armW, armH);

    ctx.beginPath();
    ctx.arc(0, -h / 2 - 3.5 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
  } else if (ornament === 'leaf-wreath') {
    ctx.beginPath();
    ctx.arc(0, 0, 18 * scale, Math.PI * 0.2, Math.PI * 0.8, false);
    ctx.stroke();

    for (let i = -2; i <= 2; i++) {
      const angle = (i * 25 * Math.PI) / 180;
      const lx = Math.sin(angle) * 22 * scale;
      const ly = Math.cos(angle) * 12 * scale;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 5 * scale, 2.4 * scale, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ornament === 'quote-marks') {
    ctx.font = `italic 900 ${44 * scale}px "Playfair Display", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('“', 0, 0);
  } else if (ornament === 'divider-line') {
    const len = 70 * scale;
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(len, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -4 * scale);
    ctx.lineTo(4 * scale, 0);
    ctx.lineTo(0, 4 * scale);
    ctx.lineTo(-4 * scale, 0);
    ctx.closePath();
    ctx.fill();
  } else if (ornament === 'stars') {
    [-24 * scale, 0, 24 * scale].forEach((sx, idx) => {
      const s = idx === 1 ? 5 * scale : 3.5 * scale;
      ctx.beginPath();
      ctx.arc(sx, 0, s, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();
}

/**
 * ========================================================
 * CLEAN BACKGROUND PAINTERS
 * Option 1: Soft Gradient (Sunrise Peach #FFD6BA to Light Pink)
 * Option 2: Parchment Paper texture (old Bible feel)
 * Option 3: Blurred Light Bokeh (soft glowing circles)
 * Option 4: Solid Color - Dark Navy #1A2332 with Gold Text
 * ========================================================
 */

// Option 1: Soft Gradient (Sunrise Peach to Light Pink)
function drawSoftGradientBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, w * 0.8, h);
  grad.addColorStop(0, '#FFE8D6');
  grad.addColorStop(0.35, '#FFD6BA');
  grad.addColorStop(0.70, '#FED7AA');
  grad.addColorStop(1, '#FECDD3');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Soft radiant center glow
  const centerGlow = ctx.createRadialGradient(w / 2, h * 0.42, 50, w / 2, h * 0.42, w * 0.7);
  centerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  centerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, w, h);
}

// Option 2: Parchment Paper (Old Bible feel with warm fibers and subtle vignette)
function drawParchmentBackground(ctx: CanvasRenderingContext2D, w: number, h: number, baseScale: number) {
  // Base antique parchment tone
  ctx.fillStyle = '#F5EEDB';
  ctx.fillRect(0, 0, w, h);

  // Warm textured gradient
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
  grad.addColorStop(0, '#FFF9ED');
  grad.addColorStop(0.7, '#F3E9D2');
  grad.addColorStop(1, '#E8DBBE');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle historical deckle vignette
  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.85);
  vignette.addColorStop(0, 'rgba(180, 150, 110, 0)');
  vignette.addColorStop(1, 'rgba(160, 125, 80, 0.22)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // Delicate antique double border
  ctx.save();
  const inset1 = Math.round(30 * baseScale);
  const inset2 = Math.round(36 * baseScale);
  ctx.strokeStyle = 'rgba(180, 145, 95, 0.35)';
  ctx.lineWidth = Math.max(1, 1.2 * baseScale);
  ctx.strokeRect(inset1, inset1, w - inset1 * 2, h - inset1 * 2);

  ctx.strokeStyle = 'rgba(180, 145, 95, 0.18)';
  ctx.lineWidth = Math.max(0.6, 0.8 * baseScale);
  ctx.strokeRect(inset2, inset2, w - inset2 * 2, h - inset2 * 2);
  ctx.restore();
}

// Option 3: Blurred Light Bokeh (Soft glowing circles, not sharp)
function drawBlurredBokehBackground(ctx: CanvasRenderingContext2D, w: number, h: number, baseScale: number) {
  // Soft pastel peach-cream base
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, '#FFF5EB');
  bgGrad.addColorStop(0.5, '#FDEBD8');
  bgGrad.addColorStop(1, '#FEDFD4');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Soft, out-of-focus celestial glowing bokeh circles
  const bokehCircles = [
    { x: w * 0.2, y: h * 0.18, r: 160 * baseScale, color: 'rgba(255, 237, 213, 0.65)' },
    { x: w * 0.82, y: h * 0.22, r: 190 * baseScale, color: 'rgba(254, 215, 170, 0.55)' },
    { x: w * 0.15, y: h * 0.72, r: 210 * baseScale, color: 'rgba(253, 230, 138, 0.45)' },
    { x: w * 0.85, y: h * 0.78, r: 180 * baseScale, color: 'rgba(254, 205, 211, 0.55)' },
    { x: w * 0.5, y: h * 0.85, r: 240 * baseScale, color: 'rgba(254, 240, 138, 0.35)' },
    { x: w * 0.35, y: h * 0.38, r: 120 * baseScale, color: 'rgba(255, 255, 255, 0.75)' },
    { x: w * 0.68, y: h * 0.55, r: 140 * baseScale, color: 'rgba(255, 247, 237, 0.65)' },
  ];

  ctx.save();
  bokehCircles.forEach((c) => {
    const radial = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
    radial.addColorStop(0, c.color);
    radial.addColorStop(0.7, c.color.replace(/[\d\.]+\)$/, '0.2)'));
    radial.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

// Option 4: Solid Color - Dark Navy #1A2332 with subtle vignette
function drawDarkNavyBackground(ctx: CanvasRenderingContext2D, w: number, h: number, baseScale: number) {
  // Rich midnight navy base
  ctx.fillStyle = '#1A2332';
  ctx.fillRect(0, 0, w, h);

  // Subtle radial gradient for depth
  const grad = ctx.createRadialGradient(w / 2, h * 0.45, 100, w / 2, h / 2, Math.max(w, h) * 0.75);
  grad.addColorStop(0, '#222E42');
  grad.addColorStop(0.7, '#1A2332');
  grad.addColorStop(1, '#121824');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Elegant fine gold hairline border
  ctx.save();
  const inset = Math.round(32 * baseScale);
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)'; // Gold hairline
  ctx.lineWidth = Math.max(1, 1.2 * baseScale);
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  ctx.restore();
}

export async function renderDesignToCanvas(
  canvas: HTMLCanvasElement,
  design: {
    verse: DesignProject['verse'];
    background: DesignProject['background'];
    aspectRatio: AspectRatioType;
    typography: TypographySettings;
    adjustments: ImageAdjustments;
    language?: AppLanguage;
  }
): Promise<void> {
  const { verse, background, aspectRatio, typography, adjustments, language = 'en' } = design;
  const targetDims = ASPECT_RATIO_DIMENSIONS[aspectRatio];

  canvas.width = targetDims.width;
  canvas.height = targetDims.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const baseScale = Math.min(w, h) / 1000;
  const isBanner = aspectRatio === '16:9';

  // Clear canvas
  ctx.clearRect(0, 0, w, h);

  // Check background type
  const isDarkNavy = background.url === 'clean:navy-gold';
  const isParchment = background.url === 'clean:parchment';
  const isBokeh = background.url === 'clean:bokeh';
  const isSoftGradient = background.url === 'clean:soft-gradient' || background.url.startsWith('clean:');
  const isCornerDesign =
    (background as any).category === 'Corner Designs' ||
    background.url.includes('/backgrounds/corner-designs/') ||
    background.url.includes('/backgrounds/');
  const isCustomUploaded = background.type === 'custom';
  const isPhotoPreset = background.url.startsWith('http') && !isCustomUploaded && !isCornerDesign;
  const isAnyPhoto = isCustomUploaded || isPhotoPreset || isCornerDesign || background.url.startsWith('/');

  // 1. Draw Backgrounds
  if (isDarkNavy) {
    drawDarkNavyBackground(ctx, w, h, baseScale);
  } else if (isParchment) {
    drawParchmentBackground(ctx, w, h, baseScale);
  } else if (isBokeh) {
    drawBlurredBokehBackground(ctx, w, h, baseScale);
  } else if (isSoftGradient && !isAnyPhoto) {
    drawSoftGradientBackground(ctx, w, h);
  } else if (isAnyPhoto) {
    // Photo or Uploaded background or Corner Design Preset
    try {
      const img = await preloadImage(background.url);
      ctx.save();

      // BLUR LOGIC:
      // A) UPLOADED BACKGROUNDS & CORNER DESIGNS:
      //    - Blur = 0% by default, NEVER auto-blur!
      //    - Only blur if user explicitly set uploadedBlur > 0
      // B) PHOTO PRESETS (Celestial Clouds, Misty Mountains):
      //    - Blur = 60% default is OK, keeps scenic photos soft
      //    - Label: "Photo Blur"
      let blurPct = 0;
      if (isCustomUploaded || isCornerDesign) {
        blurPct = typeof adjustments.uploadedBlur === 'number' ? adjustments.uploadedBlur : 0;
      } else if (isPhotoPreset) {
        blurPct = typeof adjustments.blur === 'number' ? adjustments.blur : 60;
      }

      if (blurPct > 0) {
        const blurPx = Math.round((blurPct / 100) * 20);
        ctx.filter = `blur(${blurPx}px) brightness(${100 + (adjustments.brightness || 0)}%) contrast(${100 + (adjustments.contrast || 0)}%)`;
      } else if (adjustments.brightness !== 0 || adjustments.contrast !== 0) {
        ctx.filter = `brightness(${100 + (adjustments.brightness || 0)}%) contrast(${100 + (adjustments.contrast || 0)}%)`;
      } else {
        ctx.filter = 'none';
      }

      const imgRatio = img.width / img.height;
      const canvasRatio = w / h;
      let drawW = w;
      let drawH = h;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        drawW = w;
        drawH = w / imgRatio;
        offsetY = (h - drawH) / 2;
      } else {
        drawH = h;
        drawW = h * imgRatio;
        offsetX = (w - drawW) / 2;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      ctx.restore();
    } catch {
      drawSoftGradientBackground(ctx, w, h);
    }
  } else {
    drawSoftGradientBackground(ctx, w, h);
  }

  // 2. Measure Background Brightness via getSmartTextColor (for Auto Smart Text Color)
  let smartColor = '#1A1A1A';
  if (isDarkNavy) {
    console.log("BG Brightness (preset dark navy): 35");
    smartColor = '#FFE8A0';
  } else if (isParchment || isSoftGradient || isBokeh) {
    console.log("BG Brightness (preset light): 230");
    smartColor = '#1A1A1A';
  } else {
    // Exact getSmartTextColor logic running on the drawn background canvas
    smartColor = getSmartTextColor(canvas);
  }

  const colorMode = typography.textColorMode || 'auto';
  let isDarkBg = false;
  if (colorMode === 'gold-glow') {
    isDarkBg = true;
  } else if (colorMode === 'dark') {
    isDarkBg = false;
  } else if (colorMode === 'white') {
    isDarkBg = true;
  } else {
    // Default: 'auto' smart detection
    isDarkBg = smartColor === '#FFE8A0';
  }

  // 3. Subtle Bottom Gradient Only (dark gradient on dark backgrounds, or subtle warm tint on light)
  ctx.save();
  const bottomGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
  if (isDarkBg) {
    bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    bottomGrad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
  } else {
    bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    bottomGrad.addColorStop(1, 'rgba(35, 25, 18, 0.12)');
  }
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, h * 0.65, w, h * 0.35);
  ctx.restore();

  // 3. Active text & reference selection according to language
  const activeText =
    language === 'ml' && verse.textMl
      ? verse.textMl
      : language === 'hi' && verse.textHi
      ? verse.textHi
      : language === 'hinglish' && verse.textHinglish
      ? verse.textHinglish
      : verse.text;

  const activeRef =
    language === 'ml' && verse.referenceMl
      ? verse.referenceMl
      : language === 'hi' && verse.referenceHi
      ? verse.referenceHi
      : verse.reference;

  const activeTranslation =
    language === 'ml'
      ? 'മലയാളം'
      : language === 'hi'
      ? 'हिन्दी'
      : language === 'hinglish'
      ? 'Hinglish'
      : verse.translation;

  // 4. Font Family & Weight Resolution
  // - Hindi: Martel Bold or Noto Sans Devanagari Bold (700 weight, never thin)
  // - Hinglish: Poppins Bold or Martel Bold (700 weight)
  // - Malayalam: Noto Sans Malayalam Bold (700 weight)
  // - English: Playfair Display Extra-Bold or Cinzel/Cormorant Garamond (800 weight, never 600)
  const isEnglish = language === 'en';
  const isHindiScript = language === 'hi' || language === 'ml';

  let resolvedFontFamily: string;
  let resolvedFontWeight = '700';

  if (isEnglish) {
    resolvedFontWeight = typography.fontWeight === '900' || typography.fontWeight === '800' ? typography.fontWeight : '800';
    if (
      typography.fontFamily === 'Cinzel' ||
      typography.fontFamily === 'Cormorant Garamond' ||
      typography.fontFamily === 'Lora' ||
      typography.fontFamily === 'Montserrat' ||
      typography.fontFamily === 'Playfair Display'
    ) {
      resolvedFontFamily = `'${typography.fontFamily}', 'Playfair Display', serif`;
    } else if (
      typography.fontFamily === 'Great Vibes' ||
      typography.fontFamily === 'Dancing Script' ||
      typography.fontFamily === 'Caveat'
    ) {
      resolvedFontFamily = `'${typography.fontFamily}', cursive, serif`;
    } else {
      resolvedFontFamily = `'${typography.fontFamily}', 'Playfair Display', serif`;
    }
  } else if (language === 'hi') {
    resolvedFontFamily =
      typography.fontFamily === 'Noto Sans Devanagari'
        ? `'Noto Sans Devanagari', 'Martel', serif`
        : `'Martel', 'Noto Sans Devanagari', serif`;
  } else if (language === 'hinglish') {
    resolvedFontFamily = `'Poppins', 'Martel', 'Noto Sans Devanagari', sans-serif`;
  } else if (language === 'ml') {
    resolvedFontFamily = `'Noto Sans Malayalam', 'Poppins', sans-serif`;
  } else {
    resolvedFontFamily = `'Playfair Display', serif`;
  }

  // 5. AUTO TEXT ADJUST ENGINE (Typography is STAR: 70-80% Presence)
  // Language-based font sizing:
  // - Hindi: 36px Bold
  // - English: 44px Extra-Bold (20% bigger than Hindi to balance script density)
  //   - Short English verse: 48px
  //   - Medium: 42px
  //   - Long like Phil 4:6-7: 36px minimum!
  // - Malayalam: 38px Bold
  // - Hinglish: 40px Bold
  const charCount = activeText.length;
  let defaultLangBaseSize = 36;
  let minLangBaseSize = 28;

  if (isEnglish) {
    minLangBaseSize = 36; // Long like Phil 4:6-7: strictly 36px minimum! Never drop to 20-22px!
    if (charCount < 110) {
      defaultLangBaseSize = 48; // Short English verse: 48px
    } else if (charCount <= 200) {
      defaultLangBaseSize = 42; // Medium English verse: 42px
    } else {
      defaultLangBaseSize = 36; // Long English verse: 36px minimum
    }
  } else if (language === 'hi') {
    defaultLangBaseSize = 36;
    minLangBaseSize = 28;
  } else if (language === 'hinglish') {
    defaultLangBaseSize = 40;
    minLangBaseSize = 30;
  } else if (language === 'ml') {
    defaultLangBaseSize = 38;
    minLangBaseSize = 28;
  }

  // Respect user-chosen custom slider if manually modified, but maintain language minimum
  const startBaseSize = Math.max(
    minLangBaseSize,
    typography.fontSize && typography.fontSize !== 32 && typography.fontSize !== 34
      ? typography.fontSize
      : defaultLangBaseSize
  );
  let currentBaseSize = startBaseSize;

  const maxContainerWidth = Math.round(w * (isEnglish ? 0.85 : 0.88));
  const maxContainerHeight = Math.round(h * 0.86);

  // English stanzas look best at ~34-36 chars per line; Hindi at ~40
  const maxCharsPerLine = isEnglish ? 36 : isHindiScript ? 40 : 44;

  const baseScaleFactor = isBanner ? 1.45 : (isEnglish ? 1.35 : 1.25);
  const scaleFactor = baseScaleFactor * baseScale;
  const lineHeightMultiplier = isEnglish ? 1.30 : isHindiScript ? 1.48 : 1.38;

  let finalFontSize = currentBaseSize;
  let finalLines: string[] = [];
  let finalLineHeight = 0;
  let finalRefFontSize = 0;
  let finalTotalContentHeight = 0;
  const hasOrnament = typography.ornament !== 'none';

  // Sizing loop: strictly clamped to minLangBaseSize (36px for English!)
  while (currentBaseSize >= minLangBaseSize) {
    finalFontSize = Math.round(currentBaseSize * scaleFactor);
    finalLineHeight = Math.round(finalFontSize * lineHeightMultiplier);

    ctx.font = `${resolvedFontWeight} ${finalFontSize}px ${resolvedFontFamily}`;
    if ('letterSpacing' in ctx) {
      (ctx as any).letterSpacing = isEnglish ? `${typography.letterSpacing || 0.8}px` : '0px';
    }

    finalLines = wrapTextWithCharLimits(ctx, activeText, maxContainerWidth, maxCharsPerLine);

    const textBlockHeight = finalLines.length * finalLineHeight;
    finalRefFontSize = Math.round(Math.max(15, currentBaseSize * 0.60) * (isBanner ? 1.2 : 1.05) * baseScale);
    const ornamentGap = hasOrnament ? (isEnglish ? 46 : 36) * baseScale : 0;
    const refGap = typography.showReference ? (isEnglish ? 36 : 26) * baseScale + finalRefFontSize : 0;
    finalTotalContentHeight = textBlockHeight + ornamentGap + refGap;

    if (finalTotalContentHeight <= maxContainerHeight || currentBaseSize <= minLangBaseSize) {
      break;
    }

    currentBaseSize -= 1;
  }

  currentBaseSize = Math.max(minLangBaseSize, currentBaseSize);

  // 6. Auto-Center Vertically
  const startY = Math.max(Math.round(h * 0.08), (h - finalTotalContentHeight) / 2);

  // 7. Smart Typography Colors & Glow:
  // IF DARK BACKGROUND:
  // - Text: #FFE8A0 Champagne Gold + glow
  // - text-shadow: 0 0 20px gold
  // - Weight: 800 Bold
  // - Works for any dark bg any user uploads - black, navy, maroon, dark green
  //
  // IF LIGHT BACKGROUND:
  // - Text: #1A1A1A Charcoal Black
  // - No glow needed
  // - Weight: 700 Bold (800 for English)
  let finalTextColor = '#1A1A1A';
  let finalRefColor = '#5C5242';
  let ornamentColor = '#9A7B38';

  if (colorMode === 'white') {
    finalTextColor = '#FFFFFF';
    finalRefColor = '#FFE8A0';
    ornamentColor = '#FFE8A0';
    resolvedFontWeight = '800';
  } else if (isDarkBg) {
    finalTextColor = '#FFE8A0'; // Champagne Gold
    finalRefColor = '#FFE8A0'; // Matching champagne gold reference
    ornamentColor = '#FFE8A0';
    resolvedFontWeight = '800'; // 800 Bold
  } else {
    finalTextColor = '#1A1A1A'; // Charcoal Black
    finalRefColor = isEnglish ? '#C5A880' : '#5C5242'; // Gold reference for English, warm dark for Hindi
    ornamentColor = isEnglish ? '#C5A880' : '#9A7B38';
    resolvedFontWeight = isEnglish ? '800' : '700'; // Bold
  }

  const textX = w / 2; // centered
  let currentY = startY;

  // 8. Draw Top Ornament if enabled
  if (hasOrnament) {
    drawOrnament(ctx, typography.ornament, textX, currentY, ornamentColor, baseScale * 1.15);
    currentY += (isEnglish ? 46 : 40) * baseScale;
  }

  // 9. Draw Verse Lines with Smart Glow or Shadow
  ctx.save();
  ctx.font = `${isDarkBg ? '800' : resolvedFontWeight} ${finalFontSize}px ${resolvedFontFamily}`;
  if ('letterSpacing' in ctx) {
    (ctx as any).letterSpacing = isEnglish ? `${typography.letterSpacing || 0.8}px` : '0px';
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  if (colorMode === 'white') {
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.90)';
    ctx.shadowBlur = 14 * baseScale;
    ctx.shadowOffsetY = 3 * baseScale;
    for (let i = 0; i < finalLines.length; i++) {
      const line = finalLines[i];
      const lineY = currentY + i * finalLineHeight;
      ctx.fillText(line, textX, lineY);
    }
  } else {
    // FIX 1: Exact code requested by user:
    // ctx.fillStyle = isDarkBg ? "#FFE8A0" : "#1A1A1A";
    // if (isDarkBg) { ctx.shadowColor = "#FFD700"; ctx.shadowBlur = 20; ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 3; ctx.strokeText(text, x, y); }
    // ctx.fillText(text, x, y);
    // ctx.shadowBlur = 0;
    ctx.fillStyle = isDarkBg ? '#FFE8A0' : '#1A1A1A';
    for (let i = 0; i < finalLines.length; i++) {
      const line = finalLines[i];
      const lineY = currentY + i * finalLineHeight;
      if (isDarkBg) {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 3;
        ctx.strokeText(line, textX, lineY);
      }
      ctx.fillText(line, textX, lineY);
      ctx.shadowBlur = 0;
    }
  }
  ctx.restore();

  currentY += finalLines.length * finalLineHeight;

  // 10. Draw Scripture Reference
  // - English: ALL CAPS for reference "PHILIPPIANS 4:6-7" at bottom, 14px, gold color #FFE8A0 / #C5A880
  // - Hindi: Normal case reference
  if (typography.showReference) {
    currentY += Math.round((isEnglish ? 36 : 28) * baseScale);
    ctx.save();

    if (isEnglish) {
      const englishRefFontSize = Math.round(14 * (isBanner ? 1.2 : 1.05) * baseScale);
      ctx.font = `800 ${englishRefFontSize}px 'Cinzel', 'Playfair Display', serif`;
      if ('letterSpacing' in ctx) {
        (ctx as any).letterSpacing = '2px'; // Tracked ALL CAPS
      }
      ctx.fillStyle = isDarkBg ? '#FFE8A0' : '#C5A880';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      if (isDarkBg) {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeText(activeRef.toUpperCase(), textX, currentY);
        ctx.fillText(activeRef.toUpperCase(), textX, currentY);
        ctx.shadowBlur = 0;
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.10)';
        ctx.shadowBlur = 4 * baseScale;
        ctx.shadowOffsetY = 1 * baseScale;
        ctx.fillText(activeRef.toUpperCase(), textX, currentY);
        ctx.shadowBlur = 0;
      }
    } else {
      ctx.font = `${typography.referenceItalic ? 'italic' : 'normal'} 700 ${finalRefFontSize}px ${resolvedFontFamily}`;
      if ('letterSpacing' in ctx) {
        (ctx as any).letterSpacing = '0px';
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isDarkBg ? '#FFE8A0' : finalRefColor;

      if (isDarkBg) {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeText(`— ${activeRef} (${activeTranslation})`, textX, currentY);
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.10)';
        ctx.shadowBlur = 4 * baseScale;
        ctx.shadowOffsetY = 1 * baseScale;
      }

      const refString = `— ${activeRef} (${activeTranslation})`;
      ctx.fillText(refString, textX, currentY);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement, format: 'image/png' | 'image/jpeg' = 'image/jpeg', quality = 0.95): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas export failed'));
      },
      format,
      quality
    );
  });
}
