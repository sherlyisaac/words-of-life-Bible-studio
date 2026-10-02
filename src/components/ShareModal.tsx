import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageCircle, Twitter, Facebook } from 'lucide-react';
import { AppLanguage, Verse } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  verse: Verse;
  canvasElement?: HTMLCanvasElement | null;
  language?: AppLanguage;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  verse,
  canvasElement,
  language = 'en',
}) => {
  const [copied, setCopied] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [isSharingNative, setIsSharingNative] = useState(false);

  if (!isOpen) return null;

  const activeText =
    language === 'hi' && verse.textHi
      ? verse.textHi
      : language === 'hinglish' && verse.textHinglish
      ? verse.textHinglish
      : verse.text;

  const activeRef =
    language === 'hi' && verse.referenceHi
      ? verse.referenceHi
      : verse.reference;

  const shareText = `"${activeText}" — ${activeRef} ${
    customNote ? `\n\n${customNote}` : ''
  }\n\nShare karo 🙏`;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://wordsoflife.app';

  // Native Web Share with Image Blob (Mobile Instagram, WhatsApp, AirDrop, Messages)
  const handleNativeShare = async () => {
    if (!navigator.share) return;
    setIsSharingNative(true);

    try {
      if (canvasElement && 'toBlob' in canvasElement) {
        canvasElement.toBlob(async (blob) => {
          if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'verse.png', { type: 'image/png' })] })) {
            const file = new File([blob], `verse_${activeRef.replace(/\s+/g, '_')}.png`, {
              type: 'image/png',
            });
            await navigator.share({
              title: `${activeRef} — Scripture Art`,
              text: shareText,
              files: [file],
            });
          } else {
            await navigator.share({
              title: `${activeRef} — Scripture Art`,
              text: shareText,
              url: shareUrl,
            });
          }
          setIsSharingNative(false);
        }, 'image/png');
      } else {
        await navigator.share({
          title: `${activeRef} — Scripture Art`,
          text: shareText,
          url: shareUrl,
        });
        setIsSharingNative(false);
      }
    } catch {
      setIsSharingNative(false);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareToWhatsApp = async () => {
    const whatsAppPreFill = `"${activeText}" — ${activeRef} - Share karo 🙏`;
    if (canvasElement && 'toBlob' in canvasElement) {
      canvasElement.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `verse_${activeRef.replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });
          const nav = navigator as Navigator & { canShare?: (d?: { files?: File[] }) => boolean };
          if (nav.canShare && nav.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: activeRef,
                text: whatsAppPreFill,
                files: [file],
              });
              return;
            } catch {}
          }
          // Fallback download if canShare files is not available
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `WordsOfLife_${activeRef.replace(/\s+/g, '_')}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        const webUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppPreFill)}`;
        window.open(webUrl, '_blank');
      }, 'image/jpeg', 0.95);
      return;
    }

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppPreFill)}`;
    try {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(url, '_blank');
    }
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-7 shadow-2xl text-slate-100 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Share Scripture</h3>
            <p className="text-xs text-slate-400">
              Spread peace, faith, and encouragement with friends
            </p>
          </div>
        </div>

        {/* Big Green WhatsApp Share button */}
        <button
          onClick={shareToWhatsApp}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-950/60 ring-2 ring-emerald-400/50 flex items-center justify-center gap-2.5 mb-4 transition cursor-pointer"
        >
          <MessageCircle className="w-5 h-5 fill-current text-white" />
          <span>Share on WhatsApp - Share karo 🙏</span>
        </button>

        {/* Optional personal message note */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
            Add a personal note or prayer (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Thinking of you today! Praying for your week..."
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Primary Native Device Share Button (Works best on iOS & Android for Instagram, Stories) */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleNativeShare}
            disabled={isSharingNative}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 mb-3 transition active:scale-98"
          >
            <Share2 className="w-4 h-4 text-purple-400" />
            <span>
              {isSharingNative ? 'Preparing Share...' : 'More Apps (Instagram, AirDrop, Messages)'}
            </span>
          </button>
        )}

        {/* Direct Social Platform Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <button
            onClick={shareToTwitter}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-sky-950/40 hover:bg-sky-900/50 border border-sky-800/40 text-sky-300 text-xs font-medium transition"
          >
            <Twitter className="w-4 h-4 text-sky-400" />
            <span>X / Twitter</span>
          </button>

          <button
            onClick={shareToFacebook}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/40 text-blue-300 text-xs font-medium transition"
          >
            <Facebook className="w-4 h-4 text-blue-400" />
            <span>Facebook</span>
          </button>
        </div>

        {/* Copy Verse Text & Quote */}
        <button
          onClick={handleCopyText}
          className="w-full py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-2 transition active:scale-98"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300">Verse Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-400" />
              <span>Copy Verse Text</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
