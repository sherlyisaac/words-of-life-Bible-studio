import React from 'react';
import { X, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import { Verse } from '../types';

interface DailyVerseModalProps {
  verse: Verse;
  isOpen: boolean;
  onClose: () => void;
  onApplyToStudio: () => void;
}

export const DailyVerseModal: React.FC<DailyVerseModalProps> = ({
  verse,
  isOpen,
  onClose,
  onApplyToStudio,
}) => {
  if (!isOpen) return null;

  const todayDateString = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 p-6 sm:p-8 shadow-2xl text-slate-100 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
              Verse of the Day
            </span>
            <p className="text-[11px] text-slate-400">{todayDateString}</p>
          </div>
        </div>

        {/* Verse Card */}
        <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 shadow-inner mb-6 space-y-4">
          <p className="text-lg sm:text-xl text-slate-100 font-serif italic leading-relaxed">
            "{verse.text}"
          </p>
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
            <span className="text-sm font-bold text-amber-300 font-cinzel">
              {verse.reference}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {verse.translation}
            </span>
          </div>
        </div>

        {/* Mood & Encouragement */}
        {verse.theme && (
          <div className="flex items-center gap-2 mb-6 text-xs text-purple-300 bg-purple-950/30 border border-purple-800/40 p-3 rounded-xl">
            <Sparkles className="w-4 h-4 flex-shrink-0 text-purple-400" />
            <span>Theme: <strong>{verse.theme}</strong> — May this Scripture bring peace and encouragement to your heart today.</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => {
            onApplyToStudio();
            onClose();
          }}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-950/50 flex items-center justify-center gap-2 transition active:scale-98"
        >
          <span>Create Artwork with Today's Verse</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
