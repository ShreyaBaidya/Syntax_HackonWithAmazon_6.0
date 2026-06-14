'use client';
import { useState } from 'react';
import { Search, Mic, Sparkles } from 'lucide-react';
import { useSpeech } from '@/lib/use-speech';
import type { BudgetTier } from '@/types';

interface SearchBarProps { onSearch: (query: string, budget: BudgetTier) => void; isLoading: boolean; }

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [budget, setBudget] = useState<BudgetTier>('standard');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const { isListening, isSupported, toggleListening } = useSpeech({ onResult: (t) => { setQuery(t); setVoiceError(null); }, onError: (e) => { setVoiceError(e); setTimeout(() => setVoiceError(null), 4000); } });
  const suggestions = ['Biryani for 6 people','Fix my cold','Quick breakfast before office','Movie night with friends','Feed my kid healthy food','Date night dinner','Gain muscle meal prep','House party for 10'];
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (query.trim()) onSearch(query, budget); };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-amazon-orange/20 focus-within:border-amazon-orange transition-colors">
          <div className="pl-4"><Sparkles className="h-5 w-5 text-amazon-orange" /></div>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What do you need? Try 'Biryani for 6' or 'Fix my cold'..." className="flex-1 px-4 py-4 text-lg text-gray-800 placeholder-gray-400 focus:outline-none" disabled={isLoading} />
          <button type="button" onClick={toggleListening} className={`p-3 transition-colors relative ${isListening ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-amazon-orange'}`} aria-label="Voice input">
            <Mic className="h-5 w-5" />
            {isListening && <span className="absolute top-1 right-1 flex h-2.5 w-2.5"><span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative rounded-full h-2.5 w-2.5 bg-red-500"></span></span>}
          </button>
          <button type="submit" disabled={isLoading || !query.trim()} className="bg-amazon-orange hover:bg-amazon-orange-dark disabled:bg-gray-300 text-white px-6 py-4 font-semibold transition-colors flex items-center gap-2">
            <Search className="h-5 w-5" /><span className="hidden sm:inline">{isLoading ? 'Building...' : 'Build Cart'}</span>
          </button>
        </div>
      </form>
      {isListening && <p className="text-center text-amazon-orange text-sm mt-2 animate-pulse">🎙️ Listening...</p>}
      {voiceError && <p className="text-center text-red-400 text-sm mt-2">{voiceError}</p>}
      <div className="flex items-center gap-2 mt-3 px-2">
        <label className="text-gray-300 text-sm">Budget:</label>
        <select value={budget} onChange={(e) => setBudget(e.target.value as BudgetTier)} className="bg-amazon-blue-light text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:border-amazon-orange focus:outline-none">
          <option value="budget">💰 Budget</option><option value="standard">⭐ Standard</option><option value="premium">✨ Premium</option>
        </select>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((s) => <button key={s} onClick={() => { setQuery(s); onSearch(s, budget); }} disabled={isLoading} className="px-3 py-1.5 bg-amazon-blue-light/50 hover:bg-amazon-blue-light text-gray-300 hover:text-white text-sm rounded-full border border-gray-600 hover:border-amazon-orange transition-all disabled:opacity-50">{s}</button>)}
      </div>
    </div>
  );
}
