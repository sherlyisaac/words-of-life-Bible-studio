import React, { useEffect, useRef, useState } from 'react';
import { Download, Share2, Copy, Bookmark, Check, ZoomIn, RefreshCw, Sliders, ExternalLink, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  AppLanguage,
  AspectRatioType,
  DesignProject,
  ImageAdjustments,
  TypographySettings,
  Verse,
} from '../types';
import { canvasToBlob, renderDesignToCanvas } from '../utils/canvasRenderer';
import { CLEAN_BACKGROUND_PRESETS } from '../data/backgrounds';

interface CanvasPreviewProps {
  verse: Verse;
  background: DesignProject['background'];
  aspectRatio: AspectRatioType;
  typography: TypographySettings;
  adjustments: ImageAdjustments;
  language?: AppLanguage;
  onChangeAspectRatio: (ratio: AspectRatioType) => void;
  onChangeTypography?: (typography: TypographySettings) => void;
  onChangeAdjustments?: (adjustments: ImageAdjustments) => void;
  onChangeBackground?: (background: DesignProject['background']) => void;
  onSaveToGallery: () => void;
  onOpenShareModal: () => void;
  isSaved?: boolean;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  verse,
  background,
  aspectRatio,
  typography,
  adjustments,
  language = 'en',
  onChangeAspectRatio,
  onChangeAdjustments,
  onChangeBackground,
  onSaveToGallery,
  onOpenShareModal,
  isSaved = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpeg'>('jpeg');
  const [isSharingImage, setIsSharingImage] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [canDirectShareAndroid, setCanDirectShareAndroid] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);

  // Detect Android mobile with Web Share file support
  // iPhone and Desktop web browsers cannot share files directly to WhatsApp web/app,
  // so only show Direct Share on verified Android mobile devices.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    const ua = navigator.userAgent || '';
    const isAndroid = /android/i.test(ua);
    const isApple = /iphone|ipad|ipod|macintosh/i.test(ua);

    if (!isAndroid || isApple) {
      setCanDirectShareAndroid(false);
      return;
    }

    const nav = navigator as Navigator & {
      canShare?: (data?: { files?: File[] }) => boolean;
    };

    if (typeof nav.canShare === 'function') {
      try {
        const dummyFile = new File([''], 'status.jpg', { type: 'image/jpeg' });
        setCanDirectShareAndroid(Boolean(nav.canShare({ files: [dummyFile] })));
      } catch {
        setCanDirectShareAndroid(false);
      }
    } else {
      setCanDirectShareAndroid(false);
    }
  }, []);

  // Active localized text
  const activeVerseText =
    language === 'ml' && verse.textMl
      ? verse.textMl
      : language === 'hi' && verse.textHi
      ? verse.textHi
      : language === 'hinglish' && verse.textHinglish
      ? verse.textHinglish
      : verse.text;

  const activeVerseRef =
    language === 'ml' && verse.referenceMl
      ? verse.referenceMl
      : language === 'hi' && verse.referenceHi
      ? verse.referenceHi
      : verse.reference;

  // Render design to canvas
  useEffect(() => {
    let isCancelled = false;

    const render = async () => {
      if (!canvasRef.current) return;
      setIsRendering(true);
      try {
        await renderDesignToCanvas(canvasRef.current, {
          verse,
          background,
          aspectRatio,
          typography,
          adjustments,
          language,
        });
      } catch (err) {
        console.error('Canvas render failed:', err);
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
    };
  }, [verse, background, aspectRatio, typography, adjustments, language]);

  // WhatsApp Share with ACTUAL IMAGE FILE
  // 1. Generate blob from canvas (1080x1920 in 9:16)
  // 2. Create File object
  // 3. navigator.share({ files: [file] }) on mobile
  // 4. If unsupported / desktop: auto-download and open guidance modal
  const handleWhatsAppShareWithImage = async () => {
    if (!canvasRef.current) return;
    setIsSharingImage(true);
    try {
      // 1. Generate image blob (JPEG 95% quality, 1080x1920)
      const blob = await canvasToBlob(canvasRef.current, 'image/jpeg', 0.95);
      const safeRef = activeVerseRef.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_');
      const fileName = `WordsOfLife_${safeRef}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      // 2. Check if Web Share API with files is supported
      const nav = navigator as Navigator & {
        canShare?: (data?: { files?: File[] }) => boolean;
      };

      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: `Bible Verse - ${activeVerseRef}`,
          text: `"${activeVerseText}" — ${activeVerseRef} 🙏`,
        });
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.65 },
        });
        return;
      }

      // 3. Desktop / unsupported fallback: auto DOWNLOAD the image file immediately
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // 4. Show modal: "Image Downloaded! Now open WhatsApp and attach it from Gallery"
      setShowWhatsAppModal(true);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('WhatsApp share error:', err);
        handleDownload();
        setShowWhatsAppModal(true);
      }
    } finally {
      setIsSharingImage(false);
    }
  };

  // Direct Download Button
  const handleDownload = async () => {
    if (!canvasRef.current) return;
    try {
      const mimeType = downloadFormat === 'png' ? 'image/png' : 'image/jpeg';
      const ext = downloadFormat === 'png' ? 'png' : 'jpg';
      const blob = await canvasToBlob(canvasRef.current, mimeType, 0.95);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeRef = activeVerseRef.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_');
      a.href = url;
      a.download = `WordsOfLife_${safeRef}_${aspectRatio.replace(':', 'x')}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccessToast(true);
      setTimeout(() => setDownloadSuccessToast(false), 6000);

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Copy Image to Clipboard
  const handleCopyToClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      const clip = navigator.clipboard as Clipboard | undefined;
      if (clip && typeof clip.write === 'function') {
        const blob = await canvasToBlob(canvasRef.current, 'image/png');
        await clip.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      }
      if (clip && typeof clip.writeText === 'function') {
        await clip.writeText(`"${activeVerseText}" — ${activeVerseRef} - Share karo 🙏`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      }
    } catch {
      try {
        const clip = navigator.clipboard as Clipboard | undefined;
        if (clip && typeof clip.writeText === 'function') {
          await clip.writeText(`"${activeVerseText}" — ${activeVerseRef} - Share karo 🙏`);
        }
      } catch {}
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isPhotoBackground = background.url.startsWith('http') || background.type === 'custom';
  const currentPhotoBlur = typeof adjustments.blur === 'number' && adjustments.blur > 0 ? adjustments.blur : 60;

  const aspectClass = {
    '9:16': 'aspect-[9/16] max-w-[340px]',
    '1:1': 'aspect-square max-w-[460px]',
    '4:5': 'aspect-[4/5] max-w-[400px]',
    '16:9': 'aspect-[16/9] w-full max-w-[620px]',
  }[aspectRatio];

  return (
    <div className="flex flex-col items-center w-full">
      {/* Aspect Ratio Strip (Story 9:16 is default for WhatsApp Status) */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-lg gap-2 mb-2 px-1">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
          {(['9:16', '1:1', '4:5', '16:9'] as AspectRatioType[]).map((ratio) => {
            const labels: Record<AspectRatioType, string> = {
              '9:16': 'Story (WhatsApp 9:16)',
              '1:1': 'Square 1:1',
              '4:5': 'Portrait 4:5',
              '16:9': 'Banner 16:9',
            };
            const isActive = aspectRatio === ratio;
            return (
              <button
                key={ratio}
                onClick={() => onChangeAspectRatio(ratio)}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {labels[ratio]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clean Background Quick Pickers */}
      {onChangeBackground && (
        <div className="flex items-center justify-between w-full max-w-lg gap-1.5 mb-2.5 px-1 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/90 overflow-x-auto scrollbar-thin">
          <span className="text-[11px] font-semibold text-slate-400 pl-1 whitespace-nowrap">Background:</span>
          <div className="flex items-center gap-1.5">
            {CLEAN_BACKGROUND_PRESETS.map((preset) => {
              const isSelected = background.url === preset.url;
              return (
                <button
                  key={preset.id}
                  onClick={() => onChangeBackground({ type: 'preset', url: preset.url })}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition whitespace-nowrap border ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                  title={preset.title}
                >
                  {preset.title.split(' ')[0]} {preset.id.includes('navy') ? 'Navy' : preset.id.includes('parchment') ? 'Parchment' : preset.id.includes('bokeh') ? 'Bokeh' : 'Peach'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* A) UPLOADED & CORNER DESIGNS (Corner Floral Designs, Custom Art): 0% default, NEVER auto-blur! */}
      {(background.type === 'custom' || background.url.includes('/backgrounds/corner-designs/')) && onChangeAdjustments && (
        <div className="flex flex-wrap items-center justify-between w-full max-w-lg gap-2 mb-2.5 px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                onChangeAdjustments({
                  ...adjustments,
                  originalQuality: adjustments.originalQuality === false ? true : false,
                })
              }
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                adjustments.originalQuality !== false
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Toggle Original Quality (keeps PNG lossless sharp 1080x1920)"
            >
              ✦ {adjustments.originalQuality !== false ? 'Original Quality: ON (Sharp)' : 'Original Quality: OFF'}
            </button>
            <span className="font-semibold text-purple-200">Soft Focus (optional):</span>
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-[170px]">
            <input
              type="range"
              min="0"
              max="100"
              value={adjustments.uploadedBlur || 0}
              onChange={(e) =>
                onChangeAdjustments({
                  ...adjustments,
                  uploadedBlur: Number(e.target.value),
                })
              }
              className="w-full accent-purple-400 cursor-pointer h-1.5 rounded-lg bg-slate-800"
            />
            <span className="text-xs font-mono text-purple-300 w-8 text-right">
              {adjustments.uploadedBlur || 0}%
            </span>
          </div>
        </div>
      )}

      {/* B) PHOTO PRESETS (Celestial Clouds, Misty Mountains): 60% default Photo Blur */}
      {background.url.startsWith('http') && background.type !== 'custom' && onChangeAdjustments && (
        <div className="flex items-center justify-between w-full max-w-lg gap-3 mb-2.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-amber-200">Photo Blur:</span>
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-[200px]">
            <input
              type="range"
              min="0"
              max="100"
              value={typeof adjustments.blur === 'number' ? adjustments.blur : 60}
              onChange={(e) =>
                onChangeAdjustments({
                  ...adjustments,
                  blur: Number(e.target.value),
                })
              }
              className="w-full accent-amber-400 cursor-pointer h-1.5 rounded-lg bg-slate-800"
            />
            <span className="text-xs font-mono text-amber-300 w-8 text-right">
              {typeof adjustments.blur === 'number' ? adjustments.blur : 60}%
            </span>
          </div>
        </div>
      )}

      {/* Main Canvas Preview Container */}
      <div className="relative w-full flex items-center justify-center p-2 sm:p-4 rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-slate-800/80 shadow-2xl backdrop-blur-md">
        <div
          className={`relative w-full ${aspectClass} overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl border border-white/15 transition-all duration-300 group`}
        >
          {/* Real Off-screen Canvas rendered directly (1080x1920 in 9:16) */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain block bg-slate-950"
          />

          {/* Rendering spinner overlay if busy */}
          {isRendering && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center transition-opacity">
              <RefreshCw className="w-6 h-6 text-emerald-300 animate-spin" />
            </div>
          )}

          {/* Quick Zoom preview button on hover */}
          <button
            onClick={() => setIsZoomed(true)}
            className="absolute top-3 right-3 p-2 rounded-xl bg-black/50 hover:bg-black/80 backdrop-blur-md text-white/90 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title="Expand Full View"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Bar - Final Public UX */}
      <div className="w-full max-w-lg mt-4 flex flex-col gap-2.5 px-1">
        {/* 1. PRIMARY BUTTON (big green, always works for everyone): "📥 Download HD - Ready for Status" */}
        <div className="flex items-stretch gap-2 w-full">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 px-5 sm:px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white font-extrabold text-base sm:text-lg shadow-2xl shadow-emerald-950/80 ring-4 ring-emerald-400/40 hover:ring-emerald-300 transition-all cursor-pointer group"
            title="Download crisp 1080x1920 image ready for WhatsApp Status"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">📥</span>
            <span className="tracking-tight">Download HD - Ready for Status</span>
          </button>

          <select
            value={downloadFormat}
            onChange={(e) => setDownloadFormat(e.target.value as 'png' | 'jpeg')}
            className="bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-bold px-3 rounded-2xl outline-none cursor-pointer shadow-md transition"
            title="Image format (JPG recommended for WhatsApp)"
          >
            <option value="jpeg">JPG</option>
            <option value="png">PNG</option>
          </select>
        </div>

        {/* User guidance / success toast */}
        {downloadSuccessToast ? (
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-semibold animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Image Downloaded! Now open WhatsApp → Status → Add photo.</span>
          </div>
        ) : (
          <p className="text-[11px] text-center text-slate-400">
            One-click 1080×1920 HD download • Open WhatsApp → Add to Status
          </p>
        )}

        {/* 2. SECONDARY BUTTON: Show ONLY on Android Mobile with Web Share file support */}
        {canDirectShareAndroid && (
          <button
            onClick={handleWhatsAppShareWithImage}
            disabled={isSharingImage}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 active:scale-[0.99] border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-emerald-200 font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-75"
            title="One-tap direct share to WhatsApp on Android"
          >
            {isSharingImage ? (
              <>
                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>Preparing WhatsApp Share...</span>
              </>
            ) : (
              <>
                <span className="text-base">↗️</span>
                <svg className="w-4 h-4 fill-current text-[#25D366] flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.071.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.158.571 4.184 1.573 5.932l-1.637 5.975 6.136-1.609c1.701.925 3.649 1.452 5.728 1.452 6.627 0 12-5.373 12-12s-5.373-12-12-12z" />
                </svg>
                <span>Direct Share to WhatsApp</span>
              </>
            )}
          </button>
        )}

        {/* 3. Secondary Utility Row: Save Design, Copy Image, Share Link */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={onSaveToGallery}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition active:scale-95 border ${
              isSaved
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-slate-600'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 text-purple-400" />
                <span>Save Design</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyToClipboard}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold transition active:scale-95"
            title="Copy image or verse to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                <span>Copy Image</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenShareModal}
            className="flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-semibold transition active:scale-95"
            title="More sharing platforms"
          >
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
            <span>More</span>
          </button>
        </div>
      </div>

      {/* WHATSAPP DESKTOP/GALLERY GUIDANCE MODAL */}
      {showWhatsAppModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowWhatsAppModal(false)}
        >
          <div
            className="relative w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-emerald-500/50 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowWhatsAppModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6 text-[#25D366]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Image Downloaded! 🎉</h3>
                <p className="text-xs text-slate-300">Crisp 1080x1920 Status Graphic Ready</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-emerald-300">How to attach to WhatsApp:</p>
              <ol className="list-decimal pl-4 space-y-1 text-slate-300 text-[11px] leading-relaxed">
                <li>Your Bible graphic is now in your device's <b>Downloads / Gallery</b>.</li>
                <li>Open <b>WhatsApp</b> and go to <b>Status</b> or any Chat.</li>
                <li>Tap the <b>Camera / Attach</b> icon and select the image!</li>
              </ol>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href="https://web.whatsapp.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs transition"
              >
                <span>Open WhatsApp Web</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={canvasRef.current?.toDataURL() || ''}
              alt={activeVerseRef}
              className="max-h-[80vh] w-auto rounded-2xl shadow-2xl border border-white/20 object-contain"
            />
            <p className="mt-3 text-xs text-slate-400 text-center">
              Click anywhere to close full preview
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
