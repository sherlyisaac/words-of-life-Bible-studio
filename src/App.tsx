import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  AppLanguage,
  AspectRatioType,
  CustomUploadedBackground,
  DesignProject,
  ImageAdjustments,
  NotificationSchedule,
  TypographySettings,
  Verse,
} from './types';
import { CURATED_VERSES } from './data/verses';
import { CURATED_BACKGROUNDS } from './data/backgrounds';
import { Header } from './components/Header';
import { CanvasPreview } from './components/CanvasPreview';
import { StudioControls } from './components/StudioControls';
import { DailyVerseModal } from './components/DailyVerseModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { ShareModal } from './components/ShareModal';
import { GalleryModal } from './components/GalleryModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  deleteDesign,
  getNotificationSchedule,
  getSavedDesigns,
  saveDesign,
  saveNotificationSchedule,
} from './utils/storage';
import {
  getTodayVerse,
  initializeDailyNotificationScheduler,
} from './utils/notifications';
import {
  compressImageFile,
  deleteCustomBackground,
  getCustomBackgrounds,
  getStoredCustomBackgrounds,
  saveCustomBackground,
} from './utils/customBackgrounds';
import { detectSmartTextColor } from './utils/canvasRenderer';

const DEFAULT_VERSE: Verse = CURATED_VERSES[0]; // Philippians 4:6-7
const DEFAULT_BACKGROUND = {
  type: 'preset' as const,
  url: CURATED_BACKGROUNDS[0].url,
};

const DEFAULT_TYPOGRAPHY: TypographySettings = {
  fontFamily: 'Playfair Display',
  fontSize: 44, // English default: 44px Extra-Bold (20% bigger than Hindi to balance presence)
  fontWeight: '800', // 800 Extra-Bold
  lineHeight: 1.30, // English tighter line height: 1.3
  letterSpacing: 0.8, // Letter spacing: +0.8px
  textAlign: 'center',
  textColor: '#1A1A1A', // Smart Charcoal Black default for light preset
  textColorMode: 'auto', // Default: Auto (Smart Detection)
  shadowStyle: 'none',
  shadowColor: 'rgba(0,0,0,0.16)',
  textBoxEnabled: false, // White Box OFF - background is clean!
  textBoxMode: 'white',
  backdropStyle: 'none',
  backdropColor: 'rgba(255, 255, 255, 0.75)',
  backdropOpacity: 75,
  ornament: 'cross',
  showReference: true,
  referenceFontSize: 14, // 14px reference at bottom
  referenceColor: '#C5A880', // Gold color #C5A880 for English
  referenceItalic: false, // ALL CAPS clean
  textContrastHalo: false,
  strokeWidth: 0,
  strokeColor: 'transparent',
};

// Default image adjustments with strictly separated blur logic:
// A) UPLOADED BACKGROUNDS: uploadedBlur = 0% default, NEVER auto-blur
// B) PHOTO PRESETS: blur = 60% default (soft celestial clouds / mountains)
const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 4,
  blur: 60, // Photo Blur: 60% default for photo presets (Clouds, Mountains)
  uploadedBlur: 0, // Soft Focus: 0% default, NEVER auto-blur for uploaded backgrounds!
  originalQuality: true, // Keep uploaded PNG/images crisp 1080x1920, no compression blur
  vignette: 0,
  overlayOpacity: 0, // Enable 40% Dark OFF by default
  overlayColor: '#000000',
  watercolorTexture: false,
  legibilityScrim: false,
  scrimIntensity: 'subtle',
};

export default function App() {
  // Studio Core States - Story 9:16 is default for WhatsApp Status
  const [verse, setVerse] = useState<Verse>(DEFAULT_VERSE);
  const [background, setBackground] = useState<DesignProject['background']>(DEFAULT_BACKGROUND);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('9:16');
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [typography, setTypography] = useState<TypographySettings>(DEFAULT_TYPOGRAPHY);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);

  // Gallery & Storage States (Loaded instantly from local storage cache)
  const [savedDesigns, setSavedDesigns] = useState<DesignProject[]>([]);
  const [customBackgrounds, setCustomBackgrounds] = useState<CustomUploadedBackground[]>(() =>
    getStoredCustomBackgrounds()
  );
  const [isSavedInGallery, setIsSavedInGallery] = useState(false);

  // Notification States
  const [notificationSchedule, setNotificationSchedule] = useState<NotificationSchedule>(
    getNotificationSchedule()
  );

  // Modals
  const [isDailyVerseOpen, setIsDailyVerseOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Initialize gallery, persistent custom backgrounds & push notification background scheduler
  useEffect(() => {
    setSavedDesigns(getSavedDesigns());

    // Sync persistent custom backgrounds (from IndexedDB / LocalStorage)
    getCustomBackgrounds().then((bgs) => {
      setCustomBackgrounds(bgs);
    });

    const cleanupScheduler = initializeDailyNotificationScheduler((triggeredVerse) => {
      console.log('Daily verse notification triggered:', triggeredVerse.reference);
    });

    return () => {
      cleanupScheduler();
    };
  }, []);

  // Update notification schedule
  const handleSaveNotificationSchedule = (schedule: NotificationSchedule) => {
    setNotificationSchedule(schedule);
    saveNotificationSchedule(schedule);
    initializeDailyNotificationScheduler();
  };

  // Language switch handler with language-tailored typography:
  // - Hindi: 36px Bold (thick Devanagari script)
  // - English: 44px Extra-Bold 800 weight, 1.3 line height, +0.8px letter spacing, #111111 pure black, gold reference #C5A880
  // - Malayalam: 38px Bold
  // - Hinglish: 40px Bold
  const handleLanguageChange = (newLang: AppLanguage) => {
    setLanguage(newLang);
    if (newLang === 'hi') {
      setTypography((prev) => ({
        ...prev,
        fontFamily: 'Martel',
        fontSize: 36, // Hindi: 36px Bold
        fontWeight: '700',
        lineHeight: 1.48,
        letterSpacing: 0,
        textColor: prev.textBoxEnabled ? '#2D2D2D' : '#2D2D2D',
        referenceColor: '#5C5242',
        referenceFontSize: 18,
        referenceItalic: true,
      }));
      if (verse.id === 'phil-4-6-7') {
        const rom8 = CURATED_VERSES.find((v) => v.id === 'rom-8-38-39');
        if (rom8) setVerse(rom8);
      }
    } else if (newLang === 'hinglish') {
      setTypography((prev) => ({
        ...prev,
        fontFamily: 'Poppins',
        fontSize: 40, // Hinglish: 40px Bold
        fontWeight: '700',
        lineHeight: 1.40,
        letterSpacing: 0.2,
        textColor: prev.textBoxEnabled ? '#2D2D2D' : '#2D2D2D',
        referenceColor: '#5C5242',
        referenceFontSize: 18,
        referenceItalic: true,
      }));
      if (verse.id === 'phil-4-6-7') {
        const rom8 = CURATED_VERSES.find((v) => v.id === 'rom-8-38-39');
        if (rom8) setVerse(rom8);
      }
    } else if (newLang === 'ml') {
      setTypography((prev) => ({
        ...prev,
        fontFamily: 'Noto Sans Malayalam',
        fontSize: 38, // Malayalam: 38px Bold
        fontWeight: '700',
        lineHeight: 1.50,
        letterSpacing: 0,
        textColor: prev.textBoxEnabled ? '#2D2D2D' : '#2D2D2D',
        referenceColor: '#5C5242',
        referenceFontSize: 18,
        referenceItalic: true,
      }));
    } else if (newLang === 'en') {
      setTypography((prev) => ({
        ...prev,
        fontFamily:
          prev.fontFamily === 'Martel' ||
          prev.fontFamily === 'Noto Sans Devanagari' ||
          prev.fontFamily === 'Noto Sans Malayalam'
            ? 'Playfair Display'
            : prev.fontFamily,
        fontSize: 44, // English: 44px Extra-Bold (20% bigger than Hindi)
        fontWeight: '800', // 800 Extra-Bold
        lineHeight: 1.30, // 1.3 tighter line height
        letterSpacing: 0.8, // +0.8px letter spacing
        textColor: '#111111', // Pure black, not gray
        referenceColor: '#C5A880', // Gold color for English reference
        referenceFontSize: 14,
        referenceItalic: false,
      }));
    }
    setIsSavedInGallery(false);
  };

  // Randomize verse for instant inspiration
  const handleRandomVerse = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * CURATED_VERSES.length);
    const newVerse = CURATED_VERSES[randomIndex];
    setVerse(newVerse);
    setIsSavedInGallery(false);
  }, []);

  // Upload custom background (Original Quality 1080x1920 PNG/JPEG, 0% blur)
  const handleUploadCustomBackground = async (file: File) => {
    try {
      const isOriginal = adjustments.originalQuality !== false;
      const compressedUrl = await compressImageFile(file, 1920, 0.98, isOriginal);
      const newBgItem: CustomUploadedBackground = {
        id: `custom-bg-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, '').slice(0, 30) || 'Custom Corner Design',
        url: compressedUrl,
        createdAt: Date.now(),
      };

      const updated = await saveCustomBackground(newBgItem, file);
      setCustomBackgrounds(updated);

      // Immediately apply to canvas & ensure uploadedBlur is 0 (NEVER auto-blur!)
      const activeUrl = updated[0]?.url || compressedUrl;
      setBackground({
        type: 'custom',
        url: activeUrl,
      });
      setAdjustments((prev) => ({
        ...prev,
        uploadedBlur: 0, // Uploaded & Corner designs: Blur = 0% by default, NEVER auto-blur!
      }));

      // FIX 1: Auto smart text color for uploaded image
      const smartColor = await detectSmartTextColor(compressedUrl);
      const isDark = smartColor === '#FFE8A0';
      console.log("Uploaded image evaluated -> smartColor:", smartColor, "isDark:", isDark);

      if (!typography.textColorMode || typography.textColorMode === 'auto') {
        setTypography((prev) => ({
          ...prev,
          textColorMode: 'auto',
          textColor: smartColor,
          shadowStyle: isDark ? 'glow' : 'none',
          fontWeight: isDark ? '800' : (language === 'en' ? '800' : '700'),
          referenceColor: isDark ? '#FFE8A0' : (language === 'en' ? '#C5A880' : '#5C5242'),
        }));
      }

      setIsSavedInGallery(false);

      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch (err) {
      console.error('Failed to process custom background:', err);
    }
  };

  // Delete custom background
  const handleDeleteCustomBackground = async (id: string) => {
    const updated = await deleteCustomBackground(id);
    setCustomBackgrounds(updated);
  };

  // Save current design to gallery
  const handleSaveCurrentDesign = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    let thumbnailDataUrl: string | undefined = undefined;
    if (canvas) {
      try {
        thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      } catch (err) {
        console.warn('Could not generate thumbnail:', err);
      }
    }

    const refLabel =
      language === 'hi' && verse.referenceHi ? verse.referenceHi : verse.reference;
    const transLabel = language === 'hi' ? 'हिन्दी' : verse.translation;

    const project: DesignProject = {
      id: `design-${Date.now()}`,
      title: `${refLabel} (${transLabel})`,
      verse,
      background,
      aspectRatio,
      typography,
      adjustments,
      createdAt: Date.now(),
      thumbnailDataUrl,
    };

    const updated = saveDesign(project);
    setSavedDesigns(updated);

    // If design uses a custom background, ensure it is permanently stored in the custom backgrounds library
    if (background.type === 'custom' && background.url) {
      if (!customBackgrounds.some((b) => b.url === background.url)) {
        const autoSavedBg: CustomUploadedBackground = {
          id: `custom-bg-${Date.now()}`,
          title: `Custom Photo (${refLabel})`,
          url: background.url,
          createdAt: Date.now(),
        };
        saveCustomBackground(autoSavedBg).then((bgs) => setCustomBackgrounds(bgs));
      }
    }

    setIsSavedInGallery(true);

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Load design from gallery into studio
  const handleLoadDesign = (project: DesignProject) => {
    setVerse(project.verse);
    setBackground(project.background);
    setAspectRatio(project.aspectRatio);
    setTypography(project.typography);
    setAdjustments(project.adjustments);
    setIsSavedInGallery(true);
  };

  // Delete design from gallery
  const handleDeleteDesign = (id: string) => {
    const updated = deleteDesign(id);
    setSavedDesigns(updated);
  };

  // Import designs
  const handleImportDesigns = (imported: DesignProject[]) => {
    let combined = [...savedDesigns];
    imported.forEach((item) => {
      if (!combined.some((c) => c.id === item.id)) {
        combined.unshift(item);
      }
    });
    localStorage.setItem('wordsoflife_saved_designs_v1', JSON.stringify(combined));
    setSavedDesigns(combined);
  };

  // Background change handler ensuring strictly separated blur logic
  const handleSetBackground = (newBg: DesignProject['background']) => {
    setBackground(newBg);
    const isCornerDesign =
      (newBg as any).category === 'Corner Designs' ||
      newBg.url.includes('/backgrounds/corner-designs/') ||
      newBg.type === 'custom';
    if (isCornerDesign) {
      // Uploaded & Corner designs: Blur = 0% by default, NEVER auto-blur!
      setAdjustments((prev) => ({
        ...prev,
        uploadedBlur: typeof prev.uploadedBlur === 'number' ? prev.uploadedBlur : 0,
      }));
    }

    // Auto-detect text color if in 'auto' mode
    if (!typography.textColorMode || typography.textColorMode === 'auto') {
      detectSmartTextColor(newBg.url).then((smartColor) => {
        const isDark = smartColor === '#FFE8A0';
        setTypography((prev) => ({
          ...prev,
          textColorMode: 'auto',
          textColor: smartColor,
          shadowStyle: isDark ? 'glow' : 'none',
          fontWeight: isDark ? '800' : (language === 'en' ? '800' : '700'),
          referenceColor: isDark ? '#FFE8A0' : (language === 'en' ? '#C5A880' : '#5C5242'),
        }));
      });
    }

    setIsSavedInGallery(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-500/30 selection:text-purple-200">
      {/* Top Header with Language Switcher */}
      <Header
        onOpenDailyVerse={() => setIsDailyVerseOpen(true)}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onRandomVerse={handleRandomVerse}
        savedCount={savedDesigns.length + customBackgrounds.length}
        notificationEnabled={notificationSchedule.enabled}
        language={language}
        onChangeLanguage={handleLanguageChange}
      />

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Canvas Preview */}
        <section className="w-full lg:w-[48%] flex flex-col items-center sticky top-20">
          <CanvasPreview
            verse={verse}
            background={background}
            onChangeBackground={handleSetBackground}
            aspectRatio={aspectRatio}
            onChangeAspectRatio={(ratio) => {
              setAspectRatio(ratio);
              setIsSavedInGallery(false);
            }}
            typography={typography}
            adjustments={adjustments}
            onChangeAdjustments={(newAdj) => {
              setAdjustments(newAdj);
              setIsSavedInGallery(false);
            }}
            onSaveToGallery={handleSaveCurrentDesign}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            isSaved={isSavedInGallery}
            language={language}
          />
        </section>

        {/* Right Column: Studio Customization Controls */}
        <section className="w-full lg:w-[52%]">
          <StudioControls
            verse={verse}
            onChangeVerse={(newVerse) => {
              setVerse(newVerse);
              setIsSavedInGallery(false);
            }}
            background={background}
            onChangeBackground={handleSetBackground}
            typography={typography}
            onChangeTypography={(newTypo) => {
              setTypography(newTypo);
              setIsSavedInGallery(false);
            }}
            adjustments={adjustments}
            onChangeAdjustments={(newAdj) => {
              setAdjustments(newAdj);
              setIsSavedInGallery(false);
            }}
            onRandomVerse={handleRandomVerse}
            customBackgrounds={customBackgrounds}
            onUploadCustomBackground={handleUploadCustomBackground}
            onDeleteCustomBackground={handleDeleteCustomBackground}
            language={language}
            onChangeLanguage={handleLanguageChange}
          />
        </section>
      </main>

      {/* Daily Verse of the Day Modal */}
      <DailyVerseModal
        verse={getTodayVerse()}
        isOpen={isDailyVerseOpen}
        onClose={() => setIsDailyVerseOpen(false)}
        onApplyToStudio={() => {
          setVerse(getTodayVerse());
          setIsSavedInGallery(false);
        }}
      />

      {/* Push Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        schedule={notificationSchedule}
        onSaveSchedule={handleSaveNotificationSchedule}
      />

      {/* Social Media Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        verse={verse}
        canvasElement={typeof document !== 'undefined' ? (document.querySelector('canvas') as HTMLCanvasElement) : null}
        language={language}
      />

      {/* Cloud & Local Gallery Modal */}
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        designs={savedDesigns}
        onLoadDesign={handleLoadDesign}
        onDeleteDesign={handleDeleteDesign}
        onImportDesigns={handleImportDesigns}
        customBackgrounds={customBackgrounds}
        onSelectCustomBackground={(customBg) => {
          setBackground({
            type: 'custom',
            url: customBg.url,
          });
          setIsSavedInGallery(false);
        }}
        onDeleteCustomBackground={handleDeleteCustomBackground}
        onUploadNewBackground={handleUploadCustomBackground}
        currentBackgroundUrl={background.url}
      />

      {/* Offline Status Banner */}
      <OfflineIndicator />
    </div>
  );
}
