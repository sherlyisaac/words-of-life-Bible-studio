import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Book,
  Image as ImageIcon,
  Type,
  Sliders,
  Search,
  Sparkles,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Shuffle,
  Check,
  Palette,
  Trash2,
  Eye,
  ShieldCheck,
  Move,
  X
} from 'lucide-react';
import {
  AppLanguage,
  BackgroundCategory,
  CustomUploadedBackground,
  DecorativeOrnament,
  DesignProject,
  FontFamily,
  ImageAdjustments,
  MoodCategory,
  TextAlign,
  TextBackdropStyle,
  TextColorMode,
  TextShadowStyle,
  TypographySettings,
  Verse
} from '../types';
import { BACKGROUND_CATEGORIES, CURATED_BACKGROUNDS } from '../data/backgrounds';
import { CURATED_VERSES, MOOD_CATEGORIES } from '../data/verses';
import { searchVersesSmart, VerseSearchResult } from '../utils/geminiVerseFinder';
import { getSmartTextColor, detectSmartTextColor } from '../utils/canvasRenderer';

interface StudioControlsProps {
  verse: Verse;
  onChangeVerse: (verse: Verse) => void;
  background: DesignProject['background'];
  onChangeBackground: (bg: DesignProject['background']) => void;
  typography: TypographySettings;
  onChangeTypography: (typo: TypographySettings) => void;
  adjustments: ImageAdjustments;
  onChangeAdjustments: (adj: ImageAdjustments) => void;
  onRandomVerse: () => void;
  customBackgrounds: CustomUploadedBackground[];
  onUploadCustomBackground: (file: File) => void;
  onDeleteCustomBackground: (id: string) => void;
  language?: AppLanguage;
  onChangeLanguage?: (lang: AppLanguage) => void;
}

export const StudioControls: React.FC<StudioControlsProps> = ({
  verse,
  onChangeVerse,
  background,
  onChangeBackground,
  typography,
  onChangeTypography,
  adjustments,
  onChangeAdjustments,
  onRandomVerse,
  customBackgrounds,
  onUploadCustomBackground,
  onDeleteCustomBackground,
  language = 'en',
  onChangeLanguage,
}) => {
  const [activeTab, setActiveTab] = useState<'verse' | 'background' | 'typography' | 'effects'>('verse');

  // Verse tab states
  const [selectedMood, setSelectedMood] = useState<MoodCategory>('All');
  const [selectedBook, setSelectedBook] = useState<string>('All Books');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VerseSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);

  // Background tab states
  const [selectedBgCategory, setSelectedBgCategory] = useState<BackgroundCategory>('All');

  // Book aliases for multi-lingual and abbreviation search matching
  const BOOK_ALIASES: Record<string, string[]> = {
    philippians: ['phil', 'php', 'philippians', 'फिलिप्पियों', 'ഫിലിപ്പിയർ'],
    psalm: ['ps', 'psa', 'psm', 'psalm', 'psalms', 'भजन', 'भजन संहिता', 'സങ്കീർത്തനങ്ങൾ', 'സങ്കീർത്തനം'],
    romans: ['rom', 'ro', 'romans', 'रोमियों', 'റോമർ'],
    john: ['jn', 'jhn', 'john', 'यूहन्ना', 'യോഹന്നാൻ'],
    matthew: ['mt', 'matt', 'matthew', 'मत्ती', 'മത്തായി'],
    proverbs: ['prov', 'prv', 'proverbs', 'नीतिवचन', 'സദൃശവാക്യങ്ങൾ'],
    isaiah: ['isa', 'is', 'isaiah', 'यशायाह', 'യെശയ്യാവു'],
    jeremiah: ['jer', 'jeremiah', 'यिर्मयाह', 'യിരെമ്യാവു'],
    joshua: ['josh', 'jos', 'joshua', 'यहोशू', 'യോശുവ'],
    corinthians: ['cor', '1 cor', '2 cor', 'corinthians', 'कुरिन्थियों', 'കൊരിന്ത്യർ'],
    peter: ['pet', '1 pet', '2 pet', 'peter', 'पतरस', 'പത്രൊസ്'],
    hebrews: ['heb', 'hebrews', 'इब्रानियों', 'എബ്രായർ'],
    galatians: ['gal', 'galatians', 'गलातियों', 'ഗലാത്യർ'],
    nehemiah: ['neh', 'nehemiah', 'नहेमायाह', 'നെഹെമ്യാവു'],
    lamentations: ['lam', 'lamentations', 'विलापगीत', 'വിലാപങ്ങൾ'],
    numbers: ['num', 'numbers', 'गिनती', 'സംഖ്യാപുസ്തകം'],
  };

  // Real-time instant search across book, chapter, keyword, or mood
  const filteredVerses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return CURATED_VERSES.filter((v) => {
      // 1. Mood filter
      if (selectedMood !== 'All' && v.mood !== selectedMood) {
        return false;
      }

      // 2. Book filter
      if (selectedBook !== 'All Books') {
        const bookLower = selectedBook.toLowerCase();
        const refLower = v.reference.toLowerCase();
        const matchesBook =
          refLower.includes(bookLower) ||
          (bookLower === 'psalms' && refLower.includes('psalm')) ||
          (bookLower === 'corinthians' && refLower.includes('corinthians'));
        if (!matchesBook) return false;
      }

      // 3. Search query matching
      if (!q) return true;

      // Check book aliases matching
      for (const [canonicalBook, aliases] of Object.entries(BOOK_ALIASES)) {
        if (aliases.some((alias) => q.startsWith(alias) || q.includes(alias))) {
          if (v.reference.toLowerCase().includes(canonicalBook)) {
            const numMatch = q.match(/\d+([:\-]\d+)?/);
            if (numMatch) {
              if (v.reference.includes(numMatch[0])) return true;
            } else {
              return true;
            }
          }
        }
      }

      // Corpus of all search fields
      const corpus = [
        v.reference,
        v.referenceHi || '',
        v.referenceMl || '',
        v.text,
        v.textHi || '',
        v.textHinglish || '',
        v.textMl || '',
        v.mood,
        v.theme || '',
        v.themeHi || '',
        v.themeMl || '',
        v.translation,
      ]
        .join(' ')
        .toLowerCase();

      if (corpus.includes(q)) return true;

      // Multi-word search
      const words = q.split(/\s+/).filter(Boolean);
      if (words.length > 1 && words.every((w) => corpus.includes(w))) {
        return true;
      }

      return false;
    });
  }, [searchQuery, selectedMood, selectedBook]);

  // Handle Search via AI for specialized queries
  const handlePerformSearch = async (query: string, mood: MoodCategory) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchVersesSmart(query, mood);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  // Upload custom background
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadCustomBackground(file);
    }
  };

  // Instant clarity booster
  const handleApplyClarityBoost = () => {
    onChangeTypography({
      ...typography,
      shadowStyle: 'strong',
      textColor: '#ffffff',
      referenceColor: '#fde047',
      fontWeight: '700',
    });
    onChangeAdjustments({
      ...adjustments,
      legibilityScrim: true,
      scrimIntensity: 'strong',
      vignette: Math.max(30, adjustments.vignette),
    });
  };

  // Filter backgrounds
  const filteredPresetBackgrounds = CURATED_BACKGROUNDS.filter((bg) => {
    if (selectedBgCategory === 'All') return true;
    if (selectedBgCategory === 'Community Designs') return false;
    return bg.category === selectedBgCategory;
  });

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1">
        <button
          onClick={() => setActiveTab('verse')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'verse'
              ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span>Scripture</span>
        </button>

        <button
          onClick={() => setActiveTab('background')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'background'
              ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-pink-400" />
          <span>Background</span>
          {customBackgrounds.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-pink-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('typography')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'typography'
              ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Type className="w-4 h-4 text-amber-400" />
          <span>Typography</span>
        </button>

        <button
          onClick={() => setActiveTab('effects')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'effects'
              ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Effects</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-4 sm:p-5 max-h-[560px] overflow-y-auto">
        {/* ================= SCRIPTURE TAB ================= */}
        {activeTab === 'verse' && (
          <div className="space-y-4">
            {/* Live Search Bar for Verses by Book, Chapter, or Keyword */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by book, chapter, or keyword (e.g. Philippians 4:6, Psalm 23, peace, strength)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePerformSearch(searchQuery, selectedMood);
                }}
                className="w-full pl-9 pr-24 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:border-purple-500 focus:outline-none transition shadow-inner"
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-purple-400" />

              <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handlePerformSearch(searchQuery, selectedMood)}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/60 disabled:text-purple-400 text-white text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                  title="Search entire Bible with AI"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isSearching ? 'Finding...' : 'AI Find'}</span>
                </button>
              </div>
            </div>

            {/* Quick Filter: Popular Books */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Book className="w-3 h-3 text-purple-400" />
                  Filter by Book
                </p>
                {selectedBook !== 'All Books' && (
                  <button
                    onClick={() => setSelectedBook('All Books')}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Reset Book
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {[
                  'All Books',
                  'Philippians',
                  'Psalms',
                  'Romans',
                  'John',
                  'Matthew',
                  'Proverbs',
                  'Isaiah',
                  'Jeremiah',
                  'Joshua',
                  'Corinthians',
                  '1 Peter',
                  'Hebrews',
                  'Galatians',
                ].map((book) => {
                  const isSelected = selectedBook === book;
                  return (
                    <button
                      key={book}
                      onClick={() => setSelectedBook(book)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400'
                          : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                      }`}
                    >
                      {book}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter by Mood / Theme */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Filter by Mood / Theme
                </p>
                {selectedMood !== 'All' && (
                  <button
                    onClick={() => setSelectedMood('All')}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Reset Theme
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {MOOD_CATEGORIES.map((mood) => {
                  const isSelected = selectedMood === mood;
                  return (
                    <button
                      key={mood}
                      onClick={() => setSelectedMood(mood)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-pink-600 text-white shadow-sm ring-1 ring-pink-400'
                          : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                      }`}
                    >
                      {mood}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                Found <strong className="text-purple-300">{filteredVerses.length}</strong> verses
                {searchQuery ? ` matching "${searchQuery}"` : ''}
                {selectedBook !== 'All Books' ? ` in ${selectedBook}` : ''}
              </span>
              {(searchQuery || selectedBook !== 'All Books' || selectedMood !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedBook('All Books');
                    setSelectedMood('All');
                    setSearchResults([]);
                  }}
                  className="text-purple-400 hover:text-purple-300 text-[11px] font-semibold"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* AI Search Matches if user triggered Find */}
            {searchResults.length > 0 && (
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    AI Bible Discoveries ({searchResults.length})
                  </span>
                  <button
                    onClick={() => setSearchResults([])}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="space-y-1.5">
                  {searchResults.map(({ verse: v, relevanceExplanation }) => (
                    <div
                      key={v.id}
                      onClick={() => onChangeVerse(v)}
                      className="p-2.5 rounded-lg bg-slate-900/80 border border-purple-500/30 hover:border-purple-400 cursor-pointer transition text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-amber-300">{v.reference}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200">
                          {v.translation}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 line-clamp-2">"{v.text}"</p>
                      {relevanceExplanation && (
                        <p className="text-[10px] text-purple-300/80 italic mt-0.5">✦ {relevanceExplanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verses Scrollable List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredVerses.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-400">
                    No verses found in curated library matching "{searchQuery}".
                  </p>
                  <button
                    onClick={() => handlePerformSearch(searchQuery, selectedMood)}
                    disabled={isSearching}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isSearching ? 'Searching Bible...' : 'Search with AI'}</span>
                  </button>
                </div>
              ) : (
                filteredVerses.map((v) => {
                  const isCurrent = verse.id === v.id || verse.reference === v.reference;
                  const displayRef =
                    language === 'ml' && v.referenceMl
                      ? v.referenceMl
                      : language === 'hi' && v.referenceHi
                      ? v.referenceHi
                      : v.reference;

                  const displayText =
                    language === 'ml' && v.textMl
                      ? v.textMl
                      : language === 'hi' && v.textHi
                      ? v.textHi
                      : language === 'hinglish' && v.textHinglish
                      ? v.textHinglish
                      : v.text;

                  return (
                    <div
                      key={v.id}
                      onClick={() => onChangeVerse(v)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-purple-900/35 border-purple-500 ring-2 ring-purple-500/50 shadow-md'
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-300 font-cinzel">
                            {displayRef}
                          </span>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {language === 'hi' ? 'हिन्दी' : language === 'ml' ? 'മലയാളം' : v.translation}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/70 text-purple-300 hidden sm:inline">
                            {v.mood}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        "{displayText}"
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Language Selection & Featured Verse Pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Language:</span>
                <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-700">
                  {(
                    [
                      { id: 'en', label: 'English' },
                      { id: 'hi', label: 'हिन्दी' },
                      { id: 'hinglish', label: 'Hinglish' },
                      { id: 'ml', label: 'മലയാളം' },
                    ] as { id: AppLanguage; label: string }[]
                  ).map((lang) => {
                    const isSelected = language === lang.id;
                    return (
                      <button
                        key={lang.id}
                        onClick={() => {
                          if (onChangeLanguage) onChangeLanguage(lang.id);
                          if ((lang.id === 'hi' && !verse.textHi) || (lang.id === 'ml' && !verse.textMl)) {
                            const rom8 = CURATED_VERSES.find((v) => v.id === 'rom-8-38-39');
                            if (rom8) onChangeVerse(rom8);
                          }
                        }}
                        className={`px-2 py-0.5 text-xs font-semibold rounded-md transition ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {lang.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick load button for Romans 8:39 */}
              <button
                onClick={() => {
                  const rom8 = CURATED_VERSES.find((v) => v.id === 'rom-8-38-39');
                  if (rom8) {
                    onChangeVerse(rom8);
                    if (onChangeLanguage && language !== 'hi' && language !== 'ml') {
                      onChangeLanguage('hi');
                    }
                  }
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 font-semibold transition flex items-center gap-1"
                title="Load Romans 8:39 translation"
              >
                <span>
                  {language === 'ml'
                    ? '✨ Romans 8:39 (മലയാളം)'
                    : language === 'hi'
                    ? '✨ Romans 8:39 (हिन्दी)'
                    : '✨ Romans 8:39 (Featured)'}
                </span>
              </button>
            </div>

            {/* Custom Verse Editor (Collapsible) */}
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 overflow-hidden">
              <button
                onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900/50 transition"
              >
                <span className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-purple-400" />
                  {language === 'ml'
                    ? 'വചനം നേരിട്ട് തിരുത്തുക (Custom Editor)'
                    : language === 'hi'
                    ? 'वचन स्वयं लिखें / संपादित करें (Custom Editor)'
                    : 'Edit Verse Text or Custom Scripture'}
                </span>
                <span className="text-[11px] text-purple-400 font-semibold">
                  {isEditorExpanded ? '▲ Hide' : '▼ Expand'}
                </span>
              </button>

              {isEditorExpanded && (
                <div className="p-3.5 pt-1 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Translation & Version:</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={language === 'ml' ? 'BSI-Malayalam' : language === 'hi' ? 'BSI-Hindi' : verse.translation}
                        onChange={(e) =>
                          onChangeVerse({
                            ...verse,
                            translation: e.target.value as 'NIV' | 'KJV' | 'NKJV' | 'ESV' | 'NLT' | 'CSB' | 'BSI-Hindi' | 'BSI-Malayalam',
                          })
                        }
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 outline-none"
                      >
                        {language === 'ml' ? (
                          <option value="BSI-Malayalam">BSI Malayalam (മലയാളം)</option>
                        ) : language === 'hi' ? (
                          <option value="BSI-Hindi">BSI Hindi (हिन्दी)</option>
                        ) : (
                          <>
                            <option value="NIV">NIV</option>
                            <option value="KJV">KJV</option>
                            <option value="NKJV">NKJV</option>
                            <option value="ESV">ESV</option>
                            <option value="NLT">NLT</option>
                            <option value="CSB">CSB</option>
                          </>
                        )}
                      </select>
                      <button
                        onClick={onRandomVerse}
                        className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                        title="Random verse"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={
                      language === 'ml'
                        ? verse.textMl || verse.text
                        : language === 'hi'
                        ? verse.textHi || verse.text
                        : language === 'hinglish'
                        ? verse.textHinglish || verse.text
                        : verse.text
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (language === 'ml') {
                        onChangeVerse({ ...verse, textMl: val });
                      } else if (language === 'hi') {
                        onChangeVerse({ ...verse, textHi: val });
                      } else if (language === 'hinglish') {
                        onChangeVerse({ ...verse, textHinglish: val });
                      } else {
                        onChangeVerse({ ...verse, text: val });
                      }
                    }}
                    rows={3}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs sm:text-sm focus:border-purple-500 focus:outline-none transition leading-relaxed resize-none font-serif"
                    placeholder="Enter Scripture text..."
                  />

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={
                        language === 'ml'
                          ? verse.referenceMl || verse.reference
                          : language === 'hi'
                          ? verse.referenceHi || verse.reference
                          : verse.reference
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (language === 'ml') {
                          onChangeVerse({ ...verse, referenceMl: val });
                        } else if (language === 'hi') {
                          onChangeVerse({ ...verse, referenceHi: val });
                        } else {
                          onChangeVerse({ ...verse, reference: val });
                        }
                      }}
                      placeholder="e.g. Philippians 4:6-7"
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= BACKGROUND TAB ================= */}
        {activeTab === 'background' && (
          <div className="space-y-4">
            {/* Category Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {BACKGROUND_CATEGORIES.map((cat) => {
                const isSelected = selectedBgCategory === cat;
                const count = cat === 'Community Designs' ? customBackgrounds.length : undefined;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedBgCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-pink-600 text-white shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{cat}</span>
                    {count !== undefined && count > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-pink-950/80 text-[10px] font-bold text-pink-200">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Upload Custom Background with Original Quality Toggle */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-pink-400" />
                  Upload Background (Corner Designs)
                </span>

                {/* Original Quality Toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={adjustments.originalQuality !== false}
                    onChange={(e) =>
                      onChangeAdjustments({
                        ...adjustments,
                        originalQuality: e.target.checked,
                      })
                    }
                    className="accent-emerald-500 rounded cursor-pointer w-3.5 h-3.5"
                  />
                  <span className={`text-[11px] font-semibold ${
                    adjustments.originalQuality !== false ? 'text-emerald-300' : 'text-slate-400'
                  }`}>
                    Original Quality (Lossless PNG)
                  </span>
                </label>
              </div>

              <label className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-pink-500 bg-slate-950/40 hover:bg-pink-950/20 text-slate-300 hover:text-pink-200 text-xs font-semibold cursor-pointer transition">
                <Upload className="w-4 h-4 text-pink-400" />
                <span>Upload Corner Floral PNG or Custom Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImage}
                  className="hidden"
                />
              </label>

              <p className="text-[10px] text-slate-400">
                Preserves crisp 1080x1920 PNG quality with transparent or clean center.
              </p>
            </div>

            {/* A) UPLOADED BACKGROUNDS: Blur = 0% by default, NEVER auto-blur! */}
            {background.type === 'custom' && (
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    Soft Focus (optional)
                  </span>
                  <span className="text-xs font-mono text-purple-300 font-bold">
                    {adjustments.uploadedBlur || 0}%
                  </span>
                </div>
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
                <p className="text-[11px] text-purple-300/80">
                  Corner floral designs stay 100% sharp by default (0% blur). Add soft focus only if desired.
                </p>
              </div>
            )}

            {/* B) PHOTO PRESETS (Celestial Clouds, Misty Mountains): 60% Photo Blur default */}
            {background.url.startsWith('http') && background.type !== 'custom' && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    Photo Blur
                  </span>
                  <span className="text-xs font-mono text-amber-300 font-bold">
                    {typeof adjustments.blur === 'number' ? adjustments.blur : 60}%
                  </span>
                </div>
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
                <p className="text-[11px] text-slate-400">
                  Softens background clouds and mountains so scripture text remains the radiant star.
                </p>
              </div>
            )}

            {/* COMMUNITY CORNER DESIGNS SECTION (Always visible when in 'Community Designs' or 'All' if community designs exist) */}
            {(selectedBgCategory === 'Community Designs' || (selectedBgCategory === 'All' && customBackgrounds.length > 0)) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3" />
                    COMMUNITY CORNER DESIGNS ({customBackgrounds.length})
                  </p>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Shared for all users
                  </span>
                </div>
                {customBackgrounds.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800 text-center">
                    <p className="text-xs text-slate-400">No community corner designs uploaded yet. Upload one above to share with everyone!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
                    {customBackgrounds.map((bg) => {
                      const isSelected =
                        background.url === bg.url ||
                        ((background as any).id && (background as any).id === bg.id);
                      return (
                        <div
                          key={bg.id}
                          className={`group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer border transition-all ${
                            isSelected
                              ? 'border-pink-500 ring-2 ring-pink-500/50 shadow-lg'
                              : 'border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <img
                            src={bg.url}
                            alt={bg.title}
                            onClick={() =>
                              onChangeBackground({
                                type: 'custom',
                                url: bg.url,
                                id: bg.id,
                              } as any)
                            }
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between pointer-events-none">
                            <span className="text-[10px] font-semibold text-white truncate">
                              {bg.title}
                            </span>
                          </div>

                          {/* Delete button (hidden for permanent system backgrounds) */}
                          {!bg.default && bg.id !== 'EEaSRLrLSJATESDVRzQz--k--' && bg.id !== 'L0xbgIH2VYpMD83zqxb_0' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCustomBackground(bg.id);
                              }}
                              className="absolute top-1.5 left-1.5 p-1 rounded-md bg-black/60 hover:bg-red-600 text-white/80 hover:text-white transition"
                              title="Delete custom background"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}

                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-md">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Preset Gallery Grid */}
            {selectedBgCategory !== 'Community Designs' && (
              <div>
                {selectedBgCategory === 'All' && customBackgrounds.length > 0 && (
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Curated Presets Library
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {filteredPresetBackgrounds.map((bg) => {
                    const isSelected = background.url === bg.url;
                    const isGradient = bg.url.startsWith('gradient:');
                    return (
                      <div
                        key={bg.id}
                        onClick={() =>
                          onChangeBackground({
                            type: isGradient ? 'gradient' : 'preset',
                            url: bg.url,
                          })
                        }
                        className={`group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer border transition-all ${
                          isSelected
                            ? 'border-pink-500 ring-2 ring-pink-500/50 shadow-lg shadow-pink-950/40'
                            : 'border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        {bg.url === 'clean:soft-gradient' ? (
                          <div
                            className="w-full h-full"
                            style={{
                              background: 'linear-gradient(135deg, #FFE8D6 0%, #FFD6BA 45%, #FECDD3 100%)',
                            }}
                          />
                        ) : bg.url === 'clean:parchment' ? (
                          <div
                            className="w-full h-full"
                            style={{
                              background: 'radial-gradient(circle, #FFF9ED 0%, #F5EEDB 60%, #E8DBBE 100%)',
                            }}
                          />
                        ) : bg.url === 'clean:bokeh' ? (
                          <div
                            className="w-full h-full"
                            style={{
                              background: 'linear-gradient(135deg, #FFF5EB 0%, #FDEBD8 60%, #FEDFD4 100%)',
                            }}
                          />
                        ) : bg.url === 'clean:navy-gold' ? (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{
                              background: '#1A2332',
                            }}
                          >
                            <span className="text-amber-200 text-xs font-bold font-serif">GOLD TEXT</span>
                          </div>
                        ) : (
                          <img
                            src={bg.url}
                            alt={bg.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        )}

                        {/* Gradient Overlay & Title */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                        <div className="absolute bottom-1.5 left-2 right-2">
                          <p className="text-[11px] font-semibold text-white truncate drop-shadow">
                            {bg.title}
                          </p>
                          <span className="text-[9px] uppercase tracking-wider text-pink-300/80 font-bold">
                            {bg.style}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TYPOGRAPHY TAB ================= */}
        {activeTab === 'typography' && (
          <div className="space-y-4">
            {/* Clean Typography Status: Text is the Star (80% Visual Focus) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-1.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Typography is the Star (80% Visual Focus)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  Clean Mode
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Clean backgrounds (Peach, Parchment, Bokeh, Navy) with dark/gold text, strong shadow & bottom gradient.
              </p>
            </div>

            {/* Font Family Picker with live font preview */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Typography Font Family
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    'Martel',
                    'Noto Sans Devanagari',
                    'Poppins',
                    'Noto Sans Malayalam',
                    'Playfair Display',
                    'Cinzel',
                    'Cormorant Garamond',
                    'Great Vibes',
                    'Lora',
                    'Montserrat',
                    'Dancing Script',
                    'Caveat',
                    'Bebas Neue',
                  ] as FontFamily[]
                ).map((font) => {
                  const isSelected = typography.fontFamily === font;
                  const isLangRecommended =
                    (language === 'hi' && (font === 'Martel' || font === 'Noto Sans Devanagari' || font === 'Poppins')) ||
                    (language === 'hinglish' && (font === 'Poppins' || font === 'Martel')) ||
                    (language === 'ml' && font === 'Noto Sans Malayalam') ||
                    (language === 'en' && (font === 'Playfair Display' || font === 'Cinzel' || font === 'Cormorant Garamond'));

                  return (
                    <button
                      key={font}
                      onClick={() => onChangeTypography({ ...typography, fontFamily: font })}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-900/30 text-white shadow-md'
                          : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className="text-sm block truncate font-bold"
                        style={{ fontFamily: font }}
                      >
                        {font}
                      </span>
                      <span className="text-[9px] text-slate-400 block truncate">
                        {isLangRecommended ? '★ Recommended' : font === 'Great Vibes' ? 'Bold Script' : 'Serif / Sans'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size & Line Height */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Font Size ({language === 'en' ? 'Min 36px' : 'Min 28px'})</span>
                  <span className="text-purple-300 font-mono">
                    {Math.max(language === 'en' ? 36 : 28, typography.fontSize)}px
                  </span>
                </div>
                <input
                  type="range"
                  min={language === 'en' ? 36 : 28}
                  max={64}
                  value={Math.max(language === 'en' ? 36 : 28, typography.fontSize)}
                  onChange={(e) =>
                    onChangeTypography({
                      ...typography,
                      fontSize: Math.max(language === 'en' ? 36 : 28, Number(e.target.value)),
                    })
                  }
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Line Height</span>
                  <span className="text-purple-300 font-mono">{typography.lineHeight}x</span>
                </div>
                <input
                  type="range"
                  min={1.15}
                  max={2.0}
                  step={0.05}
                  value={typography.lineHeight}
                  onChange={(e) =>
                    onChangeTypography({ ...typography, lineHeight: Number(e.target.value) })
                  }
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Alignment & Text Color */}
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Alignment
                </label>
                <div className="flex rounded-xl bg-slate-950/60 border border-slate-800 p-1">
                  {(['left', 'center', 'right'] as TextAlign[]).map((align) => {
                    const isSelected = typography.textAlign === align;
                    return (
                      <button
                        key={align}
                        onClick={() => onChangeTypography({ ...typography, textAlign: align })}
                        className={`flex-1 py-1 flex items-center justify-center rounded-lg transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {align === 'left' && <AlignLeft className="w-4 h-4" />}
                        {align === 'center' && <AlignCenter className="w-4 h-4" />}
                        {align === 'right' && <AlignRight className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SMART TEXT PLACEMENT (Avoid covering subjects like kittens/cats) */}
              <div className="col-span-full pt-1">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-purple-400" />
                    <span>Text Placement & Empty Space</span>
                  </label>
                  <span className="text-[11px] text-purple-300 font-bold px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/30">
                    {typography.textPosition === 'top'
                      ? '⬆️ Top Empty Space'
                      : typography.textPosition === 'bottom'
                      ? '⬇️ Bottom'
                      : typography.textPosition === 'center'
                      ? '🎯 Center'
                      : '⚡ Auto (Smart Space)'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      onChangeTypography({
                        ...typography,
                        textPosition: 'top',
                        textOffsetY: 0,
                        safeZoneBackdrop: true,
                      })
                    }
                    className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                      typography.textPosition === 'top'
                        ? 'border-purple-400 bg-purple-500/20 text-purple-200 ring-2 ring-purple-400/30 shadow-md'
                        : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                    title="Move text to top empty area (above kittens, faces, subjects)"
                  >
                    <span className="text-sm">⬆️ Top</span>
                    <span className="text-[10px] text-slate-400 font-normal">Empty Space</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onChangeTypography({
                        ...typography,
                        textPosition: 'center',
                        textOffsetY: 0,
                      })
                    }
                    className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                      (!typography.textPosition || typography.textPosition === 'center') && !typography.textOffsetY
                        ? 'border-purple-400 bg-purple-500/20 text-purple-200 ring-2 ring-purple-400/30 shadow-md'
                        : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                    title="Center text (for Corner Floral & Clean Presets)"
                  >
                    <span className="text-sm">🎯 Center</span>
                    <span className="text-[10px] text-slate-400 font-normal">Corner Designs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onChangeTypography({
                        ...typography,
                        textPosition: 'auto',
                        textOffsetY: 0,
                      })
                    }
                    className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                      typography.textPosition === 'auto'
                        ? 'border-purple-400 bg-purple-500/20 text-purple-200 ring-2 ring-purple-400/30 shadow-md'
                        : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                    title="Auto-detect subject vs empty space"
                  >
                    <span className="text-sm">⚡ Auto</span>
                    <span className="text-[10px] text-slate-400 font-normal">Detect Subject</span>
                  </button>
                </div>

                {/* Fine-tune vertical position slider & Backdrop Protection toggle */}
                <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Vertical Fine-tune (Drag offset):</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-purple-300">{typography.textOffsetY || 0}px</span>
                      {Boolean(typography.textOffsetY) && (
                        <button
                          type="button"
                          onClick={() => onChangeTypography({ ...typography, textOffsetY: 0 })}
                          className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white bg-slate-800 border border-slate-700"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-250"
                    max="250"
                    step="5"
                    value={typography.textOffsetY || 0}
                    onChange={(e) =>
                      onChangeTypography({
                        ...typography,
                        textOffsetY: Number(e.target.value),
                      })
                    }
                    className="w-full accent-purple-400 cursor-pointer h-1.5 rounded-lg bg-slate-800"
                  />
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <label className="text-[11px] text-slate-300 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={typography.safeZoneBackdrop ?? (typography.textPosition === 'top')}
                        onChange={(e) =>
                          onChangeTypography({
                            ...typography,
                            safeZoneBackdrop: e.target.checked,
                          })
                        }
                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                      />
                      <span>Subject Protection Backdrop (soft 25% tint behind text)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="col-span-full pt-1">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Text Color: Auto / Gold Glow / Dark / White</span>
                  </label>
                  <span className="text-[11px] text-amber-300 font-bold px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-500/30">
                    {!typography.textColorMode || typography.textColorMode === 'auto'
                      ? '⚡ Auto (Smart)'
                      : typography.textColorMode === 'gold-glow'
                      ? '✨ Gold Glow'
                      : typography.textColorMode === 'dark'
                      ? '🌑 Dark'
                      : '⚪ White'}
                  </span>
                </div>

                {/* 4 Text Color Mode Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
                  <button
                    type="button"
                    onClick={async () => {
                      const canvasEl = document.querySelector('canvas') as HTMLCanvasElement | null;
                      let smartColor = '#1A1A1A';
                      if (canvasEl) {
                        smartColor = getSmartTextColor(canvasEl);
                      } else {
                        smartColor = await detectSmartTextColor(background.url);
                      }
                      const isDark = smartColor === '#FFE8A0';
                      console.log("UI Auto clicked -> smartColor:", smartColor, "isDark:", isDark);
                      onChangeTypography({
                        ...typography,
                        textColorMode: 'auto',
                        textColor: smartColor,
                        shadowStyle: isDark ? 'glow' : 'none',
                        fontWeight: isDark ? '800' : '700',
                        referenceColor: isDark ? '#FFE8A0' : (language === 'en' ? '#C5A880' : '#5C5242'),
                      });
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                      !typography.textColorMode || typography.textColorMode === 'auto'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200 ring-2 ring-amber-400/30 shadow-lg'
                        : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span className="text-sm font-extrabold flex items-center gap-1">⚡ Auto</span>
                    <span className="text-[10px] font-normal text-slate-400">Smart Detection</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onChangeTypography({
                        ...typography,
                        textColorMode: 'gold-glow',
                        textColor: '#FFE8A0',
                        shadowStyle: 'glow',
                        fontWeight: '800',
                      })
                    }
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                      typography.textColorMode === 'gold-glow'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200 ring-2 ring-amber-400/30 shadow-lg'
                        : 'border-slate-800 bg-slate-950/50 text-amber-300/90 hover:text-amber-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-sm font-extrabold text-amber-300 flex items-center gap-1">✨ Gold Glow</span>
                    <span className="text-[10px] font-normal text-amber-400/80">#FFE8A0 + Glow</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onChangeTypography({
                        ...typography,
                        textColorMode: 'dark',
                        textColor: '#1A1A1A',
                        shadowStyle: 'none',
                        fontWeight: '700',
                      })
                    }
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                      typography.textColorMode === 'dark'
                        ? 'border-purple-400 bg-purple-500/20 text-white ring-2 ring-purple-400/30 shadow-lg'
                        : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span className="text-sm font-extrabold flex items-center gap-1">🌑 Dark</span>
                    <span className="text-[10px] font-normal text-slate-400">#1A1A1A Bold</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onChangeTypography({
                        ...typography,
                        textColorMode: 'white',
                        textColor: '#FFFFFF',
                        shadowStyle: 'strong',
                        fontWeight: '800',
                      })
                    }
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                      typography.textColorMode === 'white'
                        ? 'border-blue-400 bg-blue-500/20 text-white ring-2 ring-blue-400/30 shadow-lg'
                        : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span className="text-sm font-extrabold flex items-center gap-1">⚪ White</span>
                    <span className="text-[10px] font-normal text-slate-400">#FFFFFF Bold</span>
                  </button>
                </div>

                {(!typography.textColorMode || typography.textColorMode === 'auto') && (
                  <p className="text-[11px] text-amber-200/90 bg-amber-950/40 border border-amber-500/30 rounded-xl px-3 py-2 mb-2 flex items-center gap-2">
                    <span className="text-amber-400 text-sm">💡</span>
                    <span><strong>Auto Active:</strong> Dark backgrounds (black, navy, dark green) get <strong>#FFE8A0 Champagne Gold + Glow</strong>. Light backgrounds get <strong>#1A1A1A Charcoal Black</strong>.</span>
                  </p>
                )}

                {/* Optional Custom Palette Override */}
                <div className="flex items-center justify-between pt-1 text-slate-400">
                  <span className="text-[11px] font-medium">Fine-tune swatch:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={typography.textColor}
                      onChange={(e) =>
                        onChangeTypography({ ...typography, textColor: e.target.value, textColorMode: 'dark' })
                      }
                      className="w-7 h-7 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                      title="Custom color picker"
                    />
                    {['#1A1A1A', '#FFE8A0', '#ffffff', '#C5A880', '#fed7aa', '#bae6fd'].map((c) => (
                      <button
                        key={c}
                        onClick={() => onChangeTypography({ ...typography, textColor: c, textColorMode: c === '#FFE8A0' ? 'gold-glow' : c === '#1A1A1A' ? 'dark' : c === '#ffffff' ? 'white' : 'auto' })}
                        className="w-5 h-5 rounded-full border border-slate-600 transition-transform hover:scale-125"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Ornament at Top */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Sacred Decorative Ornament
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {(
                  [
                    { id: 'none', label: 'None' },
                    { id: 'cross', label: 'Cross' },
                    { id: 'leaf-wreath', label: 'Olive Leaf' },
                    { id: 'quote-marks', label: 'Quote' },
                    { id: 'divider-line', label: 'Divider' },
                    { id: 'stars', label: 'Stars' },
                  ] as { id: DecorativeOrnament; label: string }[]
                ).map((orn) => {
                  const isSelected = typography.ornament === orn.id;
                  return (
                    <button
                      key={orn.id}
                      onClick={() => onChangeTypography({ ...typography, ornament: orn.id })}
                      className={`p-2 rounded-xl border text-xs font-medium text-center transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-900/30 text-white'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white'
                      }`}
                    >
                      {orn.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text Shadow Style */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Text Shadow & Depth
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['none', 'soft', 'strong', 'glow', 'deep'] as TextShadowStyle[]).map((shadow) => {
                  const isSelected = typography.shadowStyle === shadow;
                  return (
                    <button
                      key={shadow}
                      onClick={() => onChangeTypography({ ...typography, shadowStyle: shadow })}
                      className={`py-1.5 rounded-lg border text-xs capitalize transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-900/30 text-white'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white'
                      }`}
                    >
                      {shadow}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text Backdrop Pill / Ribbon */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Text Card / Backdrop Plate (Max Contrast)
              </label>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {(
                  [
                    { id: 'none', label: 'None' },
                    { id: 'frosted', label: 'Frosted' },
                    { id: 'pill', label: 'Pill Box' },
                    { id: 'ribbon', label: 'Ribbon' },
                    { id: 'dark-box', label: 'Dark Card' },
                  ] as { id: TextBackdropStyle; label: string }[]
                ).map((box) => {
                  const isSelected = typography.backdropStyle === box.id;
                  return (
                    <button
                      key={box.id}
                      onClick={() =>
                        onChangeTypography({ ...typography, backdropStyle: box.id })
                      }
                      className={`py-1.5 rounded-lg border text-xs capitalize transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-900/30 text-white'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white'
                      }`}
                    >
                      {box.label}
                    </button>
                  );
                })}
              </div>

              {typography.backdropStyle !== 'none' && (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Card Opacity:</span>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    value={typography.backdropOpacity}
                    onChange={(e) =>
                      onChangeTypography({
                        ...typography,
                        backdropOpacity: Number(e.target.value),
                      })
                    }
                    className="flex-1 accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono text-purple-300">
                    {typography.backdropOpacity}%
                  </span>
                </div>
              )}
            </div>

            {/* Scripture Reference Display Options */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Show Scripture Reference
                </span>
                <span className="text-[10px] text-slate-400">
                  Includes book, chapter, and translation badge
                </span>
              </div>
              <input
                type="checkbox"
                checked={typography.showReference}
                onChange={(e) =>
                  onChangeTypography({ ...typography, showReference: e.target.checked })
                }
                className="w-4 h-4 accent-purple-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ================= EFFECTS TAB ================= */}
        {activeTab === 'effects' && (
          <div className="space-y-4">
            {/* Text Legibility Scrim Toggle (Readability booster) */}
            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-200 block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Text Legibility Scrim (High Clarity Aura)
                  </span>
                  <span className="text-[10px] text-slate-300">
                    Smooth radial dark aura behind text so letters never wash out against bright skies or flowers
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={adjustments.legibilityScrim !== false}
                  onChange={(e) =>
                    onChangeAdjustments({ ...adjustments, legibilityScrim: e.target.checked })
                  }
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>

              {adjustments.legibilityScrim !== false && (
                <div className="flex items-center gap-1.5 pt-2 border-t border-purple-800/40">
                  <span className="text-[11px] text-slate-300 font-medium">Scrim Density:</span>
                  {(['subtle', 'strong', 'deep'] as ('subtle' | 'strong' | 'deep')[]).map((density) => {
                    const isSelected = (adjustments.scrimIntensity || 'strong') === density;
                    return (
                      <button
                        key={density}
                        onClick={() =>
                          onChangeAdjustments({ ...adjustments, scrimIntensity: density })
                        }
                        className={`px-2.5 py-0.5 rounded-md text-[11px] capitalize font-semibold transition ${
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {density}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Blur Controls (Separated: Soft Focus for Uploads, Photo Blur for Presets) */}
            {background.type === 'custom' ? (
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Soft Focus (optional)</span>
                  <span className="text-purple-300 font-mono">{adjustments.uploadedBlur || 0}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={adjustments.uploadedBlur || 0}
                  onChange={(e) =>
                    onChangeAdjustments({ ...adjustments, uploadedBlur: Number(e.target.value) })
                  }
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-400">
                  Corner designs stay 100% sharp by default (0%). Soft focus is optional.
                </span>
              </div>
            ) : background.url.startsWith('http') ? (
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Photo Blur</span>
                  <span className="text-indigo-300 font-mono">{typeof adjustments.blur === 'number' ? adjustments.blur : 60}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={typeof adjustments.blur === 'number' ? adjustments.blur : 60}
                  onChange={(e) =>
                    onChangeAdjustments({ ...adjustments, blur: Number(e.target.value) })
                  }
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">
                  Default 60% blur softens photo backgrounds so scripture stands out.
                </span>
              </div>
            ) : null}

            {/* Vignette */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Edge Vignette Darkness</span>
                <span className="text-indigo-300 font-mono">{adjustments.vignette}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={adjustments.vignette}
                onChange={(e) =>
                  onChangeAdjustments({ ...adjustments, vignette: Number(e.target.value) })
                }
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Brightness */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Brightness</span>
                <span className="text-indigo-300 font-mono">{adjustments.brightness}%</span>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                value={adjustments.brightness}
                onChange={(e) =>
                  onChangeAdjustments({ ...adjustments, brightness: Number(e.target.value) })
                }
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Contrast</span>
                <span className="text-indigo-300 font-mono">{adjustments.contrast}%</span>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                value={adjustments.contrast}
                onChange={(e) =>
                  onChangeAdjustments({ ...adjustments, contrast: Number(e.target.value) })
                }
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Color Tint Overlay */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Mood Color Tint Overlay
                </span>
                <input
                  type="color"
                  value={adjustments.overlayColor}
                  onChange={(e) =>
                    onChangeAdjustments({ ...adjustments, overlayColor: e.target.value })
                  }
                  className="w-7 h-7 rounded-md border border-slate-700 bg-transparent cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400">Tint:</span>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={adjustments.overlayOpacity}
                  onChange={(e) =>
                    onChangeAdjustments({
                      ...adjustments,
                      overlayOpacity: Number(e.target.value),
                    })
                  }
                  className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-indigo-300">
                  {adjustments.overlayOpacity}%
                </span>
              </div>

              {/* 1-Click Quick Overlay Presets (including 40% black so white text pops) */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">Presets:</span>
                {[
                  { label: '0% Clear', opacity: 0 },
                  { label: '25% Subtle', opacity: 25 },
                  { label: '40% Black Pop ✨', opacity: 40 },
                  { label: '60% Deep', opacity: 60 },
                ].map((p) => (
                  <button
                    key={p.opacity}
                    onClick={() =>
                      onChangeAdjustments({
                        ...adjustments,
                        overlayOpacity: p.opacity,
                        overlayColor: '#000000',
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                      adjustments.overlayOpacity === p.opacity
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Watercolor Texture Overlay Toggle */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Watercolor Canvas Texture
                </span>
                <span className="text-[10px] text-slate-400">
                  Adds subtle handmade paper texture and watercolor wash
                </span>
              </div>
              <input
                type="checkbox"
                checked={adjustments.watercolorTexture}
                onChange={(e) =>
                  onChangeAdjustments({ ...adjustments, watercolorTexture: e.target.checked })
                }
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

