import { GoogleGenAI } from '@google/genai';
import { CURATED_VERSES } from '../data/verses';
import { MoodCategory, Verse } from '../types';

export interface VerseSearchResult {
  verse: Verse;
  relevanceExplanation?: string;
  source: 'ai' | 'curated';
}

export async function searchVersesSmart(query: string, mood?: MoodCategory): Promise<VerseSearchResult[]> {
  const cleanQuery = query.trim().toLowerCase();

  // 1. Fast local search across curated library first
  let localMatches = CURATED_VERSES.filter((v) => {
    const matchesMood = !mood || mood === 'All' || v.mood === mood;
    if (!matchesMood) return false;
    if (!cleanQuery) return true;
    return (
      v.text.toLowerCase().includes(cleanQuery) ||
      v.reference.toLowerCase().includes(cleanQuery) ||
      (v.theme && v.theme.toLowerCase().includes(cleanQuery))
    );
  });

  // If query is short or matched local nicely without needing generative search, return results
  if (localMatches.length > 0 && cleanQuery.length < 3) {
    return localMatches.map((verse) => ({ verse, source: 'curated' }));
  }

  // 2. Try Gemini API for deep situational/mood matching if query is complex or no local match
  const apiKey = process.env.GEMINI_API_KEY || (typeof window !== 'undefined' && (window as unknown as { GEMINI_API_KEY?: string }).GEMINI_API_KEY);

  if (apiKey && cleanQuery.length >= 3) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `The user is searching for a Bible verse matching this situation or request: "${query}" (category: ${mood || 'any'}).
Please find 3 inspiring, accurate Bible verses that address this need.
Return ONLY valid JSON matching this schema:
[
  {
    "reference": "Book Chapter:Verse",
    "text": "The full scripture text",
    "translation": "NIV",
    "mood": "Peace & Rest",
    "theme": "Theme title",
    "relevanceExplanation": "Short 1-sentence note on why this verse comforts or guides"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      const responseText = response.text?.trim();
      if (responseText) {
        const parsed = JSON.parse(responseText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const aiResults: VerseSearchResult[] = parsed.map((item, index) => ({
            verse: {
              id: `ai-${Date.now()}-${index}`,
              reference: item.reference || 'Scripture',
              text: item.text || '',
              mood: (item.mood as MoodCategory) || 'Peace & Rest',
              translation: item.translation || 'NIV',
              theme: item.theme || 'Inspiration'
            },
            relevanceExplanation: item.relevanceExplanation,
            source: 'ai'
          }));

          // Combine AI results with any local matches
          const combined = [...aiResults, ...localMatches.map((verse) => ({ verse, source: 'curated' as const }))];
          return combined;
        }
      }
    } catch (err) {
      console.warn('Gemini verse search fallback:', err);
    }
  }

  // Fallback to local matches or curated
  if (localMatches.length === 0 && cleanQuery) {
    // fuzzy match words
    const words = cleanQuery.split(/\s+/).filter(w => w.length > 2);
    localMatches = CURATED_VERSES.filter((v) => {
      const target = `${v.text} ${v.reference} ${v.mood} ${v.theme || ''}`.toLowerCase();
      return words.some(w => target.includes(w));
    });
  }

  return (localMatches.length > 0 ? localMatches : CURATED_VERSES.slice(0, 8)).map((verse) => ({
    verse,
    source: 'curated'
  }));
}
