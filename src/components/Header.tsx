import React from 'react';
import { Sparkles, Bell, Image as ImageIcon, BookOpen, Shuffle, Globe } from 'lucide-react';
import { AppLanguage } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onOpenDailyVerse: () => void;
  onOpenGallery: () => void;
  onOpenNotifications: () => void;
  onRandomVerse: () => void;
  savedCount: number;
  notificationEnabled: boolean;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDailyVerse,
  onOpenGallery,
  onOpenNotifications,
  onRandomVerse,
  savedCount,
  notificationEnabled,
  language,
  onChangeLanguage,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Brand & Language Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-500 p-[2px] shadow-lg shadow-purple-950/50 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <div className="logo flex items-baseline text-base sm:text-lg text-white">
                  <span className="text-white" style={{ fontWeight: 900, letterSpacing: '1px' }}>WORDS</span>
                  <span className="text-amber-200/90" style={{ fontWeight: 300, fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif", fontSize: '0.85em', opacity: 0.85, margin: '0 3.5px' }}>of</span>
                  <span className="text-white" style={{ fontWeight: 900, letterSpacing: '1px' }}>LIFE</span>
                </div>
                <span className="hidden md:inline-flex text-[10px] tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                  Bible Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Scripture Status & Art Generator
              </p>
            </div>
          </div>

          {/* Language Toggle: English | Hindi | Hinglish | Malayalam */}
          <div className="flex items-center rounded-xl bg-slate-900/90 border border-slate-700/80 p-0.5 shadow-inner">
            <span className="pl-2 pr-1 text-slate-400 text-xs hidden lg:flex items-center">
              <Globe className="w-3.5 h-3.5 mr-1 text-purple-400" />
            </span>
            {(
              [
                { id: 'en', label: 'English' },
                { id: 'hi', label: 'हिन्दी' },
                { id: 'hinglish', label: 'Hinglish' },
                { id: 'ml', label: 'മലയാളം' },
              ] as { id: AppLanguage; label: string }[]
            ).map((lang) => {
              const isActive = language === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => onChangeLanguage(lang.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={`Switch language to ${lang.label}`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Randomizer */}
          <button
            onClick={onRandomVerse}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition active:scale-95"
            title="Random inspiring scripture"
          >
            <Shuffle className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden lg:inline">Inspire Me</span>
          </button>

          {/* Daily Verse Button */}
          <button
            onClick={onOpenDailyVerse}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 text-xs font-medium transition active:scale-95"
            title="Today's Verse"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Daily Verse</span>
          </button>

          {/* Push Reminder Bell */}
          <button
            onClick={onOpenNotifications}
            className={`relative p-2 rounded-lg border text-xs transition active:scale-95 ${
              notificationEnabled
                ? 'border-purple-500/40 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Daily Verse Push Reminders"
          >
            <Bell className="w-4 h-4" />
            {notificationEnabled && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
            )}
          </button>

          {/* Gallery Button */}
          <button
            onClick={onOpenGallery}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-medium transition active:scale-95"
            title="Saved Gallery"
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Gallery</span>
            {savedCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-purple-600 text-[10px] font-bold text-white">
                {savedCount}
              </span>
            )}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
